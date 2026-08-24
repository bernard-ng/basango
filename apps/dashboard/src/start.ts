import { createMiddleware, createStart } from "@tanstack/react-start";

import { isPublicAuthPath } from "#dashboard/app/auth/public-paths";
import { getPublicApiUrl } from "#dashboard/app/environment";

const authMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request, pathname, handlerType }) => {
    if (handlerType !== "router" || isStaticAsset(pathname)) {
      return next();
    }

    const localeRedirect = getLocaleRedirect(request);

    if (localeRedirect) {
      return localeRedirect;
    }

    if (pathname.startsWith("/api/")) {
      return next();
    }

    const session = await getSession(request);
    const isDashboardAdmin = session?.user.role?.split(",").includes("admin") ?? false;

    if (pathname === "/login" && isDashboardAdmin) {
      return Response.redirect(new URL("/dashboard", request.url));
    }

    if (!isPublicAuthPath(pathname) && !isDashboardAdmin) {
      const loginUrl = new URL("/login", request.url);
      const returnTo = `${pathname}${new URL(request.url).search}`;

      if (returnTo !== "/") {
        loginUrl.searchParams.set("return_to", returnTo);
      }

      return Response.redirect(loginUrl);
    }

    const result = await next();
    result.response.headers.set("X-Frame-Options", "DENY");

    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [authMiddleware],
}));

function getLocaleRedirect(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== "/en" && !url.pathname.startsWith("/en/")) {
    return null;
  }

  const nextPath = url.pathname.replace(/^\/en\/?/, "/") || "/dashboard";
  url.pathname = nextPath === "/" ? "/dashboard" : nextPath;

  return Response.redirect(url);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/_build/") ||
    pathname.startsWith("/__vite") ||
    pathname === "/favicon.ico"
  );
}

async function getSession(request: Request) {
  try {
    const cookie = request.headers.get("cookie");
    const response = await fetch(`${getPublicApiUrl()}/api/auth/get-session`, {
      headers: cookie ? { cookie } : undefined,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { user: { role?: string | null } } | null;
  } catch {
    return null;
  }
}
