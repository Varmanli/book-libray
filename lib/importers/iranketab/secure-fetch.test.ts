import assert from "node:assert/strict";
import test from "node:test";
import { fetchIranKetabHtmlSecurely, isUnsafeIpAddress, SecureIranKetabFetchError, validateIranKetabBookUrl, MAX_HTML_BYTES } from "./secure-fetch";

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
const htmlResponse = (body="<html><body>book</body></html>", init: ResponseInit={}) => new Response(body,{...init,status:init.status??200,headers:{"content-type":"text/html; charset=utf-8",...(init.headers??{})}});
const code = (expected:string) => (error:unknown) => error instanceof SecureIranKetabFetchError && error.code===expected;

test("strict URL validation accepts only exact HTTPS IranKetab book paths",()=>{
  assert.equal(validateIranKetabBookUrl("https://iranketab.ir/book/1-test#pts=2").toString(),"https://iranketab.ir/book/1-test");
  assert.equal(validateIranKetabBookUrl("https://www.iranketab.ir/book/1045-white-nights").hostname,"www.iranketab.ir");
  assert.equal(validateIranKetabBookUrl("https://www.iranketab.ir/book/2589-la-b%C3%AAte-humaine").pathname,"/book/2589-la-b%C3%AAte-humaine");
  assert.equal(validateIranKetabBookUrl("https://www.iranketab.ir/book/2589-la-bête-humaine").pathname,"/book/2589-la-b%C3%AAte-humaine");
  assert.equal(validateIranKetabBookUrl("https://iranketab.ir/book/2589-test/?edition=1").pathname,"/book/2589-test/");
  assert.equal(validateIranKetabBookUrl("https://iranketab.ir/book/2589-test/?edition=1&utm_source=test").search,"");
  for(const value of ["http://iranketab.ir/book/1-test","https://u:p@iranketab.ir/book/1-test","https://iranketab.ir:444/book/1-test","https://evil-iranketab.ir/book/1-test","https://iranketab.ir.example.com/book/1-test","https://127.0.0.1/book/1-test","https://iranketab.ir/profile/1-test","https://iranketab.ir/search?q=test","https://iranketab.ir/category/1"]){assert.throws(()=>validateIranKetabBookUrl(value));}
});

test("private, loopback, link-local and reserved IP ranges are unsafe",()=>{
  for(const value of ["10.0.0.1","127.0.0.1","169.254.169.254","192.168.1.1","::1","fc00::1","fe80::1","2001:db8::1"]){assert.equal(isUnsafeIpAddress(value),true,value);}
  assert.equal(isUnsafeIpAddress("93.184.216.34"),false);
});

test("secure fetch returns bounded HTML",async()=>{const result=await fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>htmlResponse()});assert.match(result.html,/book/);});
test("DNS resolving to private address is rejected",async()=>{await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:async()=>[{address:"127.0.0.1",family:4}],fetch:async()=>htmlResponse()}),code("UNSAFE_DESTINATION"));});
test("redirect outside allowlist is rejected",async()=>{await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>new Response(null,{status:302,headers:{location:"https://example.com/book/1-test"}})}),code("REDIRECT_REJECTED"));});
test("redirect resolving to private address is rejected",async()=>{let count=0;await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:async()=>[{address:count++?"10.0.0.1":"93.184.216.34",family:4}],fetch:async()=>new Response(null,{status:302,headers:{location:"https://www.iranketab.ir/book/2-test"}})}),code("UNSAFE_DESTINATION"));});
test("too many redirects are rejected",async()=>{let n=1;await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>new Response(null,{status:302,headers:{location:`https://iranketab.ir/book/${++n}-test`}})}),code("TOO_MANY_REDIRECTS"));});
test("timeout, size, type, status and malformed HTML failures are structured",async()=>{
  await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,timeoutMs:5,fetch:async(_u,init)=>await new Promise<Response>((_resolve,reject)=>{init?.signal?.addEventListener("abort",()=>reject(new DOMException("aborted","AbortError")));})}),code("FETCH_TIMEOUT"));
  await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>htmlResponse("x",{headers:{"content-length":String(MAX_HTML_BYTES+1)}})}),code("RESPONSE_TOO_LARGE"));
  await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>new Response("{}",{headers:{"content-type":"application/json"}})}),code("INVALID_CONTENT_TYPE"));
  await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>new Response("no",{status:503,headers:{"content-type":"text/html"}})}),code("HTTP_ERROR"));
  await assert.rejects(fetchIranKetabHtmlSecurely("https://iranketab.ir/book/1-test",{lookup:publicLookup,fetch:async()=>htmlResponse("not html")} ),code("INVALID_HTML"));
});
