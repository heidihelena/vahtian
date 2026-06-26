# New page / new tool checklist

Run through this before any page is "done". It is the single source of truth for
shipping a page that won't drift from the rest of the site.

## Head & meta (copy from `head-template.html`)
- [ ] `title` — specific, honest, ≤ ~60 chars
- [ ] `description` — plain, non-overclaiming, ≤ ~160 chars
- [ ] `canonical` — absolute, trailing slash
- [ ] Open Graph: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`,
      `og:image:width/height/alt`, `og:site_name`
- [ ] `twitter:card` = `summary_large_image`
- [ ] JSON-LD block (right `@type`: SoftwareApplication / WebPage / AboutPage) — **parses**
- [ ] `theme-color` `#2D2440`
- [ ] brand favicon (bracket-gate + tool glyph)
- [ ] If early-access / not public: `robots noindex` **and** keep it out of the sitemap

## Body
- [ ] One `<h1>`; sensible heading order
- [ ] Matches a peer page's structure/classes (cite/, fullvahti/, studyvahti/)
- [ ] Icon-only controls have `aria-label`; decorative imagery `aria-hidden`/`alt=""`
- [ ] Any animation respects `prefers-reduced-motion` (WCAG 2.2 SC 2.3.3)
- [ ] No CTA/promo injected into an `aria-live` region
- [ ] Brand-safe copy (run `vahtian-brand-safety`) — no overclaiming

## Wiring
- [ ] Added to `sitemap.xml` (unless noindex)
- [ ] Footer present, identical shape: `© · context · source · About · Cite · Privacy`
      + invariant disclaimer line
- [ ] If a tool: homepage **router** line + **tool card** in the right stage
- [ ] Bespoke 1200×630 social card generated (`brand/cards/generate.mjs`), `og:image` points to it

## Verify (run these — they catch drift in seconds)

```bash
cd /home/user/vahtian

# 1. Meta coverage across every indexable page (each row should be all "y")
for p in $(git ls-files '*/index.html' index.html); do
  d=$(grep -qi 'name="description"' "$p" && echo y || echo ·)
  c=$(grep -qi 'rel="canonical"'   "$p" && echo y || echo ·)
  o=$(grep -qi 'property="og:'     "$p" && echo y || echo ·)
  t=$(grep -qi 'name="twitter:card"' "$p" && echo y || echo ·)
  j=$(grep -qi 'application/ld+json' "$p" && echo y || echo ·)
  i=$(grep -qi 'property="og:image"' "$p" && echo y || echo ·)
  n=$(grep -qi 'content="noindex"'   "$p" && echo NOINDEX || echo "")
  printf '%-34s desc:%s canon:%s og:%s tw:%s ld:%s img:%s %s\n' "$p" $d $c $o $t $j $i "$n"
done

# 2. JSON-LD parses on every page
for p in $(git ls-files '*/index.html' index.html); do
  node -e 'const h=require("fs").readFileSync(process.argv[1],"utf8");
    const m=h.match(/ld\+json">([\s\S]*?)<\/script>/);
    if(m){try{JSON.parse(m[1]);}catch(e){console.log("BAD JSON-LD: "+process.argv[1]+" — "+e.message)}}' "$p"
done

# 3. noindex/sitemap conflict — any noindex page wrongly listed in sitemap?
for p in $(grep -rl 'content="noindex"' --include=index.html .); do
  u=$(dirname "$p" | sed 's#^\.##'); u="${u}/"
  grep -q "$u<" sitemap.xml && echo "CONFLICT: $u is noindex but in sitemap.xml"
done

# 4. Footer consistency — every footer should carry these links
for p in $(git ls-files '*/index.html' index.html); do
  awk '/<footer/{f=1} f{print} /<\/footer>/{f=0}' "$p" | grep -q 'Privacy' || echo "footer missing Privacy: $p"
done

# 5. Sitemap is well-formed and every <loc> resolves to a real file
python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('sitemap.xml'); print('sitemap XML OK')"

# 6. Every page serves 200 (uses the run-vahtian driver)
node .claude/skills/run-vahtian/driver.mjs --check $(git ls-files '*/index.html' index.html | sed 's#/index.html##; s#^#/#; s#^/index.html#/#') 2>&1 | grep -E 'OK|FAIL'
```

A clean run = no `·` in the meta grid (except intentional noindex pages), no
`BAD JSON-LD`, no `CONFLICT`, no missing footers, sitemap OK, all 200.
