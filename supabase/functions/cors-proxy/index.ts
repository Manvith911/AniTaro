import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const BASE_API_URL = 'https://kenjitsu.vercel.app';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the target URL
    const targetUrl = `${BASE_API_URL}${path}`;
    
    console.log(`Proxying request to: ${targetUrl}`);

    // Forward the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AniTaro/1.0',
        },
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Request failed';
      console.error('Fetch error:', errorMessage);
      
      // Return empty results for failed category requests
      if (path.includes('/category/') || path.includes('/genre/') || path.includes('/recent/')) {
        return new Response(
          JSON.stringify({ animes: [], currentPage: 1, hasNextPage: false, totalPages: 1 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    clearTimeout(timeoutId);

    // Check for error responses
    if (!response.ok) {
      console.error(`API returned status: ${response.status}`);
      
      // Return empty results for failed category/genre/recent requests
      if (path.includes('/category/') || path.includes('/genre/') || path.includes('/recent/')) {
        return new Response(
          JSON.stringify({ animes: [], currentPage: 1, hasNextPage: false, totalPages: 1 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `API returned status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.text();
    
    // Check if response contains error
    try {
      const jsonData = JSON.parse(data);
      if (jsonData.error) {
        console.error('API returned error:', jsonData.error);
        
        // Return empty results for category/genre/recent requests that have errors
        if (path.includes('/category/') || path.includes('/genre/') || path.includes('/recent/')) {
          return new Response(
            JSON.stringify({ animes: [], currentPage: 1, hasNextPage: false, totalPages: 1 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(data, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      // Not JSON, return as is
      return new Response(data, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
