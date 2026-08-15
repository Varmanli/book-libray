import assert from "node:assert/strict";
import test from "node:test";

import {
  isTourSeen,
  markTourSeen,
  parseOnboardingState,
} from "./storage";
import {
  BOOK_READING_TOUR_ID,
  BOOK_NOTES_TOUR_ID,
  HOME_NAVIGATION_TOUR_ID,
  PROFILE_MENU_TOUR_ID,
} from "./tours";

test("an unseen onboarding tour is eligible", () => {
  assert.equal(isTourSeen(null, "home-navigation-v1"), false);
});

test("completed and skipped tours remain seen", () => {
  const completed = markTourSeen(null, PROFILE_MENU_TOUR_ID);
  const skipped = markTourSeen(null, PROFILE_MENU_TOUR_ID);

  assert.equal(isTourSeen(completed, PROFILE_MENU_TOUR_ID), true);
  assert.equal(isTourSeen(skipped, PROFILE_MENU_TOUR_ID), true);
});

test("tour versions persist independently", () => {
  const first = markTourSeen(null, HOME_NAVIGATION_TOUR_ID);
  const second = markTourSeen(first, PROFILE_MENU_TOUR_ID);
  const third = markTourSeen(second, BOOK_READING_TOUR_ID);
  const fourth = markTourSeen(third, BOOK_NOTES_TOUR_ID);

  assert.equal(isTourSeen(fourth, HOME_NAVIGATION_TOUR_ID), true);
  assert.equal(isTourSeen(fourth, PROFILE_MENU_TOUR_ID), true);
  assert.equal(isTourSeen(fourth, BOOK_READING_TOUR_ID), true);
  assert.equal(isTourSeen(fourth, BOOK_NOTES_TOUR_ID), true);
  assert.equal(isTourSeen(second, "reading-mode-v1"), false);
});

test("invalid browser storage falls back safely", () => {
  assert.deepEqual(parseOnboardingState("not-json"), {});
  assert.deepEqual(parseOnboardingState('["home-navigation-v1"]'), {});
  assert.deepEqual(parseOnboardingState('{"home-navigation-v1":false}'), {});
});
