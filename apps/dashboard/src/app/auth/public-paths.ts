const PUBLIC_AUTH_PATHS = new Set(["/forgot-password", "/login", "/reset-password"]);

export function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.has(pathname);
}
