#!/usr/bin/env python3
"""Valida esquemas, casos de eval, proveedores y referencias de ai/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REQUIRED_CASE = {"id", "objective", "profileId", "mode", "expect"}
EXPECT_KEYS = {"status", "sensitive", "mode", "sandboxOnly", "secretsRedacted", "referenceLimitation"}
PROFILES = {"research", "engineering", "autonomous", "security", "full", "headless", "product", "data", "ops"}
MODES = {"strict-local", "local-runtime"}


def load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    problems: list[str] = []
    for path in list((ROOT / "config").rglob("*.json")) + list((ROOT / "schemas").rglob("*.json")) + list((ROOT / "ai").rglob("*.json")):
        try:
            load(path)
        except json.JSONDecodeError as error:
            problems.append(f"JSON inválido {path.relative_to(ROOT)}: {error}")

    catalog = load(ROOT / "ai/schemas/catalog.json")
    schemas = catalog["schemas"] if isinstance(catalog, dict) else []
    if len(schemas) < 20:
        problems.append("el catálogo de esquemas tiene menos de 20 entradas")
    for entry in schemas:
        path = ROOT / entry["path"]
        if not path.exists():
            problems.append(f"esquema ausente {entry['path']}")
            continue
        data = load(path)
        if isinstance(data, dict) and data.get("required") != entry["required"]:
            problems.append(f"required diverge en {entry['path']}")
        if isinstance(data, dict) and not data.get("examples"):
            problems.append(f"sin ejemplo {entry['path']}")

    providers = load(ROOT / "ai/providers/registry.json")
    if isinstance(providers, dict):
        for name, item in providers.items():
            if name in {"schemaVersion"} or not isinstance(item, dict):
                continue
            if item.get("verified") is True and name != "reference":
                problems.append(f"{name} está verified sin ser reference")
        if providers.get("reference", {}).get("verified") is not True:
            problems.append("reference tiene que estar verified")
        compatible = providers.get("openai-compatible", {})
        if compatible.get("baseUrl") not in ("", None):
            problems.append("openai-compatible no debe traer una URL de ejemplo")

    cases = {}
    for path in sorted((ROOT / "ai/evals/cases").glob("*.json")):
        case = load(path)
        if not isinstance(case, dict) or not REQUIRED_CASE <= set(case):
            problems.append(f"caso incompleto {path.name}")
            continue
        expect = case["expect"]
        if set(expect) != EXPECT_KEYS:
            problems.append(f"expect incompleto {path.name}")
        if case["profileId"] not in PROFILES or case["mode"] not in MODES:
            problems.append(f"perfil o modo desconocido {path.name}")
        if case["id"] != path.stem:
            problems.append(f"id distinto del archivo {path.name}")
        cases[case["id"]] = case

    dataset_ids = []
    for line in (ROOT / "ai/evals/datasets/reference-runtime.jsonl").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        item = json.loads(line)
        dataset_ids.append(item["id"])
        if cases.get(item["id"]) != item:
            problems.append(f"dataset y caso no coinciden: {item['id']}")
    if dataset_ids != sorted(cases):
        problems.append("el dataset no tiene los mismos ids que ai/evals/cases")

    specs = load(ROOT / "ai/agents/specs.json")
    profiles = load(ROOT / "ai/agents/profiles.json")
    if not isinstance(specs, list) or len(specs) != 19:
        problems.append("se esperaban 19 specs de agente")
    if not isinstance(profiles, list) or {item["id"] for item in profiles} != PROFILES:
        problems.append("los perfiles no están en ai/agents/profiles.json")

    if problems:
        print("\n".join(problems))
        return 1
    print(f"config válida: {len(cases)} casos, {len(schemas)} esquemas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
