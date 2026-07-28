# Reference check regression tests

Every case in `run.mjs` is a bug reported against a real reference list. The test
loads the rules out of `/reference-check/index.html` itself, so there is no second
copy to drift and a page that stops parsing fails the run.

```bash
node .claude/evals/reference-check/run.mjs
```

CI gate: `tool-logic` in `.github/workflows/ci.yml`.

## Why the fixtures are recorded and not live

The registries are not the thing under test. A live test fails when Crossref is
slow, when a record is edited, or when the machine is offline, and none of those
are the tool being wrong. `fakeFetch` answers from recorded response shapes —
including Crossref's case-insensitivity, which is real and which the tool relies
on when it looks up the lowercased DOI.

If a registry changes its **schema**, this test will keep passing while the tool
breaks. That is the known hole. The adapters (`fromDataCite`, `fromOpenLibrary`)
are where it would show, and they are small on purpose.

## The cases

| # | Case | The bug it pins |
|---|---|---|
| 1 | `…020%3C0130:DNF%3E2.0.CO;2` | A DOI copied out of a URL bar arrives percent-encoded. The registry holds the decoded form, so a perfectly good legacy DOI was reported unresolvable. |
| 2 | `…020<0130:DNF>2.0.CO;2` | The extraction pattern excluded angle brackets outright, truncating the legacy AMS/society DOIs at the `<`. |
| 3 | `Trends in Ecology &amp; Evolution` | Crossref stores metadata as markup. Compared raw, `&amp;` normalises to the word "amp" and every journal with an ampersand mismatched a correct citation. |
| 4 | `arXiv:1606.06565` | arXiv DOIs register with DataCite, not Crossref. A preprint-heavy list came back mostly unchecked. |
| 5 | `ISBN 978-0-262-03561-3` | Books were unreachable. OpenLibrary gives authors in display order, so the surname is the last word, not the first. |
| 6 | arXiv ID beside a published DOI | The preprint of a paper already being checked must not be counted as a second reference. |
| 7 | conference proceedings, no identifier | Genuinely unresolvable entries must still be listed back. Widening coverage must not quietly shrink the unchecked list. |
| 8 | a DOI in neither registry | The wording has to say both were tried, or the reader assumes only Crossref was. |

## The rule these cases share

Both false positives (1 and 3) came from comparing surface strings rather than
resolved values. **Decode first, then compare.** A checker that reports a defect
in a correct citation is worse than one that stays quiet: it sends the author
hunting for something that is not there, and it teaches them to ignore the tool.

## Adding a case

Add the reported input, the recorded registry response, and an assertion that
names the defect rather than the symptom. If a case needs a fixture the registry
does not actually return, the case is wrong.
