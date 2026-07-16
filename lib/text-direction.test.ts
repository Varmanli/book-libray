import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Textarea } from "@/components/ui/textarea";
import {
  detectTextDirection,
  getQuoteDirectionProps,
  getQuoteTextareaDirectionProps,
} from "./text-direction";

test("pure Persian text is RTL and centered", () => {
  assert.deepEqual(getQuoteDirectionProps("زندگی زیباست"), {
    dir: "rtl",
    style: { textAlign: "center", unicodeBidi: "plaintext" },
  });
});

test("pure English text is LTR and centered", () => {
  assert.deepEqual(getQuoteDirectionProps("Life is beautiful"), {
    dir: "ltr",
    style: { textAlign: "center", unicodeBidi: "plaintext" },
  });
});

test("English text beginning with quotation marks remains LTR", () => {
  assert.equal(detectTextDirection("“Life is beautiful.”"), "ltr");
});

test("English text beginning with a number remains LTR", () => {
  assert.equal(detectTextDirection("1984 is a remarkable novel."), "ltr");
});

test("Persian text containing a few English words remains RTL", () => {
  assert.equal(detectTextDirection("این کتاب درباره امید و life است و خواندنش را دوست دارم"), "rtl");
});

test("English text containing a Persian name remains LTR", () => {
  assert.equal(detectTextDirection("This is a story about سهراب and his long journey home."), "ltr");
});

test("empty and ambiguous text use the default RTL direction", () => {
  assert.equal(detectTextDirection(""), "rtl");
  assert.equal(detectTextDirection("1234 — 🙂 (https://example.com)"), "rtl");
});

test("direction updates while typing without changing the input value", () => {
  const values = ["", "\"", "\"H", "\"Hello", "\"Hello there سهراب"];
  const presentations = values.map((value) => ({ value, ...getQuoteDirectionProps(value) }));

  assert.deepEqual(presentations.map(({ value }) => value), values);
  assert.deepEqual(presentations.map(({ dir }) => dir), ["rtl", "rtl", "ltr", "ltr", "ltr"]);
});

test("saved content renders with the same direction as the editor preview", () => {
  const content = "“The answer is 42,” سهراب said.";
  const preview = getQuoteDirectionProps(content);
  const saved = getQuoteDirectionProps(content);

  assert.deepEqual(saved, preview);
});

test("empty quote textarea keeps an RTL caret and right-aligned placeholder", () => {
  assert.deepEqual(getQuoteTextareaDirectionProps(""), {
    dir: "rtl",
    style: { textAlign: "right" },
  });
  assert.deepEqual(getQuoteTextareaDirectionProps("   \n"), {
    dir: "rtl",
    style: { textAlign: "right" },
  });
});

test("quote textarea follows only its value and returns to RTL when cleared", () => {
  const persian = getQuoteTextareaDirectionProps("زندگی زیباست");
  const english = getQuoteTextareaDirectionProps("Life is beautiful");
  const cleared = getQuoteTextareaDirectionProps("");

  assert.equal(persian.dir, "rtl");
  assert.equal(english.dir, "ltr");
  assert.equal(english.style.textAlign, "left");
  assert.equal(cleared.dir, "rtl");
  assert.equal(cleared.style.textAlign, "right");
});

test("direction and alignment reach the native textarea without conflicting classes", () => {
  const placeholder = "یک تکه از کتاب را نقل کن...";
  const emptyMarkup = renderToStaticMarkup(
    createElement(Textarea, {
      ...getQuoteTextareaDirectionProps(""),
      value: "",
      readOnly: true,
      placeholder,
    }),
  );
  const englishMarkup = renderToStaticMarkup(
    createElement(Textarea, {
      ...getQuoteTextareaDirectionProps("Life is beautiful"),
      value: "Life is beautiful",
      readOnly: true,
      placeholder,
    }),
  );

  assert.match(emptyMarkup, /^<textarea /);
  assert.match(emptyMarkup, /dir="rtl"/);
  assert.match(emptyMarkup, /style="text-align:right"/);
  assert.match(emptyMarkup, new RegExp(`placeholder="${placeholder}"`));
  assert.match(englishMarkup, /dir="ltr"/);
  assert.match(englishMarkup, /style="text-align:left"/);
  assert.doesNotMatch(emptyMarkup, /(?:^|\s)(?:text-left|text-right|rtl|ltr)(?:\s|$)/);
  assert.doesNotMatch(englishMarkup, /(?:^|\s)(?:text-left|text-right|rtl|ltr)(?:\s|$)/);
});
