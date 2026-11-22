# Agente Smith

Aplicación web para convertir un objetivo de trabajo en un proyecto inicial descargable. Puedes elegir una herramienta de línea de comandos, una API local o una biblioteca, y seleccionar los editores o asistentes para los que quieres generar instrucciones.

## Probar en el navegador

Abre [Sr. Smith en GitHub Pages](https://manu-alvarez.github.io/Agent-Sr-Smith/). Para generar un ZIP, elige **Ordenador**, selecciona el tipo de proyecto y los editores, y escribe el nombre y el objetivo. Pulsa **Preparar** y después **Descargar scaffolding**. Al descomprimir el ZIP encontrarás el proyecto bajo `proyectos/<nombre>` y sus instrucciones de arranque.

La generación del paquete funciona sin un modelo conectado. Si activas la redacción con Ollama en la web publicada, el navegador necesita acceso al servidor de Ollama configurado. El proxy de desarrollo se usa al ejecutar la aplicación con Vite.

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

Para comprobar los tipos, ejecuta `npm run typecheck`. El comando `npm run build` también invoca la migración de base de datos. Los scripts disponibles están en [package.json](package.json).
