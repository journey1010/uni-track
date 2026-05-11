---
name: create-skill
description: Guides the creation of new agent skills. Use when you need to document a new capability or pattern for the agent.
---

# Crear una Habilidad

Esta habilidad define el proceso estándar para crear y organizar nuevas habilidades dentro del directorio `.agents/skills/`.

## Cuándo usar esta habilidad

- Usa esto cuando necesites enseñar al agente una nueva tarea o flujo de trabajo específico.
- Útil para mantener una biblioteca de capacidades modular y fácil de buscar.
- Ayuda a asegurar que todas las habilidades sigan la misma estructura y convenciones.

## Cómo usarla

### 1. Estructura de Carpetas
Crea una carpeta dedicada para la habilidad dentro del directorio `.agents/skills/`. El nombre de la carpeta debe ser descriptivo, en minúsculas y con guiones para los espacios.

```text
.agents/skills/
└─── my-skill/
    └─── SKILL.md
```

### 2. El archivo SKILL.md
Cada habilidad necesita un archivo `SKILL.md` en su raíz con YAML frontmatter en la parte superior:

```markdown
---
name: my-skill
description: Ayuda con una tarea específica. Úsalo cuando necesites hacer X o Y.
---

# Mi Habilidad

Instrucciones detalladas para el agente.

## Cuándo usar esta habilidad

- Usa esto cuando...
- Esto es útil para...

## Cómo usarla

Guía paso a paso, convenciones y patrones que el agente debe seguir.
```

### 3. Campos del Frontmatter
- **name**: (Opcional) Un identificador único para la habilidad (minúsculas, guiones). Por defecto es el nombre de la carpeta si no se proporciona.
- **description**: (Requerido) Una descripción clara de lo que hace la habilidad y cuándo usarla. Escríbela en tercera persona e incluye palabras clave.

### 4. Estructura Completa (Opcional)
Puedes incluir recursos adicionales:
- `scripts/`: Scripts de ayuda.
- `examples/`: Implementaciones de referencia.
- `resources/`: Plantillas y otros activos.

### 5. Mejores Prácticas
- **Mantén las habilidades enfocadas**: Cada habilidad debe hacer una cosa bien.
- **Escribe descripciones claras**: Así el agente decide si usar la habilidad.
- **Usa scripts como cajas negras**: Ejecútalos con `--help` primero.
- **Incluye árboles de decisión**: Para habilidades complejas.
