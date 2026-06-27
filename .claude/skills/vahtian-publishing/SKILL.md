---
name: vahtian-publishing
description: Set up and run publishing for the Vahtian packages from the monorepo — the Python package to PyPI (via Trusted Publishing / OIDC, no API tokens) and the R package to R-universe and CRAN. Use when configuring releases, adding a publish workflow, cutting a version, reserving the `vahtian` name on PyPI/CRAN, or wiring the cross-language golden-hash parity test. Models the dual-language monorepo conventions of heidihelena/epinet (Python + R in one repo, CITATION.cff, r-lib/actions, src layout).
---

# Vahtian — publishing Python (PyPI) + R (CRAN / R-universe) from the monorepo

Both packages live in **subdirectories** of `heidihelena/vahtian` (the static site is
at the repo root): `packages/vahtian-py/` and `packages/vahtian-r/` (R package name
TBD — `vahtian` for brand parity, or `vahtianR` per the epinet convention). Same flagship
name, same `freeze/verify/audit` core, **byte-identical `content_hash`** — so the headline
CI gate is a cross-language parity test, not just two independent test suites.

Tags below: **[do]** (adopt — high impact-to-effort for a solo maintainer) ·
**[over]** (real but disproportionate for a solo, no-team product — skip for now).

## A. PyPI — Trusted Publishing (no stored tokens)

The whole point: **no API tokens in the repo.** GitHub Actions authenticates to PyPI via
OIDC; PyPI mints a project-scoped token valid for only ~15 minutes, so nothing leakable
persists.

**One-time setup (before the first release):**
1. On PyPI → your account → **Publishing → Add a pending publisher** (GitHub). A *pending*
   publisher lets you reserve a not-yet-existent project; it **auto-converts** to a normal
   trusted publisher on the first successful publish — no manual first upload needed. Fields:
   - **PyPI Project Name:** `vahtian`
   - **Owner:** `heidihelena`
   - **Repository name:** `vahtian` *(this monorepo)*
   - **Workflow name:** `publish-pypi.yml` *(filename only, lives at repo-root `.github/workflows/`)*
   - **Environment name:** `pypi` *(optional but **[do]** — add a GitHub Environment with
     protection so only approved refs can publish)*
2. Repeat on **test.pypi.org** for dry-runs (separate pending publisher).

**The workflow** (`references/pypi-publish.yml` → copy to repo-root `.github/workflows/publish-pypi.yml`):
- Triggers on a version tag (`on: push: tags: ["v*"]`).
- `permissions: id-token: write` (+ `contents: read`) — and **never** set username/password.
- **Build first, then publish.** `pypa/gh-action-pypi-publish` does **not** build packages
  and is Linux-only (docker) — it just uploads what's already in `dist/`. So a build step
  (`pipx run build` / `python -m build`) runs first, with `working-directory: packages/vahtian-py`.
- **PEP 740 attestations are on by default** (Sigstore, tied to the OIDC identity) — leave them on.
- Pin the action to a SHA or the `release/v1` major tag; keep `permissions:` least-privilege.

**Build backend & metadata [do]:**
- **hatchling** (simple, PEP 621, what epinet-style repos use). Add **`hatch-vcs`** to
  single-source the version from the git tag — a build hook writes
  `__version__ = version = '0.1.0'` from tag `v0.1.0`. No version hand-editing.
- `pyproject.toml`: complete PEP 621 metadata — `classifiers`, SPDX `license = "Apache-2.0"`
  (PEP 639), `project.urls`, `project.scripts` (the `vahtian` CLI), `requires-python`. **src/
  layout** (already used) so tests run against the installed package, not the source tree.

**Releasing:** push a tag (`git tag v0.1.0 && git push --tags`). Dry-run to TestPyPI first by
pointing the publish step at `repository-url: https://test.pypi.org/legacy/`.

**[over]:** a cibuildwheel multi-OS/arch wheel matrix — `vahtian` is pure Python, one
universal wheel covers everything.

