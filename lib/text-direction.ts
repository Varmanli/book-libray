export type TextDirection = "rtl" | "ltr";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s]+/giu;
const LETTER_PATTERN = /\p{Letter}/u;
const ARABIC_SCRIPT_PATTERN = /\p{Script=Arabic}/u;
const LATIN_SCRIPT_PATTERN = /\p{Script=Latin}/u;

/**
 * Detects the dominant script while ignoring URLs and all non-letter content.
 * Ties and text without Arabic or Latin letters intentionally inherit the
 * application's default RTL reading direction.
 */
export function detectTextDirection(text: string | null | undefined): TextDirection {
  let arabicLetters = 0;
  let latinLetters = 0;
  const content = (text ?? "").replace(URL_PATTERN, "");

  for (const character of content) {
    if (!LETTER_PATTERN.test(character)) continue;
    if (ARABIC_SCRIPT_PATTERN.test(character)) arabicLetters += 1;
    else if (LATIN_SCRIPT_PATTERN.test(character)) latinLetters += 1;
  }

  return latinLetters > arabicLetters ? "ltr" : "rtl";
}

/** Shared DOM presentation for rendered quote content. Direction is preserved
 * for bidi handling while all quote text remains horizontally centered. */
export function getQuoteDirectionProps(text: string | null | undefined) {
  const dir = detectTextDirection(text);

  return {
    dir,
    style: {
      textAlign: "center",
      unicodeBidi: "plaintext",
    },
  } as const;
}

/**
 * Native textarea direction derived only from its controlled value. Keeping
 * unicode-bidi off the editing control lets the explicit dir attribute govern
 * the empty caret and placeholder position consistently across browsers.
 */
export function getQuoteTextareaDirectionProps(value: string | null | undefined) {
  const dir = value?.trim() ? detectTextDirection(value) : "rtl";

  return {
    dir,
    style: {
      textAlign: dir === "ltr" ? "left" : "right",
    },
  } as const;
}
