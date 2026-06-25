export function exitIframeResponse(redirectUrl: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to Shopify</title>
    <script>
      window.top.location.href = ${JSON.stringify(redirectUrl)};
    </script>
  </head>
  <body>
    <p>Redirecting to Shopify to connect Presswall…</p>
    <p>
      <a target="_top" rel="noopener noreferrer" href=${JSON.stringify(redirectUrl)}>
        Continue in Shopify
      </a>
    </p>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export function isEmbeddedAuthRequest(searchParams: URLSearchParams): boolean {
  return searchParams.get("embedded") === "1";
}
