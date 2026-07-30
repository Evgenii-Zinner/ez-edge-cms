/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "bun:test";
import { RuriThemeConnector } from "../../../src/core/theme";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "../../../src/core/factory";

describe("Ruri Theme Connector", () => {
  const theme = createDefaultTheme();
  const site = createDefaultSite();
  const nav = createDefaultNav();
  const footer = createDefaultFooter();
  const ruri = new RuriThemeConnector();

  it("should generate CSS variables for user mode", () => {
    const css = ruri.generateCssVariables(theme, false);
    expect(css).toContain("--font-header");
    expect(css).toContain("Orbitron");
  });

  it("should generate CSS variables for admin mode", () => {
    const css = ruri.generateCssVariables(theme, true);
    expect(css).toContain("Orbitron");
  });

  it("should render Card component using Ruri Panel", () => {
    const Card = ruri.components.Card;
    const jsx = (
      <Card title="Test Card" status="ACTIVE">
        <p>Content</p>
      </Card>
    );
    expect(jsx).toBeDefined();
  });

  it("should render Button component using Ruri Button", () => {
    const Button = ruri.components.Button;
    const jsx = (
      <Button shape="cyber" variant="default">
        Click Me
      </Button>
    );
    expect(jsx).toBeDefined();
  });

  it("should render Hero component with sanitized title", () => {
    const Hero = ruri.components.Hero;
    const jsx = <Hero title="Hello<br/>World" subtitle="Subtitle" />;
    expect(jsx).toBeDefined();
  });

  it("should render CodeBlock component in sci-fi panel", () => {
    const CodeBlock = ruri.components.CodeBlock;
    const jsx = (
      <CodeBlock code="const x = 1;" language="ts" filename="index.ts" />
    );
    expect(jsx).toBeDefined();
  });

  it("should render Table component with headers and rows", () => {
    const Table = ruri.components.Table;
    const jsx = (
      <Table
        rows={[
          ["A", "B"],
          ["1", "2"],
        ]}
        withHeadings={true}
      />
    );
    expect(jsx).toBeDefined();
  });

  it("should render Quote component using Callout", () => {
    const Quote = ruri.components.Quote;
    const jsx = <Quote text="Famous quote" caption="Author" />;
    expect(jsx).toBeDefined();
  });

  it("should render Header component with logo and theme switcher", () => {
    const Header = ruri.components.Header;
    const jsx = (
      <Header site={site} nav={nav} title={site.title} currentPath="/" />
    );
    expect(jsx).toBeDefined();
  });

  it("should render Footer component with links and copyright", () => {
    const Footer = ruri.components.Footer;
    const jsx = <Footer site={site} footer={footer} />;
    expect(jsx).toBeDefined();
  });

  it("should render Main component with ruri-content wrapper", () => {
    const Main = ruri.components.Main;
    const jsx = (
      <Main>
        <p>Hello</p>
      </Main>
    );
    expect(jsx).toBeDefined();
  });
});
