# Probe de un proveedor

Hoy no hay probe. Ollama, DeepSeek, Anthropic, Google y `openai-compatible` están en `verified: false`. El compatible tiene `baseUrl` vacío.

Cuando exista el probe, el cambio tiene que traer las tres cosas a la vez:

- El código que hace la llamada y distingue fallo de éxito.
- `verified: true` solo después de esa llamada, en `config/models/providers.json`.
- Una frase en `docs/ai/architecture.md` que diga qué se comprobó. No basta con "responde".

Hasta entonces, poner `verified: true` a mano rompe `scripts/ai/validate-config.py`. No añadas `SMITH_*_API_KEY` al lector de entorno en el mismo commit en el que solo documentas la variable.
