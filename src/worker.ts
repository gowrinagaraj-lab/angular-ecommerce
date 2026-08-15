export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(request);

    if (asset.status !== 404) {
      return asset;
    }

    const fallbackUrl = new URL('/index.html', url.origin);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  },
} satisfies ExportedHandler<typeof env>;
