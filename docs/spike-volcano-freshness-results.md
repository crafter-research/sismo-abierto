# Resultado del spike: frescura y boletines volcánicos

Corrido el 2026-07-20/21. Evidencia en `docs/evidence/live-observations/`.

## Preguntas y respuestas

1. **¿Campo o endpoint con fecha de actualización autoritativa?** NO EXISTE en la superficie
   pública. `DescribeFeatureType` de `CTS_alertavolcan:Actividad_volcanica` expone solo
   `geom, objectid, longitud, latitud, nivel, alerta, region, resena, volcan, name`
   (`volcano-describe.json`). Ningún campo de fecha.
2. **¿Capas relacionadas en el GeoServer?** El namespace `CTS_alertavolcan` publica una única
   capa (`volcano-capabilities.xml`). No hay capa de historial ni de boletines.
3. **¿Identificador estable para vincular WFS con boletines CENVUL/REGEN?** No hay. REGEN
   permite búsqueda por texto (`query=Sabancaya`), pero eso es una heurística de metadatos, no
   una asociación determinista registro→boletín.
4. **¿Fuente de verdad del nivel vigente?** Desconocida desde afuera. Requiere la pregunta al
   responsable técnico (pregunta congelada en `volcanes-abiertos.md`): "¿Cuál es la fuente
   oficial de verdad para el nivel actual de cada volcán y su fecha de actualización?"

## Decisión

- VA1 y VA2 operan con `PUBLISHED_STATE` + `FRESHNESS_UNKNOWN` visibles.
- **VA3 queda BLOQUEADO**: no se muestra cronología de boletines. La ficha muestra un estado
  honesto (`bulletin-timeline-blocked`) con enlace a la búsqueda manual en REGEN, sin fabricar
  serie histórica.
- Desbloqueo de VA3: respuesta del IGP sobre fuente de verdad + fecha, o publicación de un
  endpoint con timestamps/identificadores de boletín por volcán.
