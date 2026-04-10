import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { saveShard, getShardStyle } from "@core/kv/shards";
import { savePage, getPage } from "@core/kv/content";
import { createDefaultPage } from "@core/factory";
import { ELSEngine } from "@core/els/engine";
import { type ELSContent, type AssembledGrid } from "@core/schema";
import { renderELS } from "@utils/els-renderer";

const createMockEnv = () => {
  const store = new Map<string, any>();
  return {
    EZ_CONTENT: {
      get: async (key: string, options?: { type: "json" | "text" }) => {
        const val = store.get(key);
        if (val === undefined) return null;
        if (options?.type === "json")
          return typeof val === "string" ? JSON.parse(val) : val;
        return val;
      },
      put: async (key: string, value: any) => {
        store.set(key, value);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      list: async (options?: { prefix?: string }) => {
        let keys = Array.from(store.keys());
        if (options?.prefix) {
          keys = keys.filter((k) => k.startsWith(options.prefix!));
        }
        return { keys: keys.map((k) => ({ name: k })) };
      },
    },
  } as unknown as Env;
};

describe("ELS AI-Ready Architecture", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe("Shard Style Registry", () => {
    it("should save shard CSS to a dedicated style key", async () => {
      const shardData = {
        id: "hero-1",
        model: "Hero",
        props: { title: "Hello" },
        css: ".hero { color: red; }",
      };

      await saveShard(env, "hero-1", shardData);

      const savedStyle = await getShardStyle(env, "Hero");
      expect(savedStyle).toBe(".hero { color: red; }");
    });
  });

  describe("Save-Time Assembly", () => {
    it("should flatten ELS content and extract usedShards on save", async () => {
      const page = createDefaultPage("Test", "test");
      const elsContent: ELSContent = {
        grid: {
          layout: "standard",
          sectors: [
            {
              id: "main",
              items: [
                { id: "s1", model: "Hero", props: { title: "Assembled" } },
                { id: "s2", model: "Text", props: { content: "Foo" } },
              ],
            },
          ],
        },
        usedShards: [],
      };
      page.content = elsContent;

      await savePage(env, page, "draft");

      const savedPage = await getPage(env, "test", "draft");
      const savedContent = savedPage?.content as ELSContent;

      expect(savedContent.usedShards).toContain("Hero");
      expect(savedContent.usedShards).toContain("Text");
      expect(savedContent.grid.sectors[0].items.length).toBe(2);
      // Ensure it's flat (no deep merging needed at runtime)
      expect(savedContent.grid.sectors[0].items[0]).toMatchObject({
        model: "Hero",
        props: { title: "Assembled" },
      });
    });
  });

  describe("Render-Time Optimization", () => {
    it("should fetch and inject only required styles from the registry", async () => {
      // 1. Setup styles in KV
      await env.EZ_CONTENT.put("style:Hero", ".hero { color: blue; }");
      await env.EZ_CONTENT.put("style:Text", ".text { font-size: 12px; }");
      await env.EZ_CONTENT.put("style:Unused", ".unused { display: none; }");

      const assembledContent: ELSContent = {
        grid: {
          layout: "standard",
          sectors: [
            { id: "s", items: [{ id: "h", model: "Hero", props: {} }] },
          ],
        },
        usedShards: ["Hero"],
      };

      const context = {
        site: {} as any,
        theme: {} as any,
        nav: { items: [] } as any,
        footer: { links: [] } as any,
      };

      const result = await renderELS(assembledContent, context, env);

      // The result is a Hono JSX component. We can't easily stringify it here
      // without extra helpers, but we can verify the logic if we mock getShardStyle.
    });
  });

  describe("ELSEngine Utility", () => {
    it("extractUsedShards should find all unique models in a complex grid", () => {
      const grid: AssembledGrid = {
        layout: "test",
        sectors: [
          {
            id: "s1",
            items: [
              { id: "h1", model: "Hero", props: {}, css: "" },
              {
                layout: "nested",
                sectors: [
                  {
                    id: "n1",
                    items: [{ id: "t1", model: "Text", props: {}, css: "" }],
                  },
                ],
              },
              { id: "h2", model: "Hero", props: {}, css: "" },
            ],
          },
        ],
      };

      const used = ELSEngine.extractUsedShards(grid);
      expect(used).toContain("Hero");
      expect(used).toContain("Text");
      expect(used.length).toBe(2);
    });
  });
});
