---
id: copyable-command-must-run
verdict: FAIL
skill: vahtian-copy-editor
rule: The fact pass — copyable commands must actually run
anchor: Copyable commands must actually run.
detector: judgement
source: vahtian-copy-editor/SKILL.md (fact pass); July 2026 Learn audit
caught_by: audit
date: 2026-07-25
---

## Snippet

```
python3 qualivahti.py --model logistic_regression --input interviews.csv
```

## Shipped replacement

The flag checked against the real CLI (`--help` or the argparse source) and
corrected to a value the parser accepts.

## Why

`--model logistic_regression` did not exist, so the reader hit an error at the
payoff step, having trusted the page all the way there. No text-only detector
can know which flags exist: the check is to run the command, or read the
argparse source. Judgement-only, and the most expensive class of failure in the
corpus because it fails the reader at the moment of maximum trust.
