#!/usr/bin/env python3
"""Informe de revisión. Ejecuta las comprobaciones deterministas y no inventa el veredicto."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def run(script: str) -> tuple[int, str]:
    result = subprocess.run([sys.executable, str(ROOT / script)], cwd=ROOT, capture_output=True, text=True)
    output = (result.stdout + result.stderr).strip()
    return result.returncode, output


def main() -> int:
    checks = [
        ("validate", "scripts/ai/validate-config.py"),
        ("context", "scripts/ai/check-context.py"),
    ]
    failed = False
    print("# Revisión Sr.Smith")
    print()
    for name, script in checks:
        code, output = run(script)
        status = "pass" if code == 0 else "fail"
        failed = failed or code != 0
        print(f"## {name}: {status}")
        print()
        print(output or "(sin salida)")
        print()
    print("## npm test")
    print()
    print("No lo ejecuta este script. Lánzalo aparte. Un pass aquí no cubre el runtime.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
