/**
 * Markdown for Agents — free-plan content negotiation.
 *
 * When a client sends `Accept: text/markdown` (and prefers it over HTML), this
 * Worker serves a Markdown rendering of the page's <main> content with
 * `Content-Type: text/markdown`. Browsers and everything else get the original
 * HTML, byte-for-byte, from the static-assets binding.
 *
 * Design constraints (match the site invariants):
 *   - Single file, no imports, no npm dependency, no build step.
 *   - Fails safe: any error, or any non-HTML/198 response, falls through to the
 *     unmodified asset response. Markdown is best-effort; HTML is never at risk.
 *
 * The converter is exported so it can be unit-tested with Node.
 */

export default {
  async fetch(request, env) {
    // Always have the real asset response ready; it is the source of truth.
    const assetResponse = await env.ASSETS.fetch(request);

    try {
      if (request.method !== "GET" && request.method !== "HEAD") return assetResponse;
      if (!wantsMarkdown(request.headers.get("accept"))) return assetResponse;

      const ct = assetResponse.headers.get("content-type") || "";
      if (!ct.includes("text/html")) return assetResponse; // only convert HTML pages
      if (assetResponse.status !== 200) return assetResponse; // don't convert 404-page etc.

      const html = await assetResponse.clone().text();
      const md = htmlToMarkdown(html);
      if (!md || md.trim().length < 16) return assetResponse; // nothing useful → serve HTML

      const headers = new Headers();
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("x-markdown-tokens", String(estimateTokens(md)));
      headers.set("vary", "Accept");
      // Preserve the agent-discovery Link header if the asset set one.
      const link = assetResponse.headers.get("link");
      if (link) headers.set("link", link);
      const cc = assetResponse.headers.get("cache-control");
      if (cc) headers.set("cache-control", cc);

      const body = request.method === "HEAD" ? null : md;
      return new Response(body, { status: 200, headers });
    } catch (_err) {
      // On any failure, serve the original HTML untouched.
      return assetResponse;
    }
  },
};

/** True only when the client actively prefers markdown over html. */
export function wantsMarkdown(accept) {
  if (!accept) return false;
  const types = accept.split(",").map((part) => {
    const [type, ...params] = part.trim().split(";");
    let q = 1;
    for (const p of params) {
      const m = p.trim().match(/^q=([0-9.]+)$/);
      if (m) q = parseFloat(m[1]);
    }
    return { type: type.trim().toLowerCase(), q };
  });
  const md = types.find((t) => t.type === "text/markdown");
  if (!md) return false;
  const html = types.find((t) => t.type === "text/html");
  const star = types.find((t) => t.type === "text/*" || t.type === "*/*");
  const mdQ = md.q;
  const htmlQ = html ? html.q : star ? star.q : 0;
  return mdQ >= htmlQ; // ties go to markdown, since the client asked for it explicitly
}

function estimateTokens(text) {
  // Rough heuristic (~4 chars/token); advisory only.
  return Math.round(text.length / 4);
}

/**
 * Minimal, dependency-free HTML→Markdown converter tuned for Vahtian's clean,
 * hand-authored semantic markup. Extracts <main> (falling back to <body>),
 * drops non-content elements, and converts the common block/inline tags.
 */
