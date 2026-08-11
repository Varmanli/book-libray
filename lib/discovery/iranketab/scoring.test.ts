import assert from "node:assert/strict";
import test from "node:test";

import { calculateItemScore } from "./scoring";

test("single high-value award source receives a high priority score", () => {
  const result = calculateItemScore({
    id: "item-1",
    canonicalUrl: "https://www.iranketab.ir/book/466-the-moonstone",
    status: "DISCOVERED",
    memberships: [
      {
        sourceId: "booker",
        sourceName: "Booker Prize",
        sourceType: "AWARD",
        sourceImportance: 100,
        sourcePosition: 1,
      },
    ],
  });

  assert.equal(result.priorityScore, 85);
  assert.equal(result.breakdown.sourceScore, 70);
  assert.equal(result.breakdown.positionBonus, 15);
  assert.equal(result.importConfidence, "HIGH");
});

test("multiple source discovery adds an explainable corroboration bonus", () => {
  const result = calculateItemScore({
    id: "item-2",
    canonicalUrl: "https://www.iranketab.ir/book/466-the-moonstone",
    status: "SCORED",
    memberships: [
      {
        sourceId: "award",
        sourceName: "Award",
        sourceType: "AWARD",
        sourceImportance: 100,
        sourcePosition: 80,
      },
      {
        sourceId: "canon",
        sourceName: "Canonical list",
        sourceType: "CURATED_LIST",
        sourceImportance: 90,
        sourcePosition: 20,
      },
    ],
  });

  assert.equal(result.breakdown.multiSourceBonus, 5);
  assert.equal(result.breakdown.positionBonus, 10);
  assert.equal(result.priorityScore, 85);
  assert.match(result.breakdown.reasons.join(" "), /2 منبع مستقل/);
});

test("low-importance discovery source remains low confidence", () => {
  const result = calculateItemScore({
    id: "item-3",
    canonicalUrl: "https://www.iranketab.ir/book/50387-the-woman-in-white",
    status: "DISCOVERED",
    memberships: [
      {
        sourceId: "search",
        sourceName: "Search result",
        sourceType: "SEARCH",
        sourceImportance: 20,
        sourcePosition: null,
      },
    ],
  });

  assert.equal(result.priorityScore, 12);
  assert.equal(result.importConfidence, "LOW");
});
