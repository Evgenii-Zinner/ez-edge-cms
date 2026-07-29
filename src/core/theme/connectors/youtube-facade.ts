/**
 * @module YouTubeEmbedFacade
 * @description Centralized helper for lightweight, async YouTube & Vimeo video embeds.
 * Prevents forced reflow violations and heavy third-party JS execution on initial page load.
 * Calls global window.ezPlayVideo to mount player via srcdoc with passive event listener polyfill.
 */

export interface EmbedInfo {
  videoId: string;
  noCookieUrl: string;
  posterUrl: string;
}

export function parseYouTubeUrl(url: string | undefined): EmbedInfo | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([\w-]+)/);
  if (!match) return null;
  const id = match[1];
  return {
    videoId: id,
    noCookieUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,
    posterUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  };
}

export function renderAsyncYouTubeFacade(
  url: string | undefined,
  caption: string | undefined,
  themeStyle: 'ruri' | 'astryx' = 'ruri'
): string {
  const ytInfo = parseYouTubeUrl(url);

  if (!ytInfo) {
    // Non-YouTube fallback iframe
    const fallbackUrl = url || '';
    return `
      <div class="ez-video-container my-6 rounded-xl overflow-hidden aspect-video w-full">
        <iframe
          src="${fallbackUrl}"
          width="100%"
          height="100%"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture *; web-share"
          allowfullscreen
          loading="lazy"
        ></iframe>
        ${caption ? `<div class="ez-video-caption text-center text-xs opacity-75 mt-2">${caption}</div>` : ''}
      </div>
    `;
  }

  // Generate theme-appropriate play button styling
  let playBtnCss = '';
  let playBtnHtml = '';

  if (themeStyle === 'astryx') {
    playBtnCss = `
      .ez-astryx-play{position:absolute;width:68px;height:48px;background:rgba(24,119,242,0.92);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(24,119,242,0.45);transition:all .3s ease}
      .ez-video-facade:hover .ez-astryx-play{background:#1877f2;transform:scale(1.08)}
      .ez-astryx-tri{width:0;height:0;border-style:solid;border-width:10px 0 10px 18px;border-color:transparent transparent transparent #ffffff;margin-left:3px}
    `;
    playBtnHtml = `<div class="ez-astryx-play"><div class="ez-astryx-tri"></div></div>`;
  } else {
    // Default to Ruri UI cybernetic play button
    playBtnCss = `
      .ez-ruri-play{position:absolute;width:76px;height:66px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px rgba(0,195,255,0.6));transition:transform .3s ease}
      .ez-video-facade:hover .ez-ruri-play{transform:scale(1.1)}
      .ez-ruri-clip{position:absolute;inset:0;clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%);background:rgba(2,6,12,0.85);box-shadow:inset 0 0 10px rgba(0,195,255,0.4)}
      .ez-ruri-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      .ez-ruri-tri{position:relative;z-index:10;width:0;height:0;border-style:solid;border-width:12px 0 12px 20px;border-color:transparent transparent transparent #00c3ff;margin-left:3px;filter:drop-shadow(0 0 3px #00c3ff)}
    `;
    playBtnHtml = `
      <div class="ez-ruri-play">
        <div class="ez-ruri-clip"></div>
        <svg class="ez-ruri-svg" viewBox="0 0 76 66" fill="none">
          <line x1="19" y1="1" x2="57" y2="1" stroke="#00c3ff" stroke-width="2"/>
          <line x1="19" y1="65" x2="57" y2="65" stroke="#00c3ff" stroke-width="2"/>
          <polyline points="70,21 76,33 70,45" stroke="#00c3ff" stroke-width="2"/>
          <polyline points="6,45 0,33 6,21" stroke="#00c3ff" stroke-width="2"/>
        </svg>
        <div class="ez-ruri-tri"></div>
      </div>
    `;
  }

  return `
    <div class="ez-video-wrapper my-6">
      <div class="ez-video-facade relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 cursor-pointer group" onclick="if(window.ezPlayVideo){window.ezPlayVideo(this,'${ytInfo.noCookieUrl}')}else{this.innerHTML='<iframe src=&quot;${ytInfo.noCookieUrl}&quot; width=&quot;100%&quot; height=&quot;100%&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture *; web-share&quot; allowfullscreen></iframe>'}">
        <style>${playBtnCss}</style>
        <img src="${ytInfo.posterUrl}" alt="Play Video" class="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300" loading="lazy" decoding="async" />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          ${playBtnHtml}
        </div>
      </div>
      ${caption ? `<div class="ez-video-caption text-center text-xs opacity-75 mt-2 italic">${caption}</div>` : ''}
    </div>
  `.trim();
}
