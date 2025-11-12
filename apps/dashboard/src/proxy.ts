import { type NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  defaultLocale: "en",
  locales: ["en"],
  urlMappingStrategy: "rewrite",
});

export default async function proxy(request: NextRequest) {
  const response = await I18nMiddleware(request);

  // const nextUrl = request.nextUrl;

  // const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // // Remove the locale from the pathname
  // const pathnameWithoutLocale = pathnameLocale
  //   ? nextUrl.pathname.slice(pathnameLocale.length + 1)
  //   : nextUrl.pathname;

  // // Create a new URL without the locale in the pathname
  // const newUrl = new URL(pathnameWithoutLocale || "/", request.url);
  // const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${newUrl.search}`;
  // const session = request.cookies.get("token")?.value;

  // // 1. Not authenticated
  // if (
  //   !session &&
  //   newUrl.pathname !== "/login" &&
  //   !newUrl.pathname.includes("/i/") &&
  //   !newUrl.pathname.includes("/s/") &&
  //   !newUrl.pathname.includes("/verify")
  // ) {
  //   const url = new URL("/login", request.url);

  //   if (encodedSearchParams) {
  //     url.searchParams.append("return_to", encodedSearchParams);
  //   }

  //   return NextResponse.redirect(url);
  // }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
