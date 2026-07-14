import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { extractIranKetabBook } from "@ghafaseh/iranketab-extractor";
import { buildAdminIranKetabPreview, isTrustedCoverUrl } from "./preview";

const fixtures=path.resolve(process.cwd(),"packages/iranketab-extractor/fixtures");
for(const [name,url,count] of [["white-nights","https://www.iranketab.ir/book/1045-white-nights",23],["foucaults-pendulum","https://www.iranketab.ir/book/1896-foucault-s-pendulum",1]] as const){test(`${name} maps to a safe preview`,async()=>{const html=await readFile(path.join(fixtures,name,"raw-page.html"),"utf8");const extraction=await extractIranKetabBook({url,html});extraction.book.description='<p onclick="x()">متن امن<script>alert(1)</script><iframe src="x"></iframe></p>';const preview=buildAdminIranKetabPreview(extraction);assert.equal(preview.catalog.title,extraction.book.title);assert.equal(preview.editions.length,count);assert.match(preview.catalog.sanitizedDescriptionHtml,/متن امن/);assert.doesNotMatch(preview.catalog.sanitizedDescriptionHtml,/script|iframe|onclick/i);assert.equal(JSON.stringify(preview).includes("raw-page"),false);});}
test("cover preview uses an exact trusted host and path allowlist",()=>{assert.equal(isTrustedCoverUrl("https://www.iranketab.ir/Images/ProductImages/a.jpg"),true);assert.equal(isTrustedCoverUrl("https://img.iranketab.ir/Files/AttachFiles/a.jpg"),true);assert.equal(isTrustedCoverUrl("https://evil-iranketab.ir/Images/ProductImages/a.jpg"),false);assert.equal(isTrustedCoverUrl("https://www.iranketab.ir/profile/a.jpg"),false);});
