import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { getM3U8ProxyUrl, type Subtitle, type SourcesData } from "@/lib/api";

interface VideoPlayerProps {
  sources: SourcesData;
  onTimeUpdate?: (currentTime: number) => void;
  initialTime?: number;
  autoplay?: boolean;
  autoSkipIntro?: boolean;
  autoNext?: boolean;
  onEnded?: () => void;
}

export default function VideoPlayer({
  sources,
  onTimeUpdate,
  initialTime = 0,
  autoplay = false,
  autoSkipIntro = false,
  autoNext = false,
  onEnded,
}: VideoPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const introSkippedRef = useRef(false);

  useEffect(() => {
    if (!artRef.current || !sources.sources.length) return;

    introSkippedRef.current = false;

    const hlsSource = sources.sources.find(s => s.type === "hls") || sources.sources[0];
    if (!hlsSource) return;

    const proxyUrl = getM3U8ProxyUrl(hlsSource.url, sources.referer);

    const subtitleTracks = sources.subtitles?.map((sub: Subtitle) => ({
      html: sub.label,
      url: getM3U8ProxyUrl(sub.file, sources.referer),
      default: sub.default || false,
    })) || [];

    const highlights: { time: number; text: string }[] = [];
    if (sources.intro?.start !== undefined) {
      highlights.push({ time: sources.intro.start, text: "Intro Start" });
      highlights.push({ time: sources.intro.end, text: "Intro End" });
    }
    if (sources.outro?.start !== undefined) {
      highlights.push({ time: sources.outro.start, text: "Outro Start" });
      highlights.push({ time: sources.outro.end, text: "Outro End" });
    }

    const playM3u8 = (video: HTMLVideoElement, url: string, art: Artplayer) => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(url);
        hls.attachMedia(video);

        art.on("destroy", () => hls.destroy());

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
          if (autoplay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        setIsReady(true);
      }
    };

    const art = new Artplayer({
      container: artRef.current,
      url: proxyUrl,
      type: "m3u8",
      customType: { m3u8: playM3u8 },
      poster: "",
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: autoplay,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#00d4ff",
      subtitle: {
        url: subtitleTracks[0]?.url || "",
        type: "vtt",
        style: {
          color: "#fff",
          fontSize: "20px",
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        },
        encoding: "utf-8",
      },
      settings: subtitleTracks.length > 0 ? [
        {
          width: 200,
          html: "Subtitle",
          tooltip: subtitleTracks[0]?.html || "Off",
          selector: [
            { html: "Off", url: "" },
            ...subtitleTracks,
          ],
          onSelect: function (item) {
            const subtitleItem = item as { html: string; url?: string };
            if (subtitleItem.url) {
              art.subtitle.switch(subtitleItem.url, { name: subtitleItem.html });
            }
            return subtitleItem.html;
          },
        },
      ] : [],
      highlight: highlights,
    });

    // Skip intro button
    if (sources.intro?.start !== undefined) {
      art.controls.add({
        name: "skip-intro",
        position: "right",
        html: "Skip Intro",
        click: function () {
          art.currentTime = sources.intro!.end;
        },
      });
    }

    // Time update: auto-skip intro & track time
    art.on("video:timeupdate", () => {
      const currentTime = art.currentTime;
      onTimeUpdate?.(currentTime);

      // Auto-skip intro
      if (
        autoSkipIntro &&
        !introSkippedRef.current &&
        sources.intro?.start !== undefined &&
        currentTime >= sources.intro.start &&
        currentTime < sources.intro.end
      ) {
        introSkippedRef.current = true;
        art.currentTime = sources.intro.end;
      }
    });

    // Auto-next on video end
    art.on("video:ended", () => {
      if (autoNext && onEnded) {
        onEnded();
      }
    });

    playerRef.current = art;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy(false);
        playerRef.current = null;
      }
    };
  }, [sources, initialTime, autoplay, autoSkipIntro, autoNext, onEnded, onTimeUpdate]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={artRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
}
