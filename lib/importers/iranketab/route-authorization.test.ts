import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";
import { createIranKetabPreviewPost } from "./preview-handler";
import { resetIranKetabPreviewLimiterForTests } from "./rate-limit";

const emptyData={catalogs:[],editions:[],references:[],externalLinks:[]};
const request=()=>new NextRequest("http://localhost/api/admin/books/import-links/preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:"https://www.iranketab.ir/book/1045-white-nights"})});
test("preview API rejects unauthenticated and regular users before fetching",async()=>{for(const [status,code] of [[401,"UNAUTHENTICATED"],[403,"FORBIDDEN"]] as const){let fetched=false;const handler=createIranKetabPreviewPost({authorize:async()=>({error:NextResponse.json({ok:false,code},{status})}) as never,secureFetch:async()=>{fetched=true;throw new Error();},loadAnalysisData:async()=>emptyData});const response=await handler(request());assert.equal(response.status,status);assert.equal(fetched,false);}});
test("preview API accepts an authorized admin without persistence",async()=>{resetIranKetabPreviewLimiterForTests();const html=await readFile("packages/iranketab-extractor/fixtures/white-nights/raw-page.html","utf8");const handler=createIranKetabPreviewPost({authorize:async()=>({user:{id:"admin-1"}}) as never,secureFetch:async canonicalUrl=>({canonicalUrl,html}),loadAnalysisData:async()=>emptyData});const response=await handler(request());const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.success,true);assert.equal(payload.preview.editions.length,23);assert.equal(payload.analysis.summary.catalogStatus,"NEW");assert.equal("html" in payload,false);});
