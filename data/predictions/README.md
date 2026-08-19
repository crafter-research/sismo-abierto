# Predicciones congeladas

- `predictions.csv`: las ocho proyecciones del Reel de Instagram DbAK4jKpyxP (cuenta
  sismos.en.peru), extraídas y congeladas el 2026-07-20 ANTES de conocer resultados.
  Este archivo no se modifica; cualquier cambio queda registrado en git.
- `audit-protocol.md`: protocolo de evaluación congelado antes de los outcomes
  (congelado 2026-07-20, previo a los resultados).
- Ventanas: inician 2026-07-20 00:00:00 hora de Lima. Todos los estados permanecen
  `PENDING` hasta que cada `deadline_end_lima` termine.
- Este registro evalúa afirmaciones, no personas. Una coincidencia estricta no equivale a
  evidencia de capacidad predictiva y siempre se presenta junto a su tasa base.

## Panoramas semanales

- `panorama-reports.json` reúne ocho Reels semanales publicados entre el 29 de junio y
  el 17 de agosto de 2026, con 58 predicciones evaluables por separado.
- Los Reels `DaLGrbGpoQm`, `Dac4KZ8J7-J`, `DauJiOZppMr` y `DbSLv__pBz9` se incorporaron
  retrospectivamente el 2026-08-02 a partir de transcripciones hechas con `trx` y una
  revisión del texto visible.
- El panorama del 20 de julio conserva las ocho afirmaciones ya congeladas en
  `predictions.csv`. No se duplica su fuente de verdad para la auditoría.
- El panorama del 3 de agosto se registró el mismo día de su publicación y antes del
  cierre de todas sus ventanas. El Reel lo titula del 3 al 11 de agosto, pero dos puntos
  declaran nueve días a partir del 3; el registro conserva esos deadlines hasta el 12.
- Los panoramas del 10 y del 17 de agosto se incorporaron el 2026-08-19 a partir de
  transcripciones hechas con `trx` (whisper large-v3-turbo) sobre los Reels `Db2Qi79p2NE`
  y `DcJJBJvpISX`. El del 17 de agosto se registró antes del cierre de todas sus ventanas.
- Cada registro incluye la URL y la hora pública del Reel en Lima. Esa marca temporal
  documenta cuándo apareció la fuente, pero no elimina las limitaciones del backfill.

## Informes históricos incorporados retrospectivamente

- `historical-reports.json` transcribe los informes 244, 245, 246, 249 al 256 desde
  capturas aportadas por el usuario el 2026-08-02, el 2026-08-07 y el 2026-08-19.
- Este conjunto es un backfill posterior a parte de los resultados. No tiene el mismo valor
  que un registro congelado antes de que cierre cada ventana.
- Cada punto se evalúa por separado. Los porcentajes 40/30/20/10 se conservan como texto
  publicado, pero no se interpretan como probabilidades calibradas.
- El informe 244 publica "70 @ 80 días". La auditoría usa 80 días, el límite más amplio y
  favorable a encontrar una coincidencia.
- Las capturas de 253, 254 y 256 muestran publicaciones del 1 de julio, 8 de julio y 7 de
  agosto de 2026. Sus fechas de inicio declaradas son anteriores: 27 de junio para 253 y
  254, y 31 de julio para 256.
- `historical-audit-protocol.md` documenta las reglas retrospectivas y sus límites.
- El informe 255 se incorporó el 2026-08-19. Declara 80 días a partir del 20/07/2026, así
  que su ventana cierra el 8 de octubre y sus cuatro puntos siguen `PENDING`.

## Validaciones reclamadas

`claimed-validations.json` conserva publicaciones posteriores que declaran una proyección
como cumplida y las contrasta con la afirmación congelada y con fuentes oficiales. El
campo `assessment` registra en qué falla o coincide cada reclamo:

| Valor | Qué significa |
| --- | --- |
| `MATCHES_FROZEN_CLAIM` | Fuentes oficiales confirman el evento y coincide con lo congelado. No establece capacidad predictiva por sí solo. |
| `OUTSIDE_FROZEN_MAGNITUDE` | El evento existe pero su magnitud queda fuera del rango publicado. |
| `OUTSIDE_FROZEN_GEOGRAPHY` | El evento existe pero su epicentro cae fuera del destino publicado. |
| `SOURCE_DISAGREEMENT_ON_MAGNITUDE` | IGP y USGS no coinciden y el rango publicado queda dentro con una fuente y fuera con la otra. |
| `UNVERIFIABLE_IN_OFFICIAL_SOURCES` | El evento no aparece en los catálogos oficiales consultados para esa fecha, magnitud y área. |

Cada reclamo conserva además `claimedMagnitude` y `claimedMagnitudeScale`: la magnitud y
la escala tal como las publica la cuenta, junto a las magnitudes de las fuentes oficiales.
Se guardan por separado porque a menudo no coinciden, y esa diferencia solo es visible si
ambos números quedan registrados. La escala importa: varias publicaciones rotulan "escala
de Richter" o "magnitud de onda de cuerpo" eventos que los catálogos reportan en magnitud
de momento, que no son la misma medida.

Un reclamo no altera el veredicto del protocolo congelado. Se registra aparte, con la
consulta que lo comprueba, para que cualquiera pueda repetirla.

### Precisión por dimensión

`assessment` es una etiqueta única y por eso oculta los aciertos parciales: un reclamo
puede acertar la magnitud y fallar el destino, y una sola etiqueta no lo muestra. Cada
reclamo se informa además en tres dimensiones separadas, sin combinarlas en un puntaje.

- **Magnitud**: distancia al borde más cercano del rango publicado, 0 si cae dentro. Se
  mide contra la fuente principal que fija el protocolo: IGP/CENSIS para epicentros en
  el Perú, USGS para el resto. Con una sola fuente no hay margen para elegir la que
  convenga.
- **Geografía**: se reutiliza la clasificación punto-en-polígono de la auditoría. Un
  destino sin límites definidos queda `sin resolver`, no `falla`: el protocolo no le
  inventa una frontera y por lo tanto tampoco puede medir una distancia.
- **Plazo**: días fuera de la ventana publicada, 0 si el evento cae dentro.

No se publica un puntaje único ponderado porque no existe una ponderación justificable
entre las tres. Se registra también cuántos días antes del cierre de la ventana se
publicó el reclamo: un evento dentro del plazo cuenta igual, pero la ventana todavía
podía cerrarse sin más coincidencias.
