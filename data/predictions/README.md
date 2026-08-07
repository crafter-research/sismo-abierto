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

- `panorama-reports.json` reúne seis Reels semanales publicados entre el 29 de junio y
  el 3 de agosto de 2026, con 44 predicciones evaluables por separado.
- Los Reels `DaLGrbGpoQm`, `Dac4KZ8J7-J`, `DauJiOZppMr` y `DbSLv__pBz9` se incorporaron
  retrospectivamente el 2026-08-02 a partir de transcripciones hechas con `trx` y una
  revisión del texto visible.
- El panorama del 20 de julio conserva las ocho afirmaciones ya congeladas en
  `predictions.csv`. No se duplica su fuente de verdad para la auditoría.
- El panorama del 3 de agosto se registró el mismo día de su publicación y antes del
  cierre de todas sus ventanas. El Reel lo titula del 3 al 11 de agosto, pero dos puntos
  declaran nueve días a partir del 3; el registro conserva esos deadlines hasta el 12.
- Cada registro incluye la URL y la hora pública del Reel en Lima. Esa marca temporal
  documenta cuándo apareció la fuente, pero no elimina las limitaciones del backfill.

## Informes históricos incorporados retrospectivamente

- `historical-reports.json` transcribe los informes 244, 245, 246, 249 al 254 y 256 desde
  capturas aportadas por el usuario el 2026-08-02 y el 2026-08-07.
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
- `claimed-validations.json` conserva publicaciones posteriores que declaran una proyección
  como cumplida y las contrasta con la afirmación congelada y fuentes oficiales.
