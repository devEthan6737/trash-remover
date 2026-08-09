# Trash Remover

Limpiador de basura por terminal para cualquier máquina, escrito en TypeScript.

## Características

- Confirmación obligatoria antes de ejecutar cualquier acción destructiva.
- Selección interactiva del disco a escanear.
- Escaneo recursivo de ficheros filtrando por tamaño mínimo (MB o GB).
- Progreso de escaneo en vivo: ruta del fichero actual, ficheros indexados, pendientes y porcentaje estimado.
- Revisión manual, fichero por fichero, antes de borrar nada:
    - Buscar en internet qué es ese fichero en tu sistema operativo.
    - Marcar el fichero para eliminar.
    - Ignorar y pasar al siguiente.
- Confirmación final con el resumen de lo marcado antes de borrar.
- Resumen de la eliminación: ficheros eliminados y espacio liberado.

## Requisitos

- node.js
- pnpm

## Instalación

```bash
pnpm install
```

## Uso

Modo desarrollo (sin compilar):

```bash
pnpm dev
```

Compilar y ejecutar:

```bash
pnpm build
pnpm start
```

## Flujo de la aplicación

1. La aplicación muestra una advertencia inicial y pide confirmación antes de continuar.
2. Se selecciona el disco a escanear entre los discos accesibles detectados.
3. Se especifica el tamaño mínimo de fichero a incluir (ej: `500MB`, `2GB`).
4. Se escanea el disco mostrando el progreso en tiempo real.
5. Se muestra un resumen con el total de ficheros encontrados y los 10 más grandes.
6. Se revisa cada fichero encontrado individualmente: buscar información, marcar para eliminar o ignorar.
7. Al terminar la revisión, si hay ficheros marcados, se pide confirmación final.
8. Se eliminan los ficheros confirmados y se muestra el espacio liberado.

## Estructura del proyecto

```
src/
├── index.ts               Punto de entrada
├── App.ts                 Orquestación del flujo principal
├── types.ts                Tipos e interfaces compartidos
├── UIManager.ts             Entrada/salida por terminal (chalk + prompts)
├── ConfirmationManager.ts   Advertencias y confirmaciones del usuario
├── DiskScanner.ts           Detección de discos disponibles
├── FileAnalyzer.ts          Escaneo de ficheros y parseo de tamaños
├── FileReviewer.ts          Revisión interactiva fichero por fichero
├── WebSearchLauncher.ts      Búsqueda en el navegador sobre un fichero
└── TrashRemover.ts          Eliminación de ficheros y resumen final
```

## Tecnologías

- [TypeScript](https://www.typescriptlang.org/)
- [chalk](https://github.com/chalk/chalk) — colores y estilos en terminal
- [prompts](https://github.com/terkelg/prompts) — interacción por terminal (confirmaciones, texto, menús)

## Advertencia

Esta aplicación elimina ficheros de forma permanente. Aunque se pide confirmación en varios pasos, usa el escaneo con cautela y revisa bien cada fichero antes de marcarlo para eliminar.
