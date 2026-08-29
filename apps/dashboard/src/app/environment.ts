import dashboardPackage from "../../package.json";

export function getPublicApiUrl() {
  return (
    import.meta.env.VITE_PUBLIC_API_URL ??
    process.env.VITE_PUBLIC_API_URL ??
    "http://localhost:3080"
  );
}

export function getPublicVersion() {
  return dashboardPackage.version;
}

export function getUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (import.meta.env.VITE_PUBLIC_URL) {
    return import.meta.env.VITE_PUBLIC_URL;
  }

  if (process.env.VITE_PUBLIC_URL) {
    return process.env.VITE_PUBLIC_URL;
  }

  if (process.env.VERCEL_TARGET_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3001";
}
