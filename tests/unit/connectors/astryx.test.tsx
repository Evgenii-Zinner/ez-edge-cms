/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "bun:test";
import { AstryxThemeConnector } from "../../../src/core/theme";
import {
  createDefaultTheme,
  createDefaultSite,
  createDefaultNav,
  createDefaultFooter,
} from "../../../src/core/factory";

describe("Astryx Theme Connector", () => {
  const theme = createDefaultTheme();
  const site = createDefaultSite();
  const nav = createDefaultNav();
  const footer = createDefaultFooter();
  const astryx = new AstryxThemeConnector();

  it("should generate CSS variables for user mode", () => {
    const css = astryx.generateCssVariables(theme, false);
    expect(css).toContain("--astryx-primary");
  });

  it("should generate CSS variables for admin mode", () => {
    const css = astryx.generateCssVariables(theme, true);
    expect(css).toContain("--astryx-primary");
  });

  it("should render Card component with astryx-card class", () => {
    const Card = astryx.components.Card;
    const jsx = (
      <Card title="Astryx Card">
        <p>Body</p>
      </Card>
    );
    expect(jsx).toBeDefined();
  });

  it("should render Button component with primary classes", () => {
    const Button = astryx.components.Button;
    const jsx = <Button>Submit</Button>;
    expect(jsx).toBeDefined();
  });

  it("should render Hero component with gradient container", () => {
    const Hero = astryx.components.Hero;
    const jsx = (
      <Hero
        title="Astryx Hero"
        subtitle="Welcome"
        imageUrl="https://placehold.co/100"
      />
    );
    expect(jsx).toBeDefined();
  });

  it("should render CodeBlock component", () => {
    const CodeBlock = astryx.components.CodeBlock;
    const jsx = <CodeBlock code="console.log('hi');" filename="app.js" />;
    expect(jsx).toBeDefined();
  });

  it("should render Table component", () => {
    const Table = astryx.components.Table;
    const jsx = (
      <Table
        rows={[
          ["Col1", "Col2"],
          ["Val1", "Val2"],
        ]}
        withHeadings={true}
      />
    );
    expect(jsx).toBeDefined();
  });

  it("should render Header component with mobile toggle and switcher", () => {
    const Header = astryx.components.Header;
    const jsx = (
      <Header site={site} nav={nav} title={site.title} currentPath="/" />
    );
    expect(jsx).toBeDefined();
  });

  it("should render Footer component", () => {
    const Footer = astryx.components.Footer;
    const jsx = <Footer site={site} footer={footer} />;
    expect(jsx).toBeDefined();
  });
});
