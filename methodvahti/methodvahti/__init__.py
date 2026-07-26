"""
MethodVahti — qualitative research decision support
Part of the EpiNet toolkit · Vahtian · Apache-2.0 licence

from methodvahti.heterogeneity import (
    qualitative_heterogeneity_score,
    default_severity_catalogue,
    OutcomeSeverity,
)
"""
from .heterogeneity import (
    sampling_heterogeneity_score,
    qualitative_heterogeneity_score,   # deprecated alias — removal at next MAJOR
    default_severity_catalogue,
    OutcomeSeverity,
    HeterogeneityResult,
    SamplingHeterogeneityResult,
)
from .defensibility import (
    classify_defensibility,
    render_report,
    DEFENSIBILITY_LABELS,
    NOT_ASSESSABLE,
    Flag,
    Escalation,
    Override,
)

__version__ = "0.3.0"
__all__ = [
    # sampling heterogeneity (numeric → optimise_n; Ch. 1.2.5 D1)
    "sampling_heterogeneity_score",
    "SamplingHeterogeneityResult",
    "qualitative_heterogeneity_score",  # deprecated
    "default_severity_catalogue",
    "OutcomeSeverity",
    "HeterogeneityResult",
    # defensibility (ordinal classification → report; Ch. 1.2.4/1.2.5)
    "classify_defensibility",
    "render_report",
    "DEFENSIBILITY_LABELS",
    "NOT_ASSESSABLE",
    "Flag",
    "Escalation",
    "Override",
]
