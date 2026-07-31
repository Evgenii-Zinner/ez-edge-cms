/**
 * @module ThemeConnector
 * @description Defines the core contract for EZ EDGE CMS styling system connectors.
 * Connectors translate site theme settings into CSS variables, UnoCSS configurations,
 * and pluggable UI component primitives (e.g. Card, Button, Grid, Hero, Header, Nav, Footer).
 */

import { ThemeConfig, NavConfig, SiteConfig, FooterConfig } from "@core/schema";
import type { UserConfig } from "unocss";
import { ThemeTokenMap } from "./tokens";

export interface CardProps {
  title?: string;
  shape?: string;
  glow?: boolean;
  status?: string;
  class?: string;
  children?: any;
}

export interface ButtonProps {
  variant?: string;
  shape?: string;
  type?: string;
  class?: string;
  children?: any;
}

export interface GridProps {
  cols?: any;
  gap?: any;
  class?: string;
  children?: any;
}

export interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  shape?: string;
  glow?: boolean;
  class?: string;
}

export interface ImageProps {
  src: string;
  alt?: string;
  header?: string;
  footer?: string;
  caption?: string;
  stretched?: boolean;
  withBorder?: boolean;
  withBackground?: boolean;
  withPanel?: boolean;
  variant?: "simple" | "styled" | string;
  simple?: boolean;
  class?: string;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export interface TableProps {
  rows?: any[];
  withHeadings?: boolean;
}

export interface QuoteProps {
  text: string;
  caption?: string;
}

export interface VideoProps {
  /** The raw source URL (YouTube, Vimeo, or a direct video file) */
  url: string;
  /**
   * Pre-resolved embed URL (e.g., a YouTube or Vimeo embed URL).
   * The parser performs URL detection and passes the result here so
   * connectors only need to handle rendering, not URL parsing.
   */
  embedUrl?: string;
  /** Optional caption text */
  caption?: string;
}

export interface EmbedProps {
  /** The URL or src string for the iframe embed */
  embed: string;
  /** Optional caption text */
  caption?: string;
}

export interface HeaderProps {
  site: SiteConfig;
  nav: NavConfig;
  title: string;
  currentPath?: string;
}

export interface NavProps {
  site: SiteConfig;
  nav: NavConfig;
  currentPath?: string;
}

export interface FooterProps {
  site: SiteConfig;
  footer: FooterConfig;
}

export interface MainProps {
  children?: any;
  class?: string;
}

import type { FC } from "hono/jsx";

export interface ThemeComponents {
  Card: FC<CardProps>;
  Button: FC<ButtonProps>;
  Grid: FC<GridProps>;
  Hero: FC<HeroProps>;
  Image?: FC<ImageProps>;
  CodeBlock: FC<CodeBlockProps>;
  Table: FC<TableProps>;
  Quote: FC<QuoteProps>;
  /**
   * Renders a video block. The parser resolves YouTube/Vimeo URLs into embed
   * URLs before calling this — connectors only need to render the result.
   */
  Video: FC<VideoProps>;
  /** Renders an arbitrary iframe embed block. */
  Embed: FC<EmbedProps>;
  /** Renders a thematic section break (e.g. a styled <hr>). */
  Delimiter: (props?: any) => any;
  Overlays: (props?: any) => any;
  /**
   * Optional standalone mobile nav drawer.
   * Connectors that self-manage nav inside their Header component
   * (selfContainedNav = true) should omit this or return null.
   */
  Nav?: FC<NavProps>;
  Header: FC<HeaderProps>;
  Main: FC<MainProps>;
  Footer: FC<FooterProps>;
}

export interface ThemeConnector {
  /** Unique ID matching theme.values.styling_system (e.g. 'ruri', 'default', 'astryx') */
  readonly id: string;
  /** Human-readable display name for the admin interface */
  readonly name: string;
  /**
   * When true, the connector's Header component manages its own mobile nav
   * (toggle button, drawer, JS) internally. BaseLayout will skip injecting its
   * own #mobile-menu-toggle script to avoid conflicts.
   */
  readonly selfContainedNav?: boolean;
  /** Declarative token map for automated preflights & theme introspection */
  readonly tokens?: ThemeTokenMap;
  /** Component implementations for this styling system */
  readonly components: ThemeComponents;
  /** Generates the raw CSS variable block to be injected into the HTML <head> */
  generateCssVariables(theme: ThemeConfig, isAdmin?: boolean): string;
  /** Generates the UnoCSS UserConfig preset for this styling system */
  getUnoConfig(): UserConfig;
}
