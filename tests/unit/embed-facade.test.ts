import { describe, test, expect } from "bun:test";
import {
  parseYouTubeUrl,
  renderAsyncYouTubeFacade,
} from "../../src/core/theme/connectors/youtube-facade";

describe("YouTube Embed Facade Utility", () => {
  describe("parseYouTubeUrl", () => {
    test("should correctly parse standard watch?v= YouTube URLs", () => {
      const info = parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(info).not.toBeNull();
      expect(info?.videoId).toBe("dQw4w9WgXcQ");
      expect(info?.noCookieUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1");
      expect(info?.posterUrl).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    test("should correctly parse short youtu.be URLs", () => {
      const info = parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(info).not.toBeNull();
      expect(info?.videoId).toBe("dQw4w9WgXcQ");
    });

    test("should correctly parse YouTube embed/ URLs", () => {
      const info = parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(info).not.toBeNull();
      expect(info?.videoId).toBe("dQw4w9WgXcQ");
    });

    test("should return null for non-YouTube URLs or undefined", () => {
      expect(parseYouTubeUrl("https://vimeo.com/12345678")).toBeNull();
      expect(parseYouTubeUrl(undefined)).toBeNull();
    });
  });

  describe("renderAsyncYouTubeFacade", () => {
    test("should render Ruri theme hex play button facade", () => {
      const html = renderAsyncYouTubeFacade("https://youtu.be/dQw4w9WgXcQ", "Test Video", "ruri");
      expect(html).toContain("ez-video-facade");
      expect(html).toContain("ez-ruri-play");
      expect(html).toContain("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
      expect(html).toContain("Test Video");
    });

    test("should render Astryx theme blue play button facade", () => {
      const html = renderAsyncYouTubeFacade("https://youtu.be/dQw4w9WgXcQ", undefined, "astryx");
      expect(html).toContain("ez-video-facade");
      expect(html).toContain("ez-astryx-play");
      expect(html).toContain("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    test("should render Default theme glassmorphism play button facade", () => {
      const html = renderAsyncYouTubeFacade("https://youtu.be/dQw4w9WgXcQ", "Caption", "default");
      expect(html).toContain("ez-video-facade");
      expect(html).toContain("ez-default-play");
    });

    test("should fallback to standard iframe for non-YouTube URLs", () => {
      const html = renderAsyncYouTubeFacade("https://player.vimeo.com/video/123456", "Vimeo", "default");
      expect(html).toContain("<iframe");
      expect(html).toContain("https://player.vimeo.com/video/123456");
    });
  });
});
