#!/usr/bin/env python3
"""
vahtian_search.py — open, reproducible multi-source search → one frozen corpus.

The agent-run search builder for the agent-driven SR pipeline (docs/agent-driven-pipeline.md).
Open APIs only, so anyone can re-run it: PubMed/MEDLINE (E-utilities) + Europe PMC + Semantic
Scholar + OpenAlex + forward/backward citation chasing. Embase/WoS/Scopus are deliberately
excluded (access + reproducibility, see the design doc §3).

It writes a frozen-corpus JSONL (record_id keyed, per-source provenance, search-date lock,
content hash) and a search-report. Stdlib only — no pip install.

Honest scope: this is the IDENTIFY stage. High recall is wanted; precision is the screening
job (MatchVahti). A uniform relevance filter (one term from each concept block in title/abstract)
is applied to the open co-sources so cross-source dedup is meaningful.
"""
import json, re, sys, time, hashlib, urllib.parse, urllib.request, os
from datetime import date

CONTACT = "andersenheidihelena@gmail.com"   # API etiquette (NCBI tool=, OpenAlex mailto=)
SEARCH_DATE = date.today().isoformat()
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else "pilot/pdl1"

# ---- concept blocks (locked 2026-06-23; PD-L1 MeSH heading = "B7-H1 Antigen") ---------------
PUBMED_QUERY = (
 '("Carcinoma, Non-Small-Cell Lung"[MeSH] OR "Lung Neoplasms"[MeSH] OR NSCLC[tiab] OR "non-small cell"[tiab]) '
 'AND ("B7-H1 Antigen"[MeSH] OR PD-L1[tiab] OR CD274[tiab] OR "tumor proportion score"[tiab] OR TPS[tiab]) '
 'AND ("Artificial Intelligence"[MeSH] OR "Deep Learning"[tiab] OR "machine learning"[tiab] '
 'OR "image analysis"[tiab] OR "computational pathology"[tiab] OR "whole slide"[tiab])'
)
BLOCK_LUNG = ["nsclc", "non-small cell", "non small cell", "nonsmall cell", "non-small-cell"]
BLOCK_PDL1 = ["pd-l1", "pdl1", "cd274", "tumor proportion score", "tumour proportion score",
              "tps", "b7-h1", "b7 h1", "programmed death ligand", "programmed death-ligand"]
BLOCK_AI   = ["deep learning", "machine learning", "artificial intelligence", "computational pathology",
              "whole slide", "whole-slide", "image analysis", "digital pathology",
              "convolutional neural", "neural network"]
# citation-chasing seeds — on-topic anchors from the scoping draft
SEEDS = ["10.1136/jcp-2024-209766", "10.1016/j.jtho.2025.07.131", "10.1111/his.15432",
         "10.3389/fonc.2026.1790571", "10.1038/s41598-025-28365-z"]

def _term_re(t):
    t = t.lower()
    if " " in t or "-" in t:                 # phrase / hyphenated → substring
        return re.compile(re.escape(t))
    return re.compile(r"\b" + re.escape(t) + r"\b")   # short token → word boundary
_LUNG = [_term_re(t) for t in BLOCK_LUNG]
_PDL1 = [_term_re(t) for t in BLOCK_PDL1]
_AI   = [_term_re(t) for t in BLOCK_AI]

def relevant(title, abstract):
    blob = ((title or "") + " " + (abstract or "")).lower()
    return (any(r.search(blob) for r in _LUNG)
            and any(r.search(blob) for r in _PDL1)
            and any(r.search(blob) for r in _AI))

