# packages/ — staged flagship packages

These are **staged** here for versioning and review; the destination is a
dedicated repo per package (`heidihelena/vahtian-py`, `heidihelena/vahtian-r`).
They are not part of the static site and are not built by the site's CI.

- **vahtian-py/** — the Python flagship: reproducible, provenance-first evidence
  tooling (`freeze` → content-hashed corpus, `verify`, hash-chained audit). The
  same core + on-disk format will exist in the R package `vahtian`, so artifacts
  interoperate. Move to `heidihelena/vahtian-py` and `pip install vahtian` when ready.
