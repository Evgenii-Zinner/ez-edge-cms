/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "bun:test";
import { themeRegistry, RuriThemeConnector, AstryxThemeConnector } from "../../../src/core/theme";

describe("Theme Registry & Base Connector Discovery", () => {
  it("should register both Ruri and Astryx connectors in themeRegistry", () => {
    const list = themeRegistry.list();
    expect(list.map((c) => c.id)).toContain("ruri");
    expect(list.map((c) => c.id)).toContain("astryx");
  });

  it("should retrieve Ruri connector with correct metadata", () => {
    const ruri = themeRegistry.get("ruri");
    expect(ruri).toBeInstanceOf(RuriThemeConnector);
    expect(ruri.id).toBe("ruri");
    expect(ruri.name).toContain("Ruri");
    expect(ruri.selfContainedNav).toBe(true);
  });

  it("should retrieve Astryx connector with correct metadata", () => {
    const astryx = themeRegistry.get("astryx");
    expect(astryx).toBeInstanceOf(AstryxThemeConnector);
    expect(astryx.id).toBe("astryx");
    expect(astryx.name).toContain("Astryx");
    expect(astryx.selfContainedNav).toBeUndefined();
  });
});
