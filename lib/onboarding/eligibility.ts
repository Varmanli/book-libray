export function canStartProfileMenuTour({
  isAuthenticated,
  hasSeenTour,
  hasActiveTour,
}: {
  isAuthenticated: boolean;
  hasSeenTour: boolean;
  hasActiveTour: boolean;
}): boolean {
  return isAuthenticated && !hasSeenTour && !hasActiveTour;
}

export function canStartBookReadingTour({
  isAuthenticated,
  hasSeenTour,
  hasActiveTour,
  hasAllTargets,
}: {
  isAuthenticated: boolean;
  hasSeenTour: boolean;
  hasActiveTour: boolean;
  hasAllTargets: boolean;
}): boolean {
  return isAuthenticated && !hasSeenTour && !hasActiveTour && hasAllTargets;
}

export function canStartBookNotesTour({
  isAuthenticated,
  hasSeenTour,
  hasActiveTour,
  targetCount,
}: {
  isAuthenticated: boolean;
  hasSeenTour: boolean;
  hasActiveTour: boolean;
  targetCount: number;
}): boolean {
  return isAuthenticated && !hasSeenTour && !hasActiveTour && targetCount >= 2;
}
