---
type: evaluation-protocol
created: 2026-07-20
status: frozen-before-outcomes
timezone: America/Lima
---

# Protocolo de auditoría de predicciones sísmicas

## Objetivo

Evaluar las ocho proyecciones del Reel sin redefinir después qué constituye un acierto. Este análisis verifica esta tanda de afirmaciones, no valida ni refuta por sí solo una teoría general.

## Fuentes

1. IGP/CENSIS como fuente principal para epicentros ubicados en Perú.
2. USGS FDSN Event API para el catálogo global y contraste.
3. Si las fuentes discrepan en magnitud, ubicación o tiempo, conservar ambos valores y marcar el caso como `SOURCE_DISAGREEMENT`.

## Ventanas

- Inicio común: 20 de julio de 2026, 00:00:00, hora de Lima.
- Final: `deadline_end_lima` congelado en `predictions.csv`.
- Se usa la hora de origen del sismo, no la hora de publicación del reporte.

## Criterios por evento

Un evento es candidato solamente si cumple simultáneamente:

1. Su hora de origen cae dentro de la ventana.
2. Su magnitud cae dentro del intervalo publicado, incluyendo ambos extremos.
3. Su epicentro está dentro de uno de los destinos publicados.

## Geografía

- Para países, departamentos y regiones administrativas se usan sus límites geográficos reconocidos.
- Expresiones sin límites definidos, como “Perú central”, “norte de Chile”, “islas aledañas” o “zona limítrofe”, no reciben una frontera inventada.
- Una coincidencia que dependa únicamente de una zona vaga se marca `AMBIGUOUS_GEOGRAPHY`, no acierto estricto.
- Cada posible destino se evalúa por separado. La combinación posterior de varios destinos se reporta también para mostrar cuánto espacio cubría la predicción.

## Resultados permitidos

- `STRICT_HIT`: coincide tiempo, magnitud y una geografía inequívoca.
- `NO_MATCH`: no existe coincidencia en los destinos con límites inequívocos.
- `AMBIGUOUS_GEOGRAPHY`: solo hay coincidencia usando una descripción territorial vaga.
- `SOURCE_DISAGREEMENT`: las fuentes oficiales no permiten una conclusión única.
- `PENDING`: la ventana todavía no ha terminado.

## Control contra azar

Para cada predicción vencida:

1. Consultar los 365 días anteriores usando la misma geografía y rango de magnitud.
2. Calcular la tasa histórica de eventos por día.
3. Estimar la probabilidad base de al menos una coincidencia durante la ventana.
4. Reportar cantidad de destinos, superficie cubierta cuando pueda calcularse y todos los eventos candidatos.

Un `STRICT_HIT` no implica capacidad predictiva si la probabilidad base era alta. El informe final debe separar coincidencia observada de evidencia estadística.

## Artefactos

- Fuente congelada: `predictions.csv`
- Resultados acumulados: `audit-results.csv`
- Evidencia por ejecución: `audit-log.md`
- Informe final: `final-audit.md`