def http_json(url, headers=None, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=headers or {"User-Agent": f"vahtian-search ({CONTACT})"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if i == tries - 1:
                print(f"    ! {url[:70]}… failed: {e}", file=sys.stderr)
                return None
            time.sleep(1.5 * (i + 1))
    return None

def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()

def dedup_key(pmid, doi, title):
    if pmid:  return "pmid:" + str(pmid)
    if doi:   return "doi:" + doi.lower().replace("https://doi.org/", "").replace("http://doi.org/", "")
    nt = norm_title(title)
    return "title:" + hashlib.sha1(nt.encode()).hexdigest()[:16] if nt else None

# ---- sources --------------------------------------------------------------------------------
def src_pubmed():
    E = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    q = urllib.parse.quote(PUBMED_QUERY)
    s = http_json(f"{E}/esearch.fcgi?db=pubmed&retmode=json&retmax=2000&tool=vahtian&email={CONTACT}&term={q}")
    ids = (s or {}).get("esearchresult", {}).get("idlist", [])
    out = []
    for i in range(0, len(ids), 200):
        chunk = ids[i:i+200]
        sm = http_json(f"{E}/esummary.fcgi?db=pubmed&retmode=json&tool=vahtian&email={CONTACT}&id=" + ",".join(chunk))
        res = (sm or {}).get("result", {})
        # abstracts in one efetch
        ab = {}
        try:
            req = urllib.request.Request(f"{E}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&tool=vahtian&email={CONTACT}&id=" + ",".join(chunk),
                                         headers={"User-Agent": f"vahtian-search ({CONTACT})"})
            with urllib.request.urlopen(req, timeout=90) as r:
                xml = r.read().decode("utf-8", "ignore")
            for m in re.finditer(r"<PMID[^>]*>(\d+)</PMID>.*?(?:<Abstract>(.*?)</Abstract>|<ArticleTitle)", xml, re.S):
                pid, abx = m.group(1), m.group(2) or ""
                ab[pid] = re.sub(r"<[^>]+>", " ", abx)
        except Exception:
            pass
        for pid in chunk:
            p = res.get(pid)
            if not p: continue
            doi = next((x["value"] for x in p.get("articleids", []) if x["idtype"] == "doi"), None)
            out.append({"pmid": pid, "doi": doi, "title": p.get("title", ""),
                        "abstract": ab.get(pid, ""), "year": (p.get("sortpubdate") or "")[:4],
                        "venue": p.get("fulljournalname", "")})
        time.sleep(0.4)
    return out

def src_europepmc():
    base = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    def block(terms): return "(" + " OR ".join(f'(TITLE:"{t}" OR ABSTRACT:"{t}")' for t in terms) + ")"
    q = f"{block(['NSCLC','non-small cell'])} AND {block(['PD-L1','CD274','tumor proportion score','TPS'])} AND {block(['deep learning','machine learning','artificial intelligence','computational pathology','whole slide','image analysis'])}"
    out, cursor = [], "*"
    for _ in range(6):
        u = base + "?" + urllib.parse.urlencode({"query": q, "format": "json", "pageSize": 200,
                                                 "cursorMark": cursor, "resultType": "core"})
        d = http_json(u)
        if not d: break
        for r in d.get("resultList", {}).get("result", []):
            out.append({"pmid": r.get("pmid"), "doi": (r.get("doi") or None),
                        "title": r.get("title", ""), "abstract": r.get("abstractText", ""),
                        "year": str(r.get("pubYear", "")), "venue": r.get("journalTitle", r.get("source", ""))})
        nxt = d.get("nextCursorMark")
        if not nxt or nxt == cursor: break
        cursor = nxt; time.sleep(0.4)
    return out

def src_semanticscholar():
    base = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
    q = '(NSCLC | "non-small cell") + ("PD-L1" | CD274 | "tumor proportion score" | TPS) + ("deep learning" | "machine learning" | "artificial intelligence" | "computational pathology" | "whole slide" | "image analysis")'
    out, token = [], None
    for _ in range(3):
        params = {"query": q, "fields": "externalIds,title,abstract,year,venue"}
        if token: params["token"] = token
        d = http_json(base + "?" + urllib.parse.urlencode(params))
        if not d: break
        for r in d.get("data", []) or []:
            ext = r.get("externalIds") or {}
            out.append({"pmid": ext.get("PubMed"), "doi": ext.get("DOI"),
                        "title": r.get("title", ""), "abstract": r.get("abstract", ""),
                        "year": str(r.get("year", "")), "venue": r.get("venue", "")})
        token = d.get("token")
        if not token: break
        time.sleep(1.2)
    return out

def src_openalex():
    base = "https://api.openalex.org/works"
    out = []
    for phrase in ["PD-L1 lung", "PD-L1 NSCLC", "tumor proportion score lung"]:
        cursor = "*"
        for _ in range(3):
            u = base + "?" + urllib.parse.urlencode(
                {"filter": f"title_and_abstract.search:{phrase}", "per-page": 200,
                 "cursor": cursor, "mailto": CONTACT})
            d = http_json(u)
            if not d: break
            for w in d.get("results", []):
                inv = w.get("abstract_inverted_index")
                ab = ""
                if inv:
                    pos = {}
                    for word, idxs in inv.items():
                        for ix in idxs: pos[ix] = word
                    ab = " ".join(pos[k] for k in sorted(pos))
                doi = (w.get("doi") or "")
                pmid = None
                ids = w.get("ids") or {}
                if ids.get("pmid"): pmid = ids["pmid"].rsplit("/", 1)[-1]
                out.append({"pmid": pmid, "doi": doi or None, "title": w.get("title", "") or "",
                            "abstract": ab, "year": str(w.get("publication_year", "")),
                            "venue": ((w.get("primary_location") or {}).get("source") or {}).get("display_name", "")})
            cursor = (d.get("meta") or {}).get("next_cursor")
            if not cursor: break
            time.sleep(0.4)
    return out

def src_citation_chasing():
    base = "https://api.semanticscholar.org/graph/v1/paper/"
    fields = "references.externalIds,references.title,references.abstract,references.year,references.venue,citations.externalIds,citations.title,citations.abstract,citations.year,citations.venue"
    out = []
    for doi in SEEDS:
        d = http_json(base + f"DOI:{doi}?fields={fields}")
        if not d:
            time.sleep(1.2); continue
        for side in ("references", "citations"):
            for r in d.get(side, []) or []:
                ext = r.get("externalIds") or {}
                out.append({"pmid": ext.get("PubMed"), "doi": ext.get("DOI"),
                            "title": r.get("title", "") or "", "abstract": r.get("abstract", "") or "",
                            "year": str(r.get("year", "")), "venue": r.get("venue", "")})
        time.sleep(1.2)
    return out

# ---- run, merge, dedup ----------------------------------------------------------------------
SOURCES = [("pubmed", src_pubmed, False),          # (name, fn, apply_uniform_filter)
           ("europepmc", src_europepmc, True),
           ("semanticscholar", src_semanticscholar, True),
           ("openalex", src_openalex, True),
           ("citation-chasing", src_citation_chasing, True)]

def main():
    os.makedirs(OUTDIR, exist_ok=True)
    corpus, report = {}, []
    for name, fn, filt in SOURCES:
        print(f"  running {name} …", file=sys.stderr)
        try: recs = fn() or []
        except Exception as e:
            print(f"    ! {name} crashed: {e}", file=sys.stderr); recs = []
        kept = [r for r in recs if (relevant(r["title"], r["abstract"]) if filt else True)]
        new = 0
        for r in kept:
            k = dedup_key(r.get("pmid"), r.get("doi"), r.get("title"))
            if not k: continue
            prov = {"source": name, "search_date": SEARCH_DATE}
            if k in corpus:
                corpus[k]["provenance"].append(prov)
            else:
                corpus[k] = {"record_id": k, "pmid": r.get("pmid"), "doi": r.get("doi"),
                             "title": r.get("title", ""), "abstract": r.get("abstract", ""),
                             "year": r.get("year", ""), "venue": r.get("venue", ""),
                             "provenance": [prov]}
                new += 1
        report.append((name, len(recs), len(kept), new))
        print(f"    {name}: retrieved={len(recs)} relevant={len(kept)} net-new={new}", file=sys.stderr)

    records = list(corpus.values())
    chash = hashlib.sha256("".join(sorted(corpus.keys())).encode()).hexdigest()[:16]
    # write frozen corpus
    with open(f"{OUTDIR}/frozen-corpus.jsonl", "w") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    # write report
    lines = [f"# Frozen corpus — PD-L1 AI-vs-pathologist pilot",
             f"\nsearch_date: {SEARCH_DATE}  ·  content_hash: {chash}  ·  total unique: {len(records)}\n",
             "| source | retrieved | relevant | net-new (vs prior) |",
             "|---|---|---|---|"]
    for n, rt, rel, nw in report:
        lines.append(f"| {n} | {rt} | {rel} | {nw} |")
    open(f"{OUTDIR}/search-report.md", "w").write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\nWrote {OUTDIR}/frozen-corpus.jsonl ({len(records)} records) + search-report.md")

if __name__ == "__main__":
    main()
