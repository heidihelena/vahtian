#!/usr/bin/env node
// Emit the generated synthesis.R to stdout, so CI can run it end-to-end against
// the golden fixture (proving the R codegen stays valid, per founder decision Q3).
import { buildRScript } from "../synthvahti/synth.mjs";
process.stdout.write(buildRScript());
