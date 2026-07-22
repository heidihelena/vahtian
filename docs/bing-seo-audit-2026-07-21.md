# vahtian.com — Bing / Microsoft Webmaster Guidelines Audit

**Date:** 2026-07-21 · **Companion to:** `docs/seo-audit-2026-07-21.md` (the
Google-focused audit run the same day; shared crawl evidence lives there and is
cross-referenced as *[G-§n]* rather than duplicated).
**Reported symptom:** Bing Webmaster Tools shows the **main pages as not
indexable**.

**Audit limitation (same as the companion report):** this sandbox's egress
policy blocks live requests to vahtian.com, so Bingbot's actual experience of
the site could not be reproduced from here. That matters more for Bing than it
did for Google, because — as shown below — the most probable cause of the
symptom is *not in the HTML at all*. §2.1 is written as a decision tree you can
walk in ~20 minutes with Bing Webmaster Tools + the Cloudflare dashboard.

---

## Executive summary

The on-page layer cannot be what is blocking Bing. The full source crawl
(97 pages) verified: no stray `noindex`, correct self-referencing canonicals,
a valid robots.txt that allows all crawlers (`User-agent: * / Allow: /`), a
clean single-scheme URL space, unique titles/descriptions/H1s throughout, and a
sitemap whose 89 URLs are exactly the indexable set *[G-§1]*. When a site in
this state shows "not indexable" for its **main** pages in Bing, the cause is
almost always one of four things upstream of the markup, in this order of
likelihood:

1. **Cloudflare is challenging or 403-ing Bingbot.** The single most common
   cause of exactly this symptom on Cloudflare-hosted sites (Bot Fight Mode /
   Super Bot Fight Mode / a WAF rule flagging "fake Bing bot"). Verified
   community + Microsoft Q&A evidence in §2.1. You cannot see this from a
   browser; only the Live URL test or Cloudflare's security-event log shows it.
2. **A young, link-sparse domain below Bing's crawl-priority threshold.** Bing
   is far more conservative than Google about spending crawl on new domains;
   "Discovered but not crawled — URL cannot appear on Bing" is its documented
   verdict for that state ([Why is my site not in the index?](https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab)).
3. **The mass-bumped sitemap `<lastmod>`** (88/89 URLs = `2026-07-19`,
   date-only, no timestamps). Bing's own July-2025 guidance is explicit that
   lastmod must reflect the page's true modification time and recommends full
   ISO-8601 timestamps; unreliable lastmod degrades crawl prioritisation
   ([Bing blog: Keeping Content Discoverable with Sitemaps in AI-Powered Search](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search)).