## B. R — R-universe first, then CRAN

**Reserve + distribute fast via R-universe [do]** (no review, continuous builds):
- Create a registry repo `heidihelena/heidihelena.r-universe.dev` containing `packages.json`
  listing the package — its Git URL, and (for a monorepo) the **subdir** and optional `branch`.
  R-universe rebuilds on every push and serves `install.packages("vahtian", repos =
  "https://heidihelena.r-universe.dev")`. This *reserves* and ships the name immediately.

**CI check (`references/r-cmd-check.yaml` → `.github/workflows/r-cmd-check.yaml`) [do]:**
- `r-lib/actions/setup-r`, then `setup-r-dependencies` (`extra-packages: any::rcmdcheck`,
  `needs: check`), then **`r-lib/actions/check-r-package@v2`** — it runs `R CMD check` via
  `rcmdcheck`. Use its **`working-directory: packages/vahtian-r`** input so the subdir package
  is checked. Pin `r-lib/actions` at `@v2`.
- The bar for CRAN: **`R CMD check --as-cran` with 0 errors / 0 warnings / 0 notes.**

**Package hygiene [do]:** `roxygen2` (generates `man/` + `NAMESPACE` — never hand-edit
NAMESPACE), `testthat` tests, a complete `DESCRIPTION` (Title, Version, Authors@R with ORCID,
Description, License: Apache-2.0, URL/BugReports). `usethis` scaffolds all of this.

**CRAN submission (when stable) [do, later]:** pre-check on **win-builder**, **mac-builder**,
and **R-hub v2**; write `cran-comments.md`; submit with `devtools::release()` /
`usethis::use_release_issue()`; on a NOTE, fix or justify in cran-comments and resubmit
politely. CRAN doesn't pre-reserve names — being first to pass review claims it.

**Docs [do, optional]:** `pkgdown` site via the `r-lib/actions` `pkgdown.yaml` example.

## C. Cross-cutting (the monorepo glue)

1. **Version sync [do].** One source of truth = the git tag. Python gets it via `hatch-vcs`;
   for R, a tiny release step rewrites `DESCRIPTION: Version:` from the tag. Keep Py and R
   versions equal.
2. **Cross-language golden-hash parity test [do — the headline gate].** Commit one fixture
   record set + its expected `content_hash`. Python CI and R CI each compute the hash and assert
   it equals the golden value. This is what makes "same function in both languages" *true* and
   catches any drift in the canonical JSON serialisation. Add it to the existing CI.
3. **CITATION.cff [do].** Already at the repo root — keep author/ORCID/version consistent with
   both registries (it's what GitHub, Zenodo, PyPI, and CRAN-adjacent tooling read).
4. **Release automation.** A single `v*` tag → the PyPI workflow builds+publishes Python, and
   R-universe auto-rebuilds on the push; CRAN stays a deliberate manual step. **[over]:**
   `release-please` per-package component tags (`py-v*`/`r-v*`, `separate-pull-requests`) — nice
   for a team, overhead for a solo maintainer; start with one shared tag.

## Reference files
- `references/pypi-publish.yml` — the Trusted-Publishing workflow (build in subdir → publish).
- `references/r-cmd-check.yaml` — the r-lib CRAN-check workflow for the subdir R package.

## Evidence base
Grounded in a verified research pass (the synthesis step failed under API rate-limiting, so
facts were recovered from the verification transcripts): PyPI Trusted Publishing + `id-token:
write` with no username/password; pending publishers auto-convert on first use; PEP 740
attestations default-on; ~15-minute OIDC token; the publish action does not build and is
Linux-only; `hatch-vcs` tag→version; `r-lib/actions` `check-r-package@v2` with a
`working-directory` input; R-universe branch/subdir tracking; `release-please` monorepo tags.
Modeled on the dual-language monorepo `heidihelena/epinet`.
