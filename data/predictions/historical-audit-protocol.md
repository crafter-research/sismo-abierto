# Protocolo del backfill histórico

Fecha de incorporación: 2026-08-02.

Este protocolo se aplica retrospectivamente a los informes 244, 245, 246 y 249 al 254
transcritos desde capturas aportadas por el usuario. No fue congelado antes de los resultados y
no debe presentarse como una prueba preinscrita.

## Unidad de evaluación

Cada punto de cada informe se evalúa por separado. Para contar una coincidencia literal deben
coincidir simultáneamente la hora de origen del evento, el rango de magnitud publicado y una
geografía con límites explícitos.

Los porcentajes declarados en las capturas se conservan como parte del texto fuente. Este
backfill no presupone que sean probabilidades calibradas ni los usa para decidir el veredicto.

## Ventanas

- La ventana comienza a las 00:00:00 hora de Lima en la fecha declarada.
- Termina a las 23:59:59 hora de Lima después del plazo máximo declarado.
- El informe 244 dice "70 @ 80 días". Se usa 80 días, el extremo que maximiza la oportunidad
  de coincidencia.
- Una ventana abierta permanece `PENDING` y no se buscan candidatos hasta su cierre.

## Geografía

- Países y territorios explícitos se aproximan con las regiones documentadas en código.
- Frases direccionales como "norte de Perú" o corredores como "Vancouver hasta Baja
  California" no reciben una frontera inventada.
- Si una parte relevante del destino queda sin límites verificables y no hay una coincidencia
  estricta en la parte explícita, el resultado es `AMBIGUOUS_GEOGRAPHY`, no `NO_MATCH`.
- Los eventos se deduplican cuando dos regiones aproximadas se superponen.

## Fuentes e interpretación

- USGS FDSN Event API se usa para eventos globales y para estimar la tasa base.
- La tasa base usa los 365 días anteriores, el mismo rango de magnitud y las geografías
  explícitas.
- Una coincidencia literal se presenta junto a esa tasa base y no establece capacidad
  predictiva.
- Un mismo terremoto puede coincidir con varios informes superpuestos. Eso no constituye
  evidencia independiente repetida.
