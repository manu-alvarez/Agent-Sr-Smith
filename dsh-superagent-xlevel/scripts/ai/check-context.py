#!/usr/bin/env python3
"""Falla si las proyecciones, los adaptadores o la tabla de reglas se quedan viejos."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from project import BEGIN, END, ROOT, diff, generated


def shared_region(text: str) -> str:
    start = text.index(BEGIN)
    stop = text.index(END) + len(END)
    return text[start:stop]


def main() -> int:
    problems = diff(generated())
    claude = (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
    gemini = (ROOT / "GEMINI.md").read_text(encoding="utf-8")
    if shared_region(claude) != shared_region(gemini):
        problems.append("CLAUDE.md y GEMINI.md no comparten el mismo bloque")
    security = (ROOT / "docs/ai/security.md").read_text(encoding="utf-8")
    policy = json.loads((ROOT / "config/policies/default.json").read_text(encoding="utf-8"))
    for rule in policy["rules"]:
        if rule["id"] not in security:
            problems.append(f"docs/ai/security.md no cita {rule['id']}")
    banned = ("ignore previous instructions", "do anything now", "disable the policy")
    for path in (ROOT / "prompts").rglob("*.md"):
        text = path.read_text(encoding="utf-8").lower()
        for phrase in banned:
            if phrase in text:
                problems.append(f"{path.relative_to(ROOT)} contiene {phrase}")
    if problems:
        print("\n".join(problems))
        return 1
    print("contexto al día")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
