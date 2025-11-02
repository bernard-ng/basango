import { describe, expect, it, vi } from "vitest";

import { OpenGraphProvider } from "@/http/open-graph";

const sampleHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Example Article</title>
    <meta property="og:title" content="Open Graph Title" />
    <meta property="og:description" content="Summary" />
    <meta property="og:image" content="https://cdn.example.com/image.jpg" />
    <meta property="og:url" content="https://example.com/article" />
    <link rel="canonical" href="https://example.com/canonical" />
  </head>
  <body>
    <img src="https://cdn.example.com/fallback.jpg" />
  </body>
</html>
`;

describe("OpenGraphProvider", () => {
  it("extracts metadata from html", () => {
    const metadata = OpenGraphProvider.consumeHtml(sampleHtml, "https://example.com");

    expect(metadata).toEqual({
      title: "Open Graph Title",
      description: "Summary",
      image: "https://cdn.example.com/image.jpg",
      url: "https://example.com/article",
    });
  });

  it("falls back to null when no metadata present", () => {
    const empty = OpenGraphProvider.consumeHtml("<html><body></body></html>");
    expect(empty).toBeNull();
  });

  it("fetches metadata from url", async () => {
    const response = new Response(sampleHtml, { status: 200 });
    const get = vi.fn().mockResolvedValue(response);

    const provider = new OpenGraphProvider({ client: { get } });
    const metadata = await provider.consumeUrl("https://example.com/article");

    expect(get).toHaveBeenCalledWith("https://example.com/article");
    expect(metadata?.title).toBe("Open Graph Title");
  });
});
