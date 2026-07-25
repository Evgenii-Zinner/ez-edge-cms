/**
 * @module ThemeConnectorRegistry
 * @description Centralized registry for managing pluggable styling system connectors in EZ EDGE CMS.
 * Allows new theme engines and styling systems to be registered and activated seamlessly.
 */

import { ThemeConnector } from "./connector";
import { RuriThemeConnector } from "./connectors/ruri";
import { DefaultThemeConnector } from "./connectors/default";
import { AstryxThemeConnector } from "./connectors/astryx";

/**
 * Registry holding available ThemeConnector implementations.
 */
class ThemeConnectorRegistry {
  private connectors = new Map<string, ThemeConnector>();

  constructor() {
    // Register built-in theme connectors
    this.register(new RuriThemeConnector());
    this.register(new DefaultThemeConnector());
    this.register(new AstryxThemeConnector());
  }

  /**
   * Registers a new theme connector.
   *
   * @param connector - ThemeConnector implementation instance.
   */
  register(connector: ThemeConnector): void {
    this.connectors.set(connector.id, connector);
  }

  /**
   * Retrieves a theme connector by ID. Defaults to 'ruri' if ID is missing or unknown.
   *
   * @param id - Optional styling system ID.
   * @returns The matching ThemeConnector.
   */
  get(id?: string): ThemeConnector {
    if (id && this.connectors.has(id)) {
      return this.connectors.get(id)!;
    }
    // Default to ruri theme connector
    return this.connectors.get("ruri")!;
  }

  /**
   * Lists all registered theme connectors.
   */
  list(): ThemeConnector[] {
    return Array.from(this.connectors.values());
  }
}

/** Global singleton instance of ThemeConnectorRegistry. */
export const themeRegistry = new ThemeConnectorRegistry();
