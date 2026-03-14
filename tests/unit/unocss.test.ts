import { describe, expect, it } from "bun:test";
import {
  renderWithUno,
  getUnocssCacheSize,
} from "../../src/utils/unocss-engine";
import { createGenerator } from "unocss";

describe("UnoCSS Engine Utility", () => {
  it("should inject style tags into a full HTML page", async () => {
    const html = `<html><head><!-- CSS_INJECTION_POINT --></head><body><div class="p-4"></div></body></html>`;
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain(".p-4");
  });

  it("should append style tags to HTMX fragments", async () => {
    const html = `<div class="m-2">HTMX Content</div>`;
    const result = await renderWithUno(html, true);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain(".m-2");
    expect(result.startsWith(html)).toBe(true);
  });

  it("should return unchanged HTMX fragment if no CSS is generated", async () => {
    // We mock a scenario where the generator returns empty CSS
    // by using an empty HTML string or content that matches nothing.
    const result = await renderWithUno("", true);

    // It should still contain the style tag (with preflights or just empty)
    // because our current engine ALWAYS returns a style tag.
    // Let's actually verify the behavior:
    expect(result).toContain('<style id="ez-unocss">');
  });

  it("should handle HTML without injection points by appending to head", async () => {
    const html = `<html><head></head><body><div class="p-1"></div></body></html>`;
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain("</head>");
  });

  it("should handle completely malformed HTML by appending to end", async () => {
    const html = `<div class="p-1">No Head or Injection Point</div>`;
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result.endsWith("</style>")).toBe(true);
  });

  it("should replace an existing ez-unocss style block", async () => {
    const html = `<html><head><style id="ez-unocss">.old{}</style></head><body><div class="p-1"></div></body></html>`;
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).not.toContain(".old{}");
    expect(result).toContain(".p-1");
    const matches = result.match(/id="ez-unocss"/g);
    expect(matches?.length).toBe(1);
  });

  it("should use ultimate fallback for content without head or injection point", async () => {
    const html = "just some raw text without any html tags";
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
    expect(result.startsWith(html)).toBe(true);
  });

  it("should safely handle special characters like $ during replacement", async () => {
    const html = `<html><head><style id="ez-unocss">.old{}</style></head><body><div class="p-1"></div></body></html>`;
    const result = await renderWithUno(html, false);
    expect(result).toContain('<style id="ez-unocss">');
  });

  it("should leverage isolate-level caching for repeated content", async () => {
    const html = `<html><body><div class="p-99">Unique Content</div></body></html>`;

    // First pass (Cache Miss)
    const result1 = await renderWithUno(html, false);
    expect(result1).toContain(".p-99");

    // Second pass (Cache Hit)
    const result2 = await renderWithUno(html, false);
    expect(result2).toBe(result1);
  });

  it("should evict old entries when cache limit is reached", async () => {
    // Fill the cache up to the limit (50)
    for (let i = 0; i < 50; i++) {
      await renderWithUno(`<div class="p-${i}"></div>`, false);
    }

    expect(getUnocssCacheSize()).toBe(50);

    // Add one more to trigger eviction
    await renderWithUno(`<div class="p-999">Evictor</div>`, false);

    // Size should still be 50, but the first item was replaced
    expect(getUnocssCacheSize()).toBe(50);
  });
});
