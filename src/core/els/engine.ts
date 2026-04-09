/**
 * @module ELSEngine
 * @description The core Layout Engine responsible for orchestrating Blueprints,
 * Global Shards, and Page Overrides into a single fully hydrated tree.
 */

import {
  type ELSBlueprint,
  type ELSContent,
  type AssembledELS,
  type AssembledGrid,
  type AssembledSector,
  type AssembledShard,
  type ShardOverride,
} from "@core/schema";

import { getLayout } from "@core/kv/layouts";
import { getShard } from "@core/kv/shards";

export class ELSEngine {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Retrieves a completely merged and assembled ELS layout.
   *
   * @param pageContent The sparse content overrides provided by the page.
   * @returns A promise resolving to the fully assembled ELS structure ready for rendering.
   */
  async build(pageContent: ELSContent): Promise<AssembledELS> {
    // 1. Resolve Blueprint
    let blueprint: ELSBlueprint | null = null;
    if (pageContent.extends) {
      blueprint = await getLayout(this.env, pageContent.extends);
    }

    if (!blueprint) {
      // Fallback if no blueprint specified or found
      return {
        grid: {
          layout: pageContent.grid.layout || "standard",
          sectors: this.assembleSparseSectors(pageContent.grid.sectors || []),
        },
      };
    }

    // 2. Perform Deep Merge
    return await this.deepMerge(blueprint, pageContent);
  }

  private assembleSparseSectors(sectors: any[]): AssembledSector[] {
    return sectors.map((s) => ({
      id: s.id,
      items: (s.items || []).map((i: any) => {
        if ("model" in i || !i.layout) {
          return {
            id: i.id,
            model: i.model ?? "Unknown",
            props: i.props ?? {},
          } as AssembledShard;
        }
        return {
          layout: i.layout,
          sectors: this.assembleSparseSectors(i.sectors || []),
        } as AssembledGrid;
      }),
    }));
  }

  private async deepMerge(
    blueprint: ELSBlueprint,
    pageContent: ELSContent
  ): Promise<AssembledELS> {
    const pageGrid = pageContent.grid;

    // Evaluate Grid level
    const layout = pageGrid.layout || blueprint.grid.layout;

    const assembledSectors: AssembledSector[] = [];

    // Loop through blueprint sectors (strict order & structure)
    for (const bSector of blueprint.grid.sectors) {
      const pSector = (pageGrid.sectors || []).find((s) => s.id === bSector.id);

      const assembledItems = [];

      for (const bItem of bSector.items) {
        // Is it a Shard or Grid?
        if ("model" in bItem) {
          // Shard
          const pItem = (pSector?.items || []).find((i) => "id" in i && i.id === bItem.id) as ShardOverride | undefined;

          // Fetch global shard if it exists
          const globalShard = await getShard(this.env, bItem.id);

          // Resolve props precedence: Page > Global Shard > Blueprint (empty)
          let resolvedProps = {};
          if (globalShard && globalShard.props) {
            resolvedProps = { ...resolvedProps, ...globalShard.props };
          }
          if (pItem && "props" in pItem && pItem.props) {
            resolvedProps = { ...resolvedProps, ...pItem.props };
          }

          assembledItems.push({
            id: bItem.id,
            model: bItem.model,
            props: resolvedProps,
          } as AssembledShard);
        } else {
          // Nested Grid
          // For nested grids, we'll keep the implementation pure but slightly simplified
          // assuming nested overrides are rare or identical in structure.
          // const pGridItem = (pSector?.items || []).find((i) => "layout" in i && i.layout === bItem.layout); // If grid has ID, use it. But right now grids don't have ID!

          assembledItems.push({
            layout: bItem.layout,
            sectors: this.assembleSparseSectors(bItem.sectors),
          } as AssembledGrid);
        }
      }

      assembledSectors.push({
        id: bSector.id,
        items: assembledItems,
      });
    }

    // Add fully custom sectors from Page that are not present in blueprint
    for (const pSector of pageGrid.sectors || []) {
      if (!blueprint.grid.sectors.find((s) => s.id === pSector.id)) {
        assembledSectors.push(this.assembleSparseSectors([pSector])[0]);
      }
    }

    return {
      grid: {
        layout,
        sectors: assembledSectors,
      },
    };
  }
}
