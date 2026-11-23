# Sr. Smith — arquitectura del generador y runtime portable

## Producto

Sr. Smith (Agente Smith) es un estudio de configuración y generación de proyectos/agentes. Su artefacto principal es un ZIP autónomo con árbol, archivos, código, instrucciones, perfiles y adaptadores disponibles. No es un servicio de agentes alojados.

## Flujo de generación

1. El usuario elige destino, framework, IDE, perfil, nombre y objetivo.
2. El motor DSH ejecuta su planificación determinista de referencia y produce un informe trazable.
3. Si hay un proveedor/modelo configurado, el generador LLM recibe el objetivo y el inventario de archivos base.
4. El modelo devuelve un objeto JSON con rutas relativas y contenidos completos.
5. La aplicación valida rutas, extensiones sensibles y límites de tamaño; los archivos válidos se integran en el proyecto.
6. El empaquetador añade el scaffolding base, el proyecto, el informe de generación, el agente y sus adaptadores.
7. El ZIP se descarga localmente. La generación no ejecuta el código creado ni declara sus pruebas como superadas.

## Proveedores

| Proveedor | Descubrimiento | Conversación/generación |
|---|---|---|
| Ollama | `/api/tags` | `/api/chat` |
| OpenAI | `/v1/models` | `/v1/chat/completions` |
| OpenRouter | `/api/v1/models` | `/api/v1/chat/completions` |
| NVIDIA NIM | `/v1/models` | `/v1/chat/completions` |
| Anthropic | `/v1/models` | `/v1/messages` |
| Google Gemini | `/v1beta/models` | `generateContent` |
| OpenAI-compatible | `/models` | `/chat/completions` |

Las claves de proveedores alojados se envían a un proxy same-origin (Nitro en producción y middleware Vite en desarrollo). No se guardan en localStorage ni se incluyen en el ZIP. Los endpoints compatibles personalizados se consultan directamente desde el navegador; pueden requerir CORS habilitado por el proveedor.

Ollama usa `http://localhost:11434` por defecto. Para acceder a un equipo remoto, el usuario configura su dirección Tailscale, por ejemplo `http://100.100.2.10:11434`. No se codifica una dirección privada del autor en el producto.

## Contenido del ZIP

- Scaffolding base del motor DSH y documentación.
- Proyecto generado por el usuario con plantillas y archivos devueltos por el LLM.
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, reglas Cursor y configuración OpenCode.
- Ficha `agent.json`, política, roles, skills, estrategias, capacidades y manifiestos de herramientas.
- Runtime conversacional Node.js y configuración de proveedor mediante `.env.example`.
- Servidor MCP local, configuración MCP y guía de conexión.
- Informes de misión y generación con el proveedor/modelo y el número de archivos añadidos.

## Capacidades realmente ejecutables

### Conversación LLM
Runtime Node.js portable con historial en memoria del proceso. Soporta Ollama, OpenAI-compatible, OpenAI, OpenRouter, NVIDIA, Anthropic y Gemini. Las claves se leen desde `.env`.

### MCP local
Servidor stdio independiente, sin SDK externo, con herramientas seleccionables:
- `workspace.list`: lista archivos del workspace.
- `workspace.read`: lee archivos de texto.
- `workspace.write`: escribe archivos con reemplazo atómico.
- `knowledge.ingest`: ingesta explícita de hasta 50 rutas de texto por operación; crea fragmentos de unos 1400 caracteres con solapamiento, hashes de contenido y embeddings por lotes.
- `knowledge.search`: recuperación vectorial con refuerzo léxico y fallback léxico cuando el endpoint de embeddings no está disponible.
- `knowledge.stats`: métricas de documentos, fragmentos y cobertura vectorial.
- `memory.remember` / `memory.recall`: memoria persistente del proyecto en `.sr-smith/memory.json`.

Las operaciones se restringen al workspace, excluyen `.env`, `.git`, `node_modules` y carpetas privadas, rechazan rutas fuera del workspace y no siguen enlaces simbólicos. El índice se persiste en `.sr-smith/knowledge.json`.

Embeddings configurables: Ollama (`/api/embed`, modelo predeterminado `nomic-embed-text`) u OpenAI-compatible (`/v1/embeddings`). Variables: `SMITH_EMBEDDING_PROVIDER`, `SMITH_EMBEDDING_MODEL`, `SMITH_EMBEDDING_BASE_URL`. No se descargan modelos automáticamente; la ingesta es explícita y el índice puede funcionar en modo léxico sin embeddings.

### Orquestación multirol
El runtime exportado incorpora `/orchestrate <meta>`: un planificador LLM produce entre 2 y 5 tareas; roles analyst, researcher, architect, implementer y reviewer reciben subtareas independientes; se ejecutan con concurrencia configurable y limitada (1–4, por defecto 3); el coordinador sintetiza los resultados y guarda el último informe en `.sr-smith/orchestrations/latest.json`. Cada delegación recupera contexto del índice local cuando existe.

Este mecanismo es una orquestación LLM multirol acotada, no un sistema de agentes recursivos. Los subagentes no reciben un bucle independiente de llamadas a herramientas ni pueden delegar a otros agentes. Las herramientas MCP siguen disponibles para el IDE que conecte el servidor, pero el comando `/orchestrate` no ejecuta shell ni navegador por su cuenta.

### Capacidades aún no implementadas como adaptadores ejecutables
Shell se ofrece como herramienta MCP opcional: requiere SMITH_ALLOW_SHELL=true, ejecuta sin shell con lista de programas permitidos, límite de tiempo y salida acotada; bloquea push/reset/clean/rebase y ejecución inline. No es un sandbox del sistema operativo y hereda los permisos del usuario; solo debe activarse en workspaces de confianza. Git avanzado, navegador y MCP remoto siguen pendientes.

## Límites y seguridad de generación

- Máximo 24 archivos de salida del LLM.
- Máximo 48 KB por archivo y 240 KB acumulados.
- Se rechazan rutas absolutas, traversal, rutas con separadores inversos y archivos de credenciales, manifiestos de dependencias y configuración base reservada.
- Las claves API nunca se incorporan al proyecto generado.
- El código generado no se ejecuta durante la generación.
- El informe de ZIP deja constancia de que no se han ejecutado pruebas del proyecto generado.

## Validación pendiente de cierre

La validación de cierre debe cubrir typecheck, lint, pruebas críticas, smoke de MCP/RAG y build. La disponibilidad real de embeddings requiere que el usuario haya instalado/configurado un modelo compatible; CI valida la ruta léxica sin depender de un proveedor externo.
