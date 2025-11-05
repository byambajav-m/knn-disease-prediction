from typing import Any

def normalize_symptom(s: Any) -> str:
    if not isinstance(s, str):
        return ""
    s = s.strip().lower().replace("_", " ")
    s = " ".join(s.split())
    return s
