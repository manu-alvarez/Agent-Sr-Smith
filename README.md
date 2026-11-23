# Agente Smith

Aplicación web para convertir un objetivo de trabajo en un proyecto inicial descargable. Puedes elegir una herramienta de línea de comandos, una API local o una biblioteca, y seleccionar los editores o asistentes para los que quieres generar instrucciones.

## Probar en el navegador

Abre [Sr. Smith en GitHub Pages](https://manu-alvarez.github.io/Agent-Sr-Smith/). Para generar un ZIP, elige **Ordenador**, selecciona el tipo de proyecto y los editores, y escribe el nombre y el objetivo. Pulsa **Preparar** y después **Descargar scaffolding**. Al descomprimir el ZIP encontrarás el proyecto bajo `proyectos/<nombre>` y sus instrucciones de arranque.

La generación determinista de un ZIP funciona sin conexión a un LLM. La edición avanzada permite seleccionar proveedor y modelo, completar archivos con generación LLM y exportar un runtime Node.js portable con MCP local, ingesta de conocimiento, búsqueda RAG con fallback léxico y orquestación multirol. Estas capacidades se verifican con pruebas sobre el ZIP y sus componentes; no se afirma que el código escrito por un LLM haya sido ejecutado o validado automáticamente.

**Limitaciones de GitHub Pages:** es un alojamiento **estático**. No ejecuta las rutas de servidor `/api/ai` ni el proxy de Vite `/ollama-proxy`. Para llamadas a proveedores cloud cuya API no permita CORS, utiliza el servidor local (`npm run dev`) o un despliegue backend explícito; nunca pegues una API key en una Page pública si no estás seguro del destino de la petición. Para Ollama, el navegador debe poder acceder al endpoint configurado y su política CORS debe permitir el origen. La integración MCP y los embeddings se ejecutan **en el paquete descargado**, no en los servidores de GitHub Pages.

## Ejecutar la interfaz

Desde la raíz, con Node.js y npm instalados:

```sh
npm ci
npm run dev
```

Abre `http://localhost:8080`. Define el objetivo, elige el tipo de proyecto y descarga el ZIP. El proyecto generado incluye sus propias instrucciones de uso.

## Dónde está cada pieza

- [Plantillas de proyecto](src/lib/project-starter.ts) define los tipos de salida y los archivos de configuración para cada editor.
- [Generador de paquetes](src/lib/mission-package.ts) combina la plantilla base con los archivos de la misión.
- [DSH Superagent Xlevel](dsh-superagent-xlevel/README.md) documenta el motor incluido en el repositorio.
- [Generación y runtime portable](docs/architecture/PORTABLE-AGENT-RUNTIME.md) describe contratos, proveedores, MCP, RAG, memoria, orquestación y límites actuales.
- [Pruebas de integración del agente](src/lib/scaffolding/portable-agent.test.ts) cubren el MCP real y la recuperación de conocimiento sin proveedor externo.

Para comprobar los tipos, ejecuta `npm run typecheck`. El comando `npm run build` también invoca la migración de base de datos. Los scripts disponibles están en [package.json](package.json).

## Repositorio canónico

**Este es el repositorio único de desarrollo y publicación de Agente Smith.** El proyecto previamente mantenido en `Sr.Smith` se consolida aquí; las contribuciones futuras y GitHub Pages se gestionan desde `Agent-Sr-Smith`. Se preservan los componentes portables y el motor del antiguo repositorio, sin trasladar secretos ni configuraciones personales.
