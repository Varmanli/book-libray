export function calculateSuccessRate(succeeded: number, total: number) {
  return total > 0 ? Math.round((succeeded / total) * 100) : 0;
}
