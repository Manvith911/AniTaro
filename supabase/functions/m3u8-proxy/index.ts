import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

const DEFAULT_UPSTREAM_REFERER = 'https://rapid-cloud.co/';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    const refererParam = url.searchParams.get('referer');
    
    if (!targetUrl || targetUrl === 'undefined' || targetUrl === '') {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxying M3U8/media request to: ${targetUrl}`);

    // Upstream hosts typically require RapidCloud referer
    const upstreamReferer = (refererParam && refererParam !== 'undefined')
      ? refererParam
      : DEFAULT_UPSTREAM_REFERER;

    // Derive an Origin header from referer when possible
    let upstreamOrigin = 'https://rapid-cloud.co';
    try {
      upstreamOrigin = new URL(upstreamReferer).origin;
    } catch {
      upstreamOrigin = 'https://rapid-cloud.co';
    }

    // Forward request headers with proper referer
    const baseHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Forward Range header for segment requests
    const rangeHeader = req.headers.get('Range');

    const fetchUpstream = async (referer: string, origin: string) => {
      const requestHeaders: Record<string, string> = {
        ...baseHeaders,
        Referer: referer,
        Origin: origin,
      };
      if (rangeHeader) requestHeaders['Range'] = rangeHeader;

      return fetch(targetUrl, {
        method: 'GET',
        headers: requestHeaders,
      });
    };

    let response = await fetchUpstream(upstreamReferer, upstreamOrigin);

    // Some upstream hosts reject the RapidCloud referer and only accept their own origin as the referer.
    // If we get a 403, retry once using the target origin.
    let targetOrigin = '';
    try {
      targetOrigin = new URL(targetUrl).origin;
    } catch {
      targetOrigin = '';
    }
    if (response.status === 403 && targetOrigin && targetOrigin !== upstreamOrigin) {
      response = await fetchUpstream(targetOrigin, targetOrigin);
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    // Check if request failed
    if (!response.ok) {
      console.error(`Upstream returned ${response.status} for ${targetUrl}`);
      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
        },
      });
    }

    // For M3U8 playlists, we need to rewrite the URLs to go through our proxy
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || targetUrl.endsWith('.m3u8')) {
      const text = new TextDecoder().decode(body);
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // IMPORTANT:
      // Some environments expose `req.url` / forwarded host as `edge-runtime.supabase.com`.
      // Rewriting playlists to that host causes the browser to hit a protected endpoint (401).
      // Always prefer the project's public base URL when available.
      const projectBaseUrl = Deno.env.get('SUPABASE_URL');
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const forwardedHost = req.headers.get('x-forwarded-host');
      const host = forwardedHost || req.headers.get('host') || url.host;
      const proto = forwardedProto || 'https';
      const proxyBaseUrl = projectBaseUrl
        ? `${projectBaseUrl}/functions/v1/m3u8-proxy`
        : `${proto}://${host}/functions/v1/m3u8-proxy`;
      
      // Rewrite URLs to absolute proxied URLs (handle both relative and absolute)
      const rewritten = text.replace(/^(?!#)(.+)$/gm, (match) => {
        const trimmed = match.trim();
        if (!trimmed || trimmed.startsWith('#')) return match;
        
        // Skip if not a media file
        if (!trimmed.includes('.m3u8') && !trimmed.includes('.ts') && !trimmed.includes('.key') && !trimmed.includes('.vtt') && !trimmed.includes('.aac') && !trimmed.includes('.mp4')) {
          // Could be a variant playlist URL without extension
          if (!trimmed.includes('/')) return match;
        }
        
        if (match.startsWith('http')) {
          return `${proxyBaseUrl}?url=${encodeURIComponent(trimmed)}&referer=${encodeURIComponent(upstreamReferer)}`;
        }
        return `${proxyBaseUrl}?url=${encodeURIComponent(baseUrl + trimmed)}&referer=${encodeURIComponent(upstreamReferer)}`;
      });

      return new Response(rewritten, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
        },
      });
    }

    // For other media files (ts segments, keys, etc.)
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
    };

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('M3U8 Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
