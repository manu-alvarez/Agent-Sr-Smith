# Sr. Smith — Product and architecture baseline

## Product definition

Sr. Smith (also known as Agente Smith) is a provider-neutral agent and project scaffolding studio. Its primary deliverable is a portable ZIP containing a complete project, not a hosted agent session.

## Architectural boundaries

- Studio: user experience, project configuration and provider settings.
- Core contracts: versioned AgentSpec, ProjectSpec, Provider and ExportManifest schemas.
- AI Gateway: provider discovery, model metadata, chat, streaming and embeddings.
- Scaffolding Engine: deterministic composition, template resolution and file generation.
- Artifact Factory: validation, manifest generation and ZIP packaging.
- Optional integrations: tools, MCP, knowledge/RAG, persistent memory and execution adapters.

## Capability truthfulness

Every exported capability must have one of these states: `implemented`, `configurable`, or `declaration-only`. A tool manifest is not an implementation. An agent prompt is not an execution runtime.

## Provider defaults

Use `http://localhost:11434` as the portable Ollama default. User-specific Tailscale addresses and API credentials must never be embedded in generated artifacts. Credentials are environment-only and excluded from ZIP files.

## Runtime milestone

The portable runtime currently supports conversational inference through Ollama's `/api/chat` and OpenAI-compatible `/chat/completions`. It does not claim shell, filesystem, browser, MCP, RAG or persistent-memory execution.

## Naming

Product: Sr. Smith. Alternative product name: Agente Smith. Technical package identifier: `sr-smith`.
