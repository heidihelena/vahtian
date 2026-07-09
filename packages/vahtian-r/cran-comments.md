## R CMD check results

0 errors | 0 warnings | 1 note

* This is a new submission.

## Test environments

* GitHub Actions (ubuntu-latest, R release) via r-lib/actions
* win-builder (devel and release)   <!-- run devtools::check_win_devel() before submitting -->
* R-hub v2 (linux, macos, windows)  <!-- run rhub::rhub_check() before submitting -->

## Notes

* The package is the R half of a dual-language pair; the canonical format and
  content hash are byte-identical with the Python package 'vahtian' (PyPI),
  verified by a cross-language golden-hash test in CI.
* No external services are contacted; all functions are local and deterministic.
