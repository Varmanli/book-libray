export function getLibraryPath(username?: string | null) {
  return username ? `/books/${username}` : "/books";
}

/** Public profile path. Profiles live at the root `/[username]`. */
export function getProfilePath(username?: string | null) {
  return username ? `/${username}` : "/settings/profile";
}
