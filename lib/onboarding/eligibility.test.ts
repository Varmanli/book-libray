import assert from "node:assert/strict";
import test from "node:test";

import {
  canStartBookNotesTour,
  canStartBookReadingTour,
  canStartProfileMenuTour,
} from "./eligibility";

test("guests are not eligible for the profile menu tour", () => {
  assert.equal(
    canStartProfileMenuTour({ isAuthenticated: false, hasSeenTour: false, hasActiveTour: false }),
    false,
  );
});

test("an authenticated unseen user can start the profile menu tour", () => {
  assert.equal(
    canStartProfileMenuTour({ isAuthenticated: true, hasSeenTour: false, hasActiveTour: false }),
    true,
  );
});

test("seen and concurrently active tours cannot start the profile menu tour", () => {
  assert.equal(
    canStartProfileMenuTour({ isAuthenticated: true, hasSeenTour: true, hasActiveTour: false }),
    false,
  );
  assert.equal(
    canStartProfileMenuTour({ isAuthenticated: true, hasSeenTour: false, hasActiveTour: true }),
    false,
  );
});

test("book-reading tour requires an authenticated user and all real targets", () => {
  assert.equal(
    canStartBookReadingTour({
      isAuthenticated: false,
      hasSeenTour: false,
      hasActiveTour: false,
      hasAllTargets: true,
    }),
    false,
  );
  assert.equal(
    canStartBookReadingTour({
      isAuthenticated: true,
      hasSeenTour: false,
      hasActiveTour: false,
      hasAllTargets: false,
    }),
    false,
  );
  assert.equal(
    canStartBookReadingTour({
      isAuthenticated: true,
      hasSeenTour: false,
      hasActiveTour: false,
      hasAllTargets: true,
    }),
    true,
  );
});

test("book-notes tour needs an authenticated user and two meaningful targets", () => {
  assert.equal(
    canStartBookNotesTour({
      isAuthenticated: false,
      hasSeenTour: false,
      hasActiveTour: false,
      targetCount: 3,
    }),
    false,
  );
  assert.equal(
    canStartBookNotesTour({
      isAuthenticated: true,
      hasSeenTour: false,
      hasActiveTour: false,
      targetCount: 1,
    }),
    false,
  );
  assert.equal(
    canStartBookNotesTour({
      isAuthenticated: true,
      hasSeenTour: true,
      hasActiveTour: false,
      targetCount: 3,
    }),
    false,
  );
  assert.equal(
    canStartBookNotesTour({
      isAuthenticated: true,
      hasSeenTour: false,
      hasActiveTour: false,
      targetCount: 2,
    }),
    true,
  );
});
