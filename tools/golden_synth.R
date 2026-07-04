#!/usr/bin/env Rscript
# Golden reference for the SynthVahti JS pooling core.
# Pools the >=1% OPA column of fixtures/golden.csv with metafor (DL, logit) and
# writes fixtures/golden.json. CI runs this and tools/synth-test.mjs asserts the
# JS core reproduces these numbers within 1e-4. Provenance is recorded in-file.
suppressMessages(library(metafor)); suppressMessages(library(jsonlite))
here <- dirname(sub("^--file=", "", grep("^--file=", commandArgs(FALSE), value = TRUE)))
root <- normalizePath(file.path(here, ".."))
d <- read.csv(file.path(root, "synthvahti/fixtures/golden.csv"), stringsAsFactors = FALSE)
d <- subset(d, cutoff == ">=1%")

pool <- function(events, n) {
  es <- escalc(measure = "PLO", xi = events, ni = n, add = 1/2, to = "only0")
  m  <- rma(yi, vi, data = es, method = "DL")
  ci <- predict(m, transf = transf.ilogit)
  list(k = m$k, pooled = ci$pred, lo = ci$ci.lb, hi = ci$ci.ub,
       tau2 = m$tau2, I2 = m$I2, Q = m$QE)
}
opa <- pool(d$tp + d$tn, d$tp + d$fp + d$fn + d$tn)   # events===n rows get the 0.5 correction
out <- list(
  provenance = list(generated_by = "tools/golden_synth.R",
                    R = R.version.string,
                    metafor = as.character(packageVersion("metafor")),
                    fixture = "synthvahti/fixtures/golden.csv", cutoff = ">=1%"),
  opa = opa)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 12),
           file.path(root, "synthvahti/fixtures/golden.json"))
cat("wrote synthvahti/fixtures/golden.json\n")
