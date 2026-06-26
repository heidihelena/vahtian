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

# 3. noindex pages must NOT appear in the sitemap
for p in $(grep -rl 'content="noindex"' --include=index.html . | sed 's#^\./##'); do
  d="/$(dirname "$p")/"
  grep -q "<loc>https://vahtian.com${d}</loc>" sitemap.xml && err "noindex page in sitemap: $d"
done

# 4. Footer carries the Privacy link on every page (privacy page is exempt)
for p in $pages; do
  [ "$p" = "privacy/index.html" ] && continue
  awk '/<footer/{f=1} f{print} /<\/footer>/{f=0}' "$p" | grep -q 'href="/privacy/"' \
    || err "footer missing Privacy link in $p"
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

if [ $fail -ne 0 ]; then echo "DRIFT AUDIT FAILED"; exit 1; fi
echo "drift audit: clean ✓"
