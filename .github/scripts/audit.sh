#!/usr/bin/env bash
# Vahtian site drift audit — the hard CI gate.
# Encodes the vahtian-site skill's §Verify checks: meta completeness, JSON-LD
# validity, noindex/sitemap conflicts, footer consistency, sitemap integrity.
# Exits non-zero (and emits GitHub ::error:: annotations) on any drift.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 2

fail=0
err(){ echo "::error::$1"; fail=1; }

# Public pages only (exclude internal asset pages under brand/).
pages=$(git ls-files 'index.html' '*/index.html' | grep -v '^brand/')

# 1. Meta completeness on indexable pages
for p in $pages; do
  grep -qi 'content="noindex"' "$p" && continue
  for need in 'name="description"' 'rel="canonical"' 'property="og:image"' \
              'name="twitter:card"' 'application/ld+json'; do
    grep -qi "$need" "$p" || err "meta missing [$need] in $p"
  done
done

# 1b. Full head contract: self-canonicals, complete social cards, concise
# titles/descriptions, uniqueness, and reciprocal hreflang declarations.
node .github/scripts/audit-head.mjs || err "head metadata audit failed"

# 2. Every JSON-LD block parses
for p in $pages; do
  node -e '
    const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");
    const re=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m,bad=0;
    while((m=re.exec(h))){try{JSON.parse(m[1])}catch(e){console.error(e.message);bad=1}}
    process.exit(bad);
  ' "$p" || err "invalid JSON-LD in $p"
done

# 2b. Rich-result required fields. Google Search Console rejected three product
# pages for a missing "image"; the sweep that followed found 18 nodes without
# one. A node that parses can still be invalid, so check the fields Google
# actually requires rather than only that the JSON is well-formed.
for p in $pages; do
  node -e '
    const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");
    const REQ={Product:["name","image","offers"],
               SoftwareApplication:["name","image"],
               WebApplication:["name","image"]};
    const re=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m,bad=0;
    while((m=re.exec(h))){
      let d;try{d=JSON.parse(m[1])}catch(e){continue}
      for(const n of (Array.isArray(d)?d:[d])){
        if(!n||typeof n!=="object")continue;
        const need=REQ[n["@type"]];if(!need)continue;
        const missing=need.filter(k=>!(k in n));
        if(missing.length){console.error(n["@type"]+" missing: "+missing.join(", "));bad=1}
      }
    }
    process.exit(bad);
  ' "$p" || err "structured data missing required fields in $p"
done

# 3. noindex pages must NOT appear in the sitemap
for p in $(grep -rl 'content="noindex"' --include=index.html . | sed 's#^\./##'); do
  d="/$(dirname "$p")/"
  grep -q "<loc>https://vahtian.com${d}</loc>" sitemap.xml && err "noindex page in sitemap: $d"
done

# 4. Every public page uses the exact shared footer and stylesheet.
canonical_footer=$(awk '/<footer/{f=1} f{print} /<\/footer>/{f=0}' index.html | sed 's/^[[:space:]]*//')
for p in $pages 404.html; do
  page_footer=$(awk '/<footer/{f=1} f{print} /<\/footer>/{f=0}' "$p" | sed 's/^[[:space:]]*//')
  [ "$page_footer" = "$canonical_footer" ] || err "footer differs from canonical footer in $p"
  grep -q 'brand/footer.css' "$p" || err "shared footer stylesheet missing in $p"
done

# 5. sitemap is well-formed XML
python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('sitemap.xml')" 2>/dev/null \
  || err "sitemap.xml is not well-formed XML"

# 6. every sitemap <loc> resolves to a real file
for loc in $(grep -oE '<loc>[^<]+</loc>' sitemap.xml | sed 's#</\{0,1\}loc>##g'); do
  path=${loc#https://vahtian.com}
  case "$path" in
    /)  file="index.html" ;;
    */) file=".${path}index.html" ;;
    *)  file=".${path}" ;;
  esac
  [ -f "$file" ] || err "sitemap <loc> has no file: $loc -> $file"
done

# 7. internal absolute links (href="/...") resolve to a real file
for p in $pages; do
  for href in $(grep -oE 'href="/[a-zA-Z0-9/_.-]*"' "$p" | sed 's/href="//; s/"$//' | sort -u); do
    case "$href" in
      /)  tgt="index.html" ;;
      */) tgt=".${href}index.html" ;;
      *)  tgt=".${href}" ;;
    esac
    [ -e "$tgt" ] || err "broken internal link $href in $p (-> $tgt)"
  done
done

# 8. every indexable (sitemap) page is present in the client-side search index.
# Guards against the search corpus (search/index.html PAGES) drifting behind the
# site the way it did before launch (Learn + kits were unsearchable).
for loc in $(grep -oE '<loc>[^<]+</loc>' sitemap.xml | sed 's#</\{0,1\}loc>##g'); do
  path=${loc#https://vahtian.com}
  grep -q "\"u\":\"${path}\"" search/index.html || err "page missing from search index: $path"
done

# 9. every indexable (sitemap) page is scanned by pa11y, or listed as a known
# exception below with a reason. The URL list in .pa11yci is hand-maintained, so
# it silently fell 43% behind the sitemap: 40 of 91 pages were never checked,
# including both paid workspace pages, which were failing WCAG AA contrast the
# whole time. A page you do not scan is a page that can regress unnoticed.
#
# Known exceptions (page: reason)
#   /learn/epistemic-notes/ : the four state markers use Okabe-Ito palette
#     colours as text glyphs. Okabe-Ito is built for figure fills, not for small
#     text, so they fail AA (2.15:1 to 4.03:1). Darkening them is a palette
#     decision for the founder, not a mechanical contrast fix.
a11y_exempt="/learn/epistemic-notes/"
for loc in $(grep -oE '<loc>[^<]+</loc>' sitemap.xml | sed 's#</\{0,1\}loc>##g'); do
  path=${loc#https://vahtian.com}
  case " $a11y_exempt " in *" $path "*) continue ;; esac
  grep -q "127.0.0.1:8080${path}\"" .pa11yci || err "page not scanned by pa11y: $path"
done

if [ $fail -ne 0 ]; then echo "DRIFT AUDIT FAILED"; exit 1; fi
echo "drift audit: clean ✓"
