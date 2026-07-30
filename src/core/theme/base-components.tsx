/** @jsxImportSource hono/jsx */
import { normalizePath } from "@utils/seo";
import { renderAsyncYouTubeFacade } from "./connectors/youtube-facade";
import type {
  ThemeComponents,
  CardProps,
  ButtonProps,
  GridProps,
  HeroProps,
  ImageProps,
  CodeBlockProps,
  TableProps,
  QuoteProps,
  VideoProps,
  EmbedProps,
  NavProps,
  HeaderProps,
  MainProps,
  FooterProps,
} from "./connector";

type PropsWithChildren<P> = P & { children?: any };

export interface ThemeStyleInjections {
  card: {
    container: (props: CardProps) => string;
    title?: string;
    content?: string;
    renderDecorations?: (props: CardProps) => any;
  };
  button: (props: ButtonProps) => string;
  grid: (props: GridProps) => string;
  hero: {
    container: string;
    title: string;
    subtitle: string;
    background?: (imageUrl: string) => any;
    renderDecorations?: () => any;
  };
  image: {
    container: (props: ImageProps) => string;
    img: string;
    caption?: string;
  };
  codeBlock: {
    container: (props: CodeBlockProps) => string;
    title?: string;
    content: string;
  };
  table: {
    container: string;
    table: string;
    th: string;
    td: string;
  };
  quote: {
    container: string;
    content: string;
    caption?: string;
  };
  video: {
    container: string;
    wrapper: string;
    caption?: string;
  };
  delimiter: string;
  nav: {
    container: string;
    link: string;
  };
  header: {
    container: string;
    inner: string;
    brand: string;
    logoClass?: string;
    renderNavArea?: (props: HeaderProps) => any;
  };
  main: string;
  footer: {
    container: string;
    inner: string;
    text: string;
    navContainer: string;
    link: string;
  };
  overlays?: () => any;
  systemId: "ruri" | "astryx";
}

export function createBaseThemeComponents(
  styles: ThemeStyleInjections,
): ThemeComponents {
  return {
    Card: (props: CardProps) => (
      <div class={styles.card.container(props)}>
        {styles.card.renderDecorations && styles.card.renderDecorations(props)}
        {props.title && styles.card.title && (
          <h3 class={styles.card.title}>{props.title}</h3>
        )}
        <div class={styles.card.content || ""}>{props.children}</div>
      </div>
    ),

    Button: (props: ButtonProps) => (
      <button
        type={(props.type as any) || "button"}
        class={styles.button(props)}
      >
        {props.children}
      </button>
    ),

    Grid: (props: GridProps) => (
      <div class={styles.grid(props)}>{props.children}</div>
    ),

    Hero: (props: PropsWithChildren<HeroProps>) => (
      <div class={styles.hero.container}>
        {styles.hero.background &&
          props.imageUrl &&
          styles.hero.background(props.imageUrl)}
        {styles.hero.renderDecorations && styles.hero.renderDecorations()}
        <div class="relative z-10 w-full max-w-800px mx-auto">
          {props.title && <h1 class={styles.hero.title}>{props.title}</h1>}
          {props.subtitle && (
            <p class={styles.hero.subtitle}>{props.subtitle}</p>
          )}
          {props.children}
        </div>
      </div>
    ),

    Image: (props: ImageProps) => {
      const containerClass =
        typeof styles.image?.container === "function"
          ? styles.image.container(props)
          : (styles.image?.container as any) || "";
      return (
        <figure class={containerClass}>
          <img src={props.src} alt={props.alt || ""} class={styles.image?.img || ""} />
          {props.caption && styles.image?.caption && (
            <figcaption class={styles.image.caption}>{props.caption}</figcaption>
          )}
        </figure>
      );
    },

    CodeBlock: (props: CodeBlockProps) => (
      <div class={styles.codeBlock.container(props)}>
        {props.filename && styles.codeBlock.title && (
          <div class={styles.codeBlock.title}>// FILE: {props.filename}</div>
        )}
        <pre class={styles.codeBlock.content}>
          <code class={props.language || ""}>{props.code}</code>
        </pre>
      </div>
    ),

    Table: (props: TableProps) => {
      const rows = props.rows || [];
      const withHeadings = props.withHeadings || false;
      const getCells = (r: any) =>
        Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : [];
      const headers =
        withHeadings && rows.length > 0 ? getCells(rows[0]) : undefined;
      const dataRows = (withHeadings ? rows.slice(1) : rows).map(getCells);

      return (
        <div class={styles.table.container}>
          <table class={styles.table.table}>
            {headers && (
              <thead>
                <tr>
                  {headers.map((h: any) => (
                    <th class={styles.table.th}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataRows.map((row: any) => (
                <tr>
                  {row.map((cell: any) => (
                    <td class={styles.table.td}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    Quote: (props: QuoteProps) => (
      <blockquote class={styles.quote.container}>
        <div class={styles.quote.content}>"{props.text}"</div>
        {props.caption && styles.quote.caption && (
          <footer class={styles.quote.caption}>— {props.caption}</footer>
        )}
      </blockquote>
    ),

    Video: (props: VideoProps) => {
      if (props.embedUrl) {
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: renderAsyncYouTubeFacade(
                props.embedUrl,
                props.caption,
                styles.systemId,
              ),
            }}
          />
        );
      }
      return (
        <div class={styles.video.container}>
          <div class={styles.video.wrapper}>
            <video
              src={props.url}
              controls
              width="100%"
              height="100%"
              preload="metadata"
            ></video>
          </div>
          {props.caption && styles.video.caption && (
            <div class={styles.video.caption}>{props.caption}</div>
          )}
        </div>
      );
    },

    Embed: (props: EmbedProps) => (
      <div
        dangerouslySetInnerHTML={{
          __html: renderAsyncYouTubeFacade(
            props.embed,
            props.caption,
            styles.systemId,
          ),
        }}
      />
    ),

    Delimiter: () => <hr class={styles.delimiter} />,

    Overlays: () => (styles.overlays ? styles.overlays() : <></>),

    Nav: (props: NavProps) => (
      <nav class={styles.nav?.container || ""} id="main-nav">
        {(props.nav?.items || []).map((item) => (
          <a href={normalizePath(item.path)} class={styles.nav?.link || ""}>
            {item.label}
          </a>
        ))}
      </nav>
    ),

    Header: (props: HeaderProps) => (
      <header class={styles.header.container}>
        <div class={styles.header.inner}>
          <a href="/" class={styles.header.brand}>
            {props.site.logoSvg && (
              <img
                src={`data:image/svg+xml,${encodeURIComponent(props.site.logoSvg)}`}
                alt="Logo"
                class={styles.header.logoClass || ""}
                style={{ width: "28px", height: "28px", objectFit: "contain" }}
              />
            )}
            {props.site.title || "EZ EDGE"}
          </a>
          {styles.header.renderNavArea && styles.header.renderNavArea(props)}
        </div>
      </header>
    ),

    Main: (props: MainProps) => (
      <main
        id="main-content"
        class={`${styles.main} ${props.class || ""}`.trim()}
      >
        {props.children}
      </main>
    ),

    Footer: (props: FooterProps) => (
      <footer class={styles.footer.container}>
        <div class={styles.footer.inner}>
          <div class={styles.footer.text}>
            © {new Date().getFullYear()} {props.site.title}. All rights
            reserved.
          </div>
          <nav class={styles.footer.navContainer}>
            {props.footer?.links?.map((link) => (
              <a href={normalizePath(link.path)} class={styles.footer.link}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    ),
  };
}
