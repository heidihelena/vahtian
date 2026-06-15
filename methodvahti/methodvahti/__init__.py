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
    qualitative_heterogeneity_score,
    default_severity_catalogue,
    OutcomeSeverity,
    HeterogeneityResult,
)

__version__ = "0.3.0"
__all__ = [
    "qualitative_heterogeneity_score",
    "default_severity_catalogue",
    "OutcomeSeverity",
    "HeterogeneityResult",
]
