export const ONBOARDING_STORAGE_KEY = "ghafaseh:onboarding";

type OnboardingState = Record<string, true>;

export function parseOnboardingState(value: string | null): OnboardingState {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, true] => entry[1] === true),
    );
  } catch {
    return {};
  }
}

export function isTourSeen(value: string | null, tourId: string): boolean {
  return parseOnboardingState(value)[tourId] === true;
}

export function markTourSeen(value: string | null, tourId: string): string {
  return JSON.stringify({ ...parseOnboardingState(value), [tourId]: true });
}
