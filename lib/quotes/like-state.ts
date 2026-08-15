export function normalizeQuoteLikeState(
  likeCount: number,
  likedByViewer: boolean | null | undefined,
) {
  return {
    likeCount: Math.max(0, likeCount),
    likedByViewer: Boolean(likedByViewer),
  };
}
