# Cambiar una regla

1. Edita la regla en `src/governance/policies/index.ts`.
2. Replica id, operación, efecto, modos y motivo en `config/policies/default.json`. El orden puede diferir; el test compara la lista completa.
3. Si el efecto o el modo cambian el texto de `docs/ai/security.md`, actualiza esa tabla. `check-context.py` exige que cada id de la política aparezca ahí.
4. `npm test` y `python3 scripts/ai/check-context.py`.

No borres `deny-secrets` ni `deny-external-delete` para hacer pasar un objetivo. Si un caso de eval choca con la regla, cambia el caso o rechaza el objetivo, no la regla.
