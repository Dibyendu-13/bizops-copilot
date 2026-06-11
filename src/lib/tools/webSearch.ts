type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function decodeHtml(input: string) {
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) return [];
  const html = await res.text();
  const results: SearchResult[] = [];
  const blocks = html.split('result__body');

  for (const block of blocks) {
    const titleMatch = block.match(/result__title[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    const hrefMatch = block.match(/result__url[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/result__snippet[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch || !hrefMatch) continue;

    const title = decodeHtml(titleMatch[1].replace(/<[^>]+>/g, "").trim());
    const href = decodeHtml(hrefMatch[1].replace(/<[^>]+>/g, "").trim());
    const snippet = decodeHtml((snippetMatch?.[1] || "").replace(/<[^>]+>/g, "").trim());

    if (title && href) results.push({ title, url: href.startsWith("http") ? href : `https://${href}`, snippet });
    if (results.length >= limit) break;
  }

  return results;
}