4. **IndexNow is half-wired: key present, submission mechanism unconfirmed.**
   Correction to an earlier draft of this report — the IndexNow **key file**
   *does* exist: `478027c6e87c48dd85871fe255f51ad0.txt` at the site root,
   added 2026-07-18 (PR #206), content correctly matching the filename, and
   served (not in `.assetsignore`). That satisfies the *verification* half. But
   the key only authorises submissions; something must still POST changed URLs
   to `api.indexnow.org`. Two paths do that — Cloudflare **Crawler Hints** (a
   dashboard toggle, leaves no repo trace, so cannot be confirmed from here) or
   a repo-owned deploy ping (absent — nothing in `.github/` hits the endpoint).
   **Open question to resolve in the dashboard: is Crawler Hints enabled?** If
   yes, IndexNow is fully operational and this ceases to be a gap — and its
   being operational actually *strengthens* hypothesis 1: IndexNow would be
   inviting Bingbot to crawl URLs that Cloudflare then blocks, producing exactly
   the "Discovered but not crawled" state observed.

The fix path is short: allow verified bots in Cloudflare (or confirm they're
allowed), run the Live URL test on 3 main pages, repair lastmod, confirm
IndexNow submission is live (the key file already exists — check whether
Cloudflare Crawler Hints is on), and submit the sitemap in BWT. Everything else in this report — guidelines compliance, intent,
architecture, accessibility, structured data, content gaps — is strategy on top
of an already-strong site, not remediation.

---

## Phase 1 — Technical crawl (Bing lens)

Shared findings are in the companion report *[G-§1]*; the table below restates
only what changes under Bing's rules, plus the Bing-severity ranking.

| Sev | Finding | Bing-specific reasoning | Evidence |
|---|---|---|---|
| **P0** | Bingbot's HTTP experience unverified; Cloudflare challenge suspected | A 403/challenge to Bingbot marks pages not indexable regardless of markup. See §2.1 decision tree. | Symptom + hosting stack; [Cloudflare community: "Bing not indexing our website"](https://community.cloudflare.com/t/bing-not-indexing-our-website/673108), ["Bingbot unable to access sitemap — 403"](https://community.cloudflare.com/t/bingbot-unable-to-access-sitemap-403-error/391927), [Microsoft Q&A: HTTP 403 — Bing Webmaster indexing](https://learn.microsoft.com/en-us/answers/questions/2342170/receiving-http-403-error-bing-webmaster-indexing) |
| **P1** | Sitemap lastmod mass-bumped, date-only | Bing uses lastmod to prioritise crawl and asks for real timestamps (ISO 8601 incl. time); a sitemap where 88/89 URLs share one date reads as generated, and Bing deprioritises signals it can't trust. | `sitemap.xml`; [Bing sitemap guidance (July 2025)](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search) |
| **P1** | IndexNow key present but URL-submission mechanism unconfirmed | IndexNow key file exists at root (verification half done ✓); the *submission* half depends on Cloudflare Crawler Hints (dashboard-only, unverifiable from repo) or an absent deploy ping. If Crawler Hints is off, a 97-page link-sparse site waits on organic discovery Bing rations tightly. | `478027c6e87c48dd85871fe255f51ad0.txt` present, valid, served; no `api.indexnow.org` call in `.github/`; no `BingSiteAuth.xml`/`msvalidate` (verification likely via DNS or GSC import) |
| P2 | `extractvahti/` title/description drift; one canonical slash; 23 undated articles; lazy-loading gap | Same defects as *[G-§1.1]*; Bing weights exact title keywords somewhat more than Google, so the truncating 200-char description and jargon-first title cost more here. | *[G-§1.1 #1–5]* |
| P3 | Everything verified clean: status codes (static 200s + real 404 via `not_found_handling: "404-page"`), no redirects to chain/loop (no `_redirects`), canonicals, no duplicate content/titles/descriptions, one H1/page, robots.txt valid, depth ≤4, no orphans, no broken internal links, no JS-dependence for content, alt 100 %, HTTPS-only URL space | Meets [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) technical section in full. | *[G-§1.2]* |

**JavaScript rendering (Bing note):** Bing renders JS less reliably and less
often than Google. This site is immune — every indexable page's content is
static HTML; JS only powers the in-browser tools. This is a genuine Bing
advantage worth protecting.

**Mobile usability / CWV:** viewport meta present on all pages; images carry
width/height (no CLS); the CWV opportunity is the eager-loaded 168–245 KB kit
preview PNGs *[G-§1.1 #4]*. Bing's ranking uses page experience less formally
than Google, but crawl efficiency still benefits.

---

## Phase 2 — Bing indexability

### 2.1 The "main pages not indexable" decision tree (run in this order)

**Step 1 — Live URL test (10 min).** BWT → URL Inspection → enter `/`,
`/citevahti/`, `/learn/` → run **Live URL** test.
- *If it reports 403/blocked/timeout:* → Step 2 (Cloudflare). This is the
  expected branch.
- *If it reports 200 + indexable:* the verdicts are stale or it's a
  crawl-priority issue → Step 4.

**Step 2 — Cloudflare security events (5 min).** Dashboard → Security →
Events → filter last 7 days by user-agent containing `bingbot`.
- *Challenges/blocks present:* the diagnosis. Fix: Security → Bots → ensure
  **verified bots are allowed** (Super Bot Fight Mode's "Definitely automated →
  Block" has historically caught even verified crawlers; community threads
  above document Bingbot specifically being flagged as "Fake Bing or MSN Bot"
  by header anomaly rules). Add a WAF custom rule: *Skip → all remaining
  security products* when `cf.client.bot` (verified bot) is true. Re-run the
  Live URL test to confirm.
- *No events:* → Step 3.

**Step 3 — Confirm it was really Bingbot.** If logs show 200s to Bingbot UAs,
verify the requester with Bing's [Verify Bingbot tool](https://www.bing.com/webmasters/help/verify-bingbot-2195837f)
(bingbot IP check) — then the block hypothesis is excluded → Step 4.

**Step 4 — Crawl-priority path.** With access confirmed clean, the verdict is
Bing's documented conservatism with young, link-sparse domains
([Why is my site not in the index?](https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab)
lists: too few inbound links, quality thresholds, and sitemap issues as the
non-technical reasons). Remedies, all of which you control: IndexNow (§12),
truthful lastmod (§1), sitemap submitted in BWT with the Sitemap Index Coverage
report watched ([how to use it](https://blogs.bing.com/webmaster/september-2023/How-to-Use-the-new-Sitemap-Index-Coverage-to-Improve-Your-Site-s-Index-Coverage)),
URL Submission for the ~10 most important pages, and the internal-linking work
in §9. Then allow 2–4 weeks.

### 2.2 Expected per-group states (to reconcile against BWT once access is fixed)

| Group | Likely current BWT state | Reason (Microsoft docs basis) |
|---|---|---|
| Home + product pages | **Crawled-but-excluded or Discovered-not-crawled** (the reported symptom) | Access block (H1) or crawl priority (H2) — not markup; on-page layer verified clean. |
| `/learn/*` (41) | **Discovered but not crawled** | Depth-2 pages on a link-sparse domain are exactly what Bing defers; sitemap lastmod distrust compounds it. |
| Noindex set (success/thank-you/`/p/*`/carousel) | **Excluded — correct** | Intentional `noindex`; correctly absent from sitemap. |
| `lahtotilannetesti/` | Indexed for fi queries at best | No hreflang pair *[G-§2]* — Bing also consumes hreflang. |
| `search/` | Low quality / excluded | Thin utility page; acceptable either way *[G-§1.1 #6]*. |

---

## Phase 3 — Microsoft Webmaster Guidelines compliance

Audited against [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
(the "things to avoid" list: cloaking, link schemes, keyword stuffing,
duplicate content, doorway pages, misleading markup, auto-generated thin
content).

| Check | Verdict | Evidence |
|---|---|---|
| Thin content | **Pass.** Thinnest indexable pages are `search/` and hub-ish stubs; every learn/product page has substantive unique copy. | metadata dump *[G-§3/§4]* |
| Duplicate content | **Pass.** Zero duplicate titles/descriptions; en/fi pair is a translation, not a duplicate (needs hreflang, not removal). | *[G-§1.2]* |
| Doorway-like pages | **Pass.** Every tool page is a distinct product with a distinct function; no location/keyword permutations exist. | site inventory |
| AI-generated wording / auto-content | **Pass — notably clean.** Original data (120-pair model test, own transcription error tables), first-person clinician voice, no template filler. This is the opposite of the mass-AI pattern the guidelines penalise. | *[G-§4]* |
| Hidden content / cloaking | **Pass.** No display:none content blocks for crawlers; static HTML identical for all agents (one caveat: if Cloudflare is challenging bots, Bingbot literally sees *less* than users — an accidental reverse-cloak. Fixing §2.1 resolves it). | source review |
| Keyword stuffing / over-optimized anchors | **Pass.** Anchor text is editorial ("defend your sample size"), never exact-match-repeated; the house standard bans hype adjectives outright. | `docs/seo-copy-standard.md` |
| Manipulative linking | **Pass.** External links are citations (DOIs, PubMed, standards bodies); no reciprocal schemes, no paid links. | external-link inventory (90 links, mostly scholarly) |
| Excessive ads | **Pass.** Zero ads, zero trackers (site invariant). | repo policy + source |
| Navigation & hierarchy | **Adequate, improvable.** Primary nav + footer nav + visible crumbs on learn; product pages lack crumbs; hub layer missing → §5. | *[G-§5]* |
| Crawl efficiency | **Minor issues.** lastmod (§1); otherwise a flat, small, fast static site — cheap to crawl. | sitemap + depth data |

**No spam-policy violation of any kind was found.** Compliance is not the
problem; discovery and access are.

---

## Phase 4 — Search intent (Bing lens)

Full per-page analysis in *[G-§3]*; conclusions carry over with two
Bing-specific notes:

1. **Bing rewards literal query matching in titles more than Google.** The
   site's question-verbatim titles ("How do I justify my qualitative sample
   size?", "Is this journal predatory, or just expensive?") are therefore even
   better positioned on Bing — provided the pages get crawled. No change needed.
2. **Product bare-name H1s** (`ExtractVahti`, `ReviewVahti`, `SynthVahti`,
   `GuidelineVahti`, `QualiVahti Local`, `Research Strategy Kit`,
   `MatchVahti·Lite`) cost more on Bing for the same reason. Rewrite each H1 to
   the job with the product name in the title tag, e.g. ReviewVahti H1 →
   `Compute screening reliability you can report.` — the κ/PABAK/AC1/α terms
   already in the description are exactly what a Bing searcher for
   *inter-rater reliability calculator* types. Before/after examples in
   *[G-§3]* table.
3. First-paragraph answer discipline: verified present on the learn corpus
   (question restated and answered in the opening screen). Pass.

---

## Phase 5 — Information architecture

Identical recommendation to *[G-§5]* — the 9-stage researcher-workflow hub
layer (`/research-question/ → /study-design/ → /data-collection/ → /analysis/
→ /writing/ → /submission/ → /peer-review/ → /evidence-synthesis/ →
/research-integrity/`), built additively on the existing `/download/`
(by-stage) and `/learn/` (by-problem) pages, with crumbs extended to product
pages and every hub linking its members.

Bing-specific addendum: Bing's crawler benefits even more from shallow,
heavily-interlinked hub structures on small sites, because its crawl budget for
young domains is smaller — hubs concentrate discovery so one crawled hub
reveals a whole cluster. This makes §5 a *crawlability* fix on Bing, not only
an authority play.

---

## Phase 6 — Authority and trust

State and fixes as *[G-§6]* (named MD/PhD author with ORCID; org schema with
email; per-tool privacy pages; exceptional AI-disclosure surface via `llms.txt`
+ `/agents/`; gaps: standalone `Person` entity, `founder` on Organization,
visible dates on 23 articles, a short editorial note on how site articles are
written).

Bing addendum: Bing's quality documentation ("Quality and Credibility" in the
[Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a))
names authorship transparency, cited sources, and clear site ownership as
ranking-relevant credibility inputs — the same fix list applies verbatim, and
the citations-to-primary-literature habit (DOI-linked references throughout the
learn corpus) is already a differentiator worth keeping visible near the top of
articles rather than only at the foot.

---

## Phase 7 — Accessibility

Evidence of an unusually strong baseline, verified in-repo:

- **A hard WCAG 2.2 AA CI gate exists**: `.pa11yci` runs pa11y-ci over 52 URLs
  on every build; an a11y regression on a covered page fails CI. Almost no
  competitor site in §11 gates merges on accessibility.
- Semantic structure: one `<h1>` per page (97/97), labelled navs
  (`aria-label="Primary"`, `"Footer"`, breadcrumb navs on articles), `<time>`
  elements where dates are shown.
- Images: 100 % alt coverage; decorative favicons are data-URIs outside the
  accessibility tree; content images carry real descriptions (verified sample:
  the QualiVahti preview alt describes the actual vault UI).
- Motion: the site standard requires `prefers-reduced-motion` handling for the
  canvas hero (WCAG 2.2 SC 2.3.3) — encoded in the site skill and hero JS.
- Typography/responsive: static CSS with relative sizing; viewport meta on all
  pages; no horizontal-scroll layouts found in source.

**Findings:**

1. **35 indexable pages are absent from the pa11y gate** (diff run during this
   audit): all kit/product pages added recently (`/kits/`, `/qualivahti-local/`,
   `/manuscript-kit/`, `/reviewers-notebook/`, `/studyvahti-vault/`,
   `/reviewer-response-builder/`, `/research-domain-cube/`, `/dictvahti/`,
   `/guidelinevahti/`, `/matchvahti-lite/`, `/auditlite/`, `/agents/`,
   `/support/`, `/open-source/`, `/citevahti/privacy/`) plus 19 newer learn
   articles. Add them to `.pa11yci` — the checklist already says new public
   pages must be added as they ship; this is drift.
2. Keyboard/focus/contrast: not re-verifiable from static source alone beyond
   the gate's coverage; the pa11y extension above is the systematic fix.
   Microsoft's accessibility guidance ([Microsoft accessibility](https://www.microsoft.com/en-us/accessibility))
   and Bing's crawler both reward exactly the semantic-HTML discipline already
   in place — no structural changes recommended.

---

## Phase 8 — Structured data (Bing lens)

Inventory (0 parse errors across 97 pages): TechArticle ×42,
SoftwareApplication ×12, WebPage ×9, Product ×7, WebApplication ×6,
CollectionPage ×4, FAQPage ×3, BlogPosting ×2, AboutPage, Blog, Service,
Organization, WebSite. Missing: `BreadcrumbList` (0 pages), standalone
`Person`.

Bing-specific deltas from the Google verdicts *[G-§7]*:

- **FAQPage is worth *more* on Bing**: Bing/Copilot still consume Q&A markup
  for answer surfaces without Google's gov/health restriction. Keep the 3
  existing FAQPage blocks and add FAQ sections+markup where the content
  genuinely has them (the disclosure and predatory-journal articles are
  natural fits).
- **BreadcrumbList**: add (visible crumbs already exist on learn) — Bing shows
  breadcrumb trails in results and uses them for hierarchy.
- **SearchAction**: Google retired the rich result, but Bing has no such
  deprecation; harmless to add to the existing `WebSite` node pointing at
  `/search/`. Low priority.
- **HowTo**: several learn guides are literal step-by-step procedures
  (Whisper transcription, Zotero setup, codebook build). Google deprecated the
  rich result; Bing did not announce an equivalent deprecation — but the
  markup's practical yield is now mainly answer-engine extraction. Optional;
  do not restructure content for it.
- `Organization`/`WebSite`/`Person`/`SoftwareApplication` fixes: identical to
  *[G-§7]*.

---

## Phase 9 — Internal linking

Graph facts and strategy identical to *[G-§8]*: no isolated pages; the weak
tail is 15 indexable pages with ≤2 inbound links; fix via (1) completing each
cluster's `voc-related` mesh, (2) product↔guide reciprocity, (3) hub wiring.

Bing addendum: on Bing the same work does double duty as *discovery* (§5
addendum). One extra pass worth doing for Bing specifically: ensure the
homepage links (directly or via one hop) every page you most want indexed —
homepage-adjacent URLs get crawled first on link-sparse domains. Current depth
map already achieves ≤2 for 82/86 indexable pages; the four depth-3/4 learn
articles (`obsidian-plugins-for-researchers` at 4;
`history-of-qualitative-research`, `lessons-from-being-a-supervisor`,
`obsidian-for-researchers` at 3) should each gain one link from a depth-1 page
(the `/learn/` index already exists — add them to its visible list if absent).

---

## Phase 10 — Content gaps

The gap analysis in *[G-§9]* stands unchanged for Bing — including the finding
that most of the "obvious" gaps are already covered (sample-size justification
✓, AI disclosure examples ✓, reviewer response ✓, predatory journal ✓,
saturation ✓, systematic-review stopping ✓). The 8 proposed pages with
intent/outline/cluster tables: limitations writing, Cohen's κ interpretation,
QUADAS-2 plain-language, GRADE explained, PICOTS, PROSPERO registration, data
availability statements, retracted-citation checking.

One addition for this brief's list — **observational study reporting**:

| Proposed page | Target intent | Outline | Cluster / value |
|---|---|---|---|
| `learn/strobe-checklist-explained/` | *STROBE checklist how to* / *observational study reporting guidelines* | What STROBE is and is not; the 22 items grouped by manuscript section with a worked cohort example; the 5 items reviewers actually reject on; how it maps to StudyVahti's triage | Study-design/writing clusters → StudyVahti + StudyVahti Vault (which already implements STROBE items — the explainer is the missing public entry door, same pattern as κ→ReviewVahti) |

---

## Phase 11 — Competitive benchmark

The quality-dimension comparison in *[G-§10]* applies to the Bing brief's
dimension list directly; summary verdicts unchanged: Vahtian leads the set on
answer-first structure, on-page task completion (guide + working local tool),
printed honesty about limits, and machine-readability; it trails on visible
trust furniture (dates, entity markup) and cluster expression — both already
in the roadmap. One Bing-specific observation: several benchmark sites
(Elsevier Researcher Academy in particular) gate content behind logins and
JS-heavy shells that Bing renders poorly; Vahtian's static-HTML corpus is
structurally easier for Bing to index than most of its competitors — once the
access/discovery problem is fixed, the playing field tilts favourably.

Accessibility (this brief's added dimension): Vahtian is the only site in the
set with a public, CI-enforced WCAG 2.2 AA gate in its repo; university methods
centres in particular distribute untagged PDFs. Clear lead once §7's coverage
drift is fixed.

---

## Phase 12 — Bing-specific opportunities

| Opportunity | Current state | Recommendation | Basis |
|---|---|---|---|
| **Bing Webmaster Tools** | Verified (assumed — no repo artifact, so likely DNS or GSC-import) but underused | Submit `sitemap.xml`; watch **Sitemap Index Coverage**; run **Site Scan** once (it reports Bing's own view of technical issues); use **URL Submission** for the top ~10 pages now | [Sitemap Index Coverage report](https://blogs.bing.com/webmaster/september-2023/How-to-Use-the-new-Sitemap-Index-Coverage-to-Improve-Your-Site-s-Index-Coverage) |
| **IndexNow** | **Key present (added 2026-07-18); submission path unconfirmed.** The key file half is already done correctly. | **First: confirm in Cloudflare dashboard → Speed → Optimization → Crawler Hints whether it is ON** — if so, submission is automatic and IndexNow is complete, do nothing further. If OFF, either flip that toggle (zero-maintenance) **or** add the repo-owned option: a ~30-line GitHub Action on push-to-main that diffs changed public pages and POSTs them to `api.indexnow.org` with `keyLocation` pointing at the existing key file. The repo-owned path is more precise and keeps behaviour visible in-repo; it reuses the key that already exists. | [indexnow.org documentation](https://www.indexnow.org/documentation); Bing sitemap blog above ("sitemaps + IndexNow together") |
| **XML sitemap quality** | Structurally valid; lastmod untrustworthy | Truthful per-URL lastmod from git history, full ISO-8601 with time (`2026-07-19T14:32:00+00:00`), regenerate on real change only | [Bing sitemap guidance (July 2025)](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search) |
| **Crawl efficiency** | Good (small flat static site) | Nothing beyond lastmod + hubs; do **not** add crawl-delay | robots.txt review |
| **Image search** | Descriptive filenames ✓, alt 100 % ✓, dimensions ✓ | WebP re-encode of the 4 heavy previews *[G-§1.1 #4]*; optional: image entries in the sitemap for the product screenshots (Bing image search is a real discovery channel for tool UIs) | Bing Webmaster Guidelines, media section |
| **Multimedia** | None (no video) | If demo videos ever ship (e.g. the CiteVahti GIF as MP4), add VideoObject markup then — not before | — |
| **Social metadata / Open Graph** | **Complete sitewide**: full OG set incl. 1200×630 images + `twitter:card` on every page (audit-gate enforced) | None — already best-practice; Bing reads OG for its own surfaces | *[G-§1.2]*; `audit.sh` |
| **Copilot / answer engines** | `llms.txt` + `/agents/` + robots welcoming AI crawlers | Keep; Bingbot feeds Copilot, so fixing §2.1 access also fixes Copilot visibility | robots.txt |

---

## Phase 13 — Prioritized roadmap

### Quick wins (< 1 day) — do these first, in order
1. **Run the §2.1 decision tree** (Live URL test ×3 pages → Cloudflare bot
   settings → WAF skip-rule for verified bots). *(Indexability: unblocks
   everything else; nothing below matters while Bingbot can't fetch pages)*
2. **Confirm IndexNow submission is live** — the key file already exists
   (added 2026-07-18); check whether Cloudflare Crawler Hints is ON (Speed →
   Optimization → Crawler Hints). If ON, IndexNow is done. If OFF, flip it, or
   add the repo-owned GitHub Action later. *(Discovery)*
3. **Submit sitemap in BWT + URL-submit the 10 main pages.** *(Discovery)*
4. Fix `extractvahti/` title/description; `qualivahti-local/success/` canonical
   slash *[G-roadmap #1–2]*. *(Content quality)*

### High impact (≈ 1 week)
5. **Truthful ISO-8601 lastmod** generated from git history; wire into
   `audit.sh` so drift fails CI. *(Crawlability — Bing weights this more than
   Google)*
6. hreflang pair en↔fi; visible dates + bylines on the 23 undated articles;
   `Person` + `founder` + `BreadcrumbList` schema *[G-roadmap #3,5,7,8]*.
   *(Indexability, content quality, trust)*
7. **Extend `.pa11yci` with the 35 missing indexable pages** (§7). *(Accessibility)*
8. Internal-linking pass: 15 weak-inbound pages + one depth-1 link for the four
   depth-3/4 articles (§9). *(Topical authority + Bing discovery)*
9. Watch BWT Index Coverage for 2 weeks after #1–3; reconcile §2.2's estimates
   against real verdicts.

### Strategic (≈ 1 month)
10. Workflow-stage hubs + product breadcrumbs (§5). *(Topical authority,
    crawl concentration, researcher usefulness)*
11. First gap pages: limitations, κ interpretation, QUADAS-2, **STROBE
    explained** (§10). *(Usefulness; entry doors to ReviewVahti / ExtractVahti /
    StudyVahti)*
12. Repo-owned IndexNow Action (option b) replacing/augmenting the toggle;
    editorial note (§6).

### Long-term (3–12 months)
13. Remaining gap pages; FAQ markup extension on genuinely-Q&A articles (§8);
    image-sitemap entries for product screenshots (§12).
14. Quarterly re-run of both audits' extraction scripts; keep `audit.sh` as the
    codification of every invariant (lastmod truthfulness, canonical slashes,
    description ceilings, pa11y coverage parity).

### Impact × Effort

| # | Action | Impact (Bing) | Effort | Ratio |
|---|--------|---------------|--------|-------|
| 1 | Cloudflare/Bingbot access fix | **Critical** | XS | ★★★★★ |
| 2–3 | IndexNow + sitemap/URL submission | High | XS | ★★★★★ |
| 5 | Truthful lastmod | High | S | ★★★★★ |
| 8 | Linking pass | High | S | ★★★★★ |
| 4 | extractvahti + canonical fixes | Med | XS | ★★★★☆ |
| 6 | Dates/Person/Breadcrumb/hreflang | Med | S | ★★★★☆ |
| 7 | pa11y coverage parity | Med | S | ★★★★☆ |
| 10 | Workflow hubs | High | M | ★★★★☆ |
| 11 | Gap content incl. STROBE | High | M | ★★★★☆ |
| 12–13 | IndexNow Action, FAQ/image extensions | Low-Med | S–M | ★★★☆☆ |

---

## Microsoft / Bing documentation referenced

- Bing Webmaster Guidelines — https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Why is my site not in the index? — https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab
- Keeping Content Discoverable with Sitemaps in AI-Powered Search (lastmod/ISO-8601/IndexNow, July 2025) — https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search
- Sitemap Index Coverage report — https://blogs.bing.com/webmaster/september-2023/How-to-Use-the-new-Sitemap-Index-Coverage-to-Improve-Your-Site-s-Index-Coverage
- IndexNow protocol — https://www.indexnow.org/documentation
- Verify Bingbot — https://www.bing.com/webmasters/help/verify-bingbot-2195837f
- Microsoft Q&A: 403 errors and Bing indexing — https://learn.microsoft.com/en-us/answers/questions/2342170/receiving-http-403-error-bing-webmaster-indexing ; "Discovered but not crawled" — https://learn.microsoft.com/en-us/answers/questions/5920490/bing-webmaster-tools-showing-discovered-but-not-cr
- Cloudflare community evidence of Bingbot blocking — https://community.cloudflare.com/t/bing-not-indexing-our-website/673108 ; https://community.cloudflare.com/t/bingbot-unable-to-access-sitemap-403-error/391927
- Microsoft accessibility — https://www.microsoft.com/en-us/accessibility

No recommendation above involves keyword stuffing, doorway pages, hidden
content, manipulative linking, or mass AI content; all content recommendations
follow the site invariant and `docs/seo-copy-standard.md`.
