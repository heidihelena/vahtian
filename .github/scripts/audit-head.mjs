#!/usr/bin/env node
/**
 * Dependency-free audit for search/social metadata that is easy to miss in a
 * hand-maintained static site. Keep this aligned with the vahtian-site head
 * template and docs/seo-copy-standard.md.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "index.html", "*/index.html"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter((file) => file && !file.startsWith("brand/"));

const pages = new Map();
const seenTitles = new Map();
const seenDescriptions = new Map();
let failed = false;

const report = (file, message) => {
  console.error(`::error file=${file}::${message}`);
  failed = true;
};

const decode = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const path = file === "index.html" ? "/" : `/${file.slice(0, -"index.html".length)}`;
  const expectedCanonical = `https://vahtian.com${path}`;
  const canonical = html.match(
    /<link\s+rel="canonical"\s+href="([^"]+)"[^>]*>/i,
  )?.[1];
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);

  pages.set(expectedCanonical, { file, html });

  if (canonical && canonical !== expectedCanonical) {
    report(file, `canonical must be ${expectedCanonical}, found ${canonical}`);
  }

  if (noindex) continue;

  const required = [
    'name="description"',
    'rel="canonical"',
    'property="og:type"',
    'property="og:url"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'property="og:image:width"',
    'property="og:image:height"',
    'property="og:image:alt"',
    'property="og:site_name"',
    'name="twitter:card"',
    'name="theme-color"',
    'rel="icon"',
    "application/ld+json",
  ];
  for (const marker of required) {
    if (!html.toLowerCase().includes(marker.toLowerCase())) {
      report(file, `required head metadata missing: ${marker}`);
    }
  }

  if (!/name="twitter:card"\s+content="summary_large_image"/i.test(html)) {
    report(file, "twitter:card must be summary_large_image");
  }

  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "");
  const description = decode(
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || "",
  );

  if (title.length > 65) {
    report(file, `title is ${title.length} characters; maximum is 65`);
  }
  if (description.length < 70) {
    report(file, `meta description is ${description.length} characters; minimum is 70`);
  }
  if (description.length > 160) {
    report(file, `meta description is ${description.length} characters; maximum is 160`);
  }

  if (title) {
    if (seenTitles.has(title)) {
      report(file, `duplicate title also used by ${seenTitles.get(title)}`);
    } else {
      seenTitles.set(title, file);
    }
  }
  if (description) {
    if (seenDescriptions.has(description)) {
      report(
        file,
        `duplicate meta description also used by ${seenDescriptions.get(description)}`,
      );
    } else {
      seenDescriptions.set(description, file);
    }
  }
}

// Any declared language alternate must point to a real page that links back.
for (const [sourceUrl, source] of pages) {
  const sourceLanguage = source.html.match(/<html\s+lang="([^"]+)"/i)?.[1];
  if (!sourceLanguage) continue;
  const alternates = [
    ...source.html.matchAll(
      /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"[^>]*>/gi,
    ),
  ];
  for (const [, language, targetUrl] of alternates) {
    if (language === "x-default") continue;
    const target = pages.get(targetUrl);
    if (!target) {
      report(source.file, `hreflang target is not a local page: ${targetUrl}`);
      continue;
    }
    const reciprocal = new RegExp(
      `<link\\s+rel="alternate"\\s+hreflang="${sourceLanguage}"\\s+href="${sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      "i",
    );
    if (!reciprocal.test(target.html)) {
      report(source.file, `hreflang target does not link back: ${target.file}`);
    }
  }
}

if (failed) process.exit(1);
console.log("head metadata audit: clean ✓");
