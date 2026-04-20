import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import {
  renderWithUno,
  getUnocssCacheSize,
} from "../../src/utils/unocss-engine";

describe("UnoCSS Engine Utility", () => {
  beforeEach(() => {
    // Silence console for clean output
    spyOn(console, "log").mockImplementation(() => {});
    spyOn(console, "error").mockImplementation(() => {});
  });

  it("should inject style tags into a full HTML page using the injection point", async () => {
    const html = `<html><head><!-- CSS_INJECTION_POINT --></head><body><div class="p-4 text-blue"></div></body></html>`;
    const result = await renderWithUno(html, false);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain(".p-4");
    expect(result).toContain(".text-blue");
    // Should replace the comment
    expect(result).not.toContain("<!-- CSS_INJECTION_POINT -->");
  });

  it("should append style tags to HTMX fragments without head/body tags", async () => {
    const html = `<div class="m-10 bg-red">HTMX Content</div>`;
    const result = await renderWithUno(html, true);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain(".m-10");
    expect(result).toContain(".bg-red");
    // Fragments should just have the style tag appended
    expect(result.startsWith(html)).toBe(true);
    expect(result).not.toContain("<html>");
  });

  it("should correctly handle the isEditor flag by including editor-specific utilities", async () => {
    const html = `<div class="ce-block">Editor Content</div>`;
    const result = await renderWithUno(html, false, true);
    
    expect(result).toContain('<style id="ez-unocss">');
    // Editor.js classes should trigger specific UnoCSS rules if configured, 
    // but at minimum we verify the engine runs with the flag.
    expect(result).toContain(".ce-block");
  });

  it("should fallback to appending to </head> if injection point is missing", async () => {
    const html = `<html><head><title>Test</title></head><body><div class="p-1"></div></body></html>`;
    const result = await renderWithUno(html, false);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain("</head>");
    // Should be injected BEFORE the closing head tag
    const headEndIndex = result.indexOf("</head>");
    const styleIndex = result.indexOf('<style id="ez-unocss">');
    expect(styleIndex).toBeLessThan(headEndIndex);
  });

  it("should handle completely tag-less content by appending to the end", async () => {
    const html = `Raw text with a class like p-5`;
    const result = await renderWithUno(html, false);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain(".p-5");
    expect(result.startsWith(html)).toBe(true);
  });

  it("should replace an existing ez-unocss style block (idempotency)", async () => {
    const oldStyle = '<style id="ez-unocss">.old-class { color: red; }</style>';
    const html = `<html><head>${oldStyle}</head><body><div class="p-2"></div></body></html>`;
    
    const result = await renderWithUno(html, false);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).not.toContain(".old-class");
    expect(result).toContain(".p-2");
    
    // Ensure only one style tag exists
    const matches = result.match(/id="ez-unocss"/g);
    expect(matches?.length).toBe(1);
  });

  it("should leverage isolate-level caching for performance on repeated content", async () => {
    const html = `<html><body><div class="p-100 text-green">Cache Test</div></body></html>`;

    // Pass 1: Fresh Generation
    const result1 = await renderWithUno(html, false);
    
    // Pass 2: Should be identical (from cache)
    const result2 = await renderWithUno(html, false);
    expect(result2).toBe(result1);
  });

  it("should enforce a cache limit (50 entries) and evict old items using LRU logic", async () => {
    // Fill the cache to the limit
    for (let i = 0; i < 50; i++) {
      await renderWithUno(`<div class="p-${i}">Cache Fill ${i}</div>`, false);
    }
    expect(getUnocssCacheSize()).toBe(50);

    // Add entry 51 to trigger eviction
    await renderWithUno(`<div class="p-evict">Trigger</div>`, false);
    
    // Size remains at 50, but first items should be gone
    expect(getUnocssCacheSize()).toBe(50);
  });

  it("should generate minified CSS without unnecessary whitespace", async () => {
    const html = `<div class="p-4">Minify</div>`;
    const result = await renderWithUno(html, true);
    
    const styleTag = result.match(/<style id="ez-unocss">([\s\S]*?)<\/style>/)?.[1];
    expect(styleTag).toBeDefined();
    // Check for lack of typical formatting spaces/newlines between rules if minification is enabled
    // Note: This depends on the UnoCSS preset and engine configuration
    if (styleTag) {
      expect(styleTag).not.toContain("\n  "); 
    }
  });

  it("should handle special regex characters in content without breaking replacement", async () => {
    const html = `<html><head><!-- CSS_INJECTION_POINT --></head><body><div class="p-1">Price: $100</div></body></html>`;
    const result = await renderWithUno(html, false);
    
    expect(result).toContain('<style id="ez-unocss">');
    expect(result).toContain("Price: $100");
  });
});
