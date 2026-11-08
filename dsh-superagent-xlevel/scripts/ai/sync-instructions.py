#!/usr/bin/env python3
"""Regenera CLAUDE.md, GEMINI.md y las proyecciones de ai/ desde el canónico."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from project import ROOT, diff, generated


def main() -> int:
    files = generated()
    if "--check" in sys.argv:
        problems = diff(files)
        if problems:
            print("\n".join(problems))
            return 1
        print(f"proyecciones al día: {len(files)}")
        return 0
    for rel, content in files.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    print(f"escritos {len(files)} archivos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