export function htmlToMarkdown(html) {
  let doc = html;

  // Title (used as the top-level heading if the main content has no <h1>).
  const titleMatch = doc.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? decodeEntities(stripTags(titleMatch[1])).trim() : "";

  // Isolate the main content region.
  let main =
    firstMatch(doc, /<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    firstMatch(doc, /<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
    firstMatch(doc, /<body\b[^>]*>([\s\S]*?)<\/body>/i) ||
    doc;

  // Remove elements whose contents are not prose.
  main = main
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<form\b[\s\S]*?<\/form>/gi, "")
    .replace(/<button\b[\s\S]*?<\/button>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const out = [];
  let hasH1 = false;

  // Walk top-level block elements in document order; nested lists/pre/tables
  // are handled by their own branch.
  const flat = flattenBlocks(main);
  for (const block of flat) {
    const { tag, inner } = block;
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10);
      if (level === 1) hasH1 = true;
      const text = convertInline(inner).trim();
      if (text) out.push("#".repeat(level) + " " + text);
    } else if (tag === "p") {
      const text = convertInline(inner).trim();
      if (text) out.push(text);
    } else if (tag === "ul" || tag === "ol") {
      out.push(convertList(inner, tag, 0));
    } else if (tag === "blockquote") {
      const text = convertInline(inner).trim().split("\n").map((l) => "> " + l).join("\n");
      if (text) out.push(text);
    } else if (tag === "pre") {
      const code = decodeEntities(stripTags(inner)).replace(/\n+$/, "");
      out.push("```\n" + code + "\n```");
    } else if (tag === "hr") {
      out.push("---");
    } else if (tag === "table") {
      const t = convertTable(inner);
      if (t) out.push(t);
    }
  }

  let md = out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!hasH1 && pageTitle) md = "# " + pageTitle + "\n\n" + md;
  return md;
}

// --- helpers ---------------------------------------------------------------

function firstMatch(s, re) {
  const m = s.match(re);
  return m ? m[1] : null;
}

/**
 * Return an ordered list of top-level block elements within `html`.
 * Only splits on block tags that appear at the top level of the fragment.
 */
function flattenBlocks(html) {
  const blocks = [];
  const re = /<(h[1-6]|p|ul|ol|blockquote|pre|table)\b[^>]*>([\s\S]*?)<\/\1>|<hr\b[^>]*\/?>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith("<hr")) {
      blocks.push({ tag: "hr", inner: "" });
    } else {
      blocks.push({ tag: m[1].toLowerCase(), inner: m[2] });
    }
  }
  return blocks;
}

function convertList(inner, tag, depth) {
  const items = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  let i = 1;
  while ((m = re.exec(inner)) !== null) {
    let liInner = m[1];
    // Extract nested lists first.
    let nested = "";
    liInner = liInner.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (full, t, body) => {
      nested += "\n" + convertList(body, t.toLowerCase(), depth + 1);
      return "";
    });
    const bullet = tag === "ol" ? `${i}. ` : "- ";
    const text = convertInline(liInner).trim();
    const pad = "  ".repeat(depth);
    if (text || nested) items.push(pad + bullet + text + nested);
    i++;
  }
  return items.join("\n");
}

function convertTable(inner) {
  const rows = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let r;
  while ((r = rowRe.exec(inner)) !== null) {
    const cells = [];
    const cellRe = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let c;
    while ((c = cellRe.exec(r[1])) !== null) {
      cells.push(convertInline(c[2]).trim().replace(/\|/g, "\\|"));
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const norm = rows.map((row) => {
    while (row.length < width) row.push("");
    return row;
  });
  const lines = ["| " + norm[0].join(" | ") + " |", "| " + norm[0].map(() => "---").join(" | ") + " |"];
  for (let i = 1; i < norm.length; i++) lines.push("| " + norm[i].join(" | ") + " |");
  return lines.join("\n");
}

/** Convert inline markup (links, emphasis, code) inside a text fragment. */
function convertInline(html) {
  let s = html;
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (f, t, x) => "**" + stripTags(x).trim() + "**");
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (f, t, x) => "*" + stripTags(x).trim() + "*");
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (f, x) => "`" + decodeEntities(stripTags(x)) + "`");
  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (f, href, x) => {
    const text = stripTags(x).trim();
    if (!text) return "";
    if (href.startsWith("data:") || href.startsWith("javascript:")) return text;
    return "[" + text + "](" + href + ")";
  });
  s = s.replace(/<br\b[^>]*\/?>/gi, "\n");
  s = stripTags(s);
  s = decodeEntities(s);
  return s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n");
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

function decodeEntities(s) {
  const named = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    mdash: "—", ndash: "–", hellip: "…", middot: "·",
    ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
    kappa: "κ", alpha: "α", times: "×", ge: "≥",
    le: "≤", deg: "°", eacute: "é", rarr: "→",
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (f, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (f, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (f, name) => (name in named ? named[name] : f));
}
