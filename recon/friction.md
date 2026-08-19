# Friction log · recon OpenQuake / Clawpack / OpenEEW · 2026-08-19

- Phase 1 buscó `/openapi.json` en api.openquake.org y dio 404. La superficie útil
  no era una API REST sino un WMTS detrás de un visor Leaflet. El playbook empuja a
  buscar specs REST; para targets geoespaciales conviene probar también
  `WMTSCapabilities.xml` y `?service=WFS&request=GetCapabilities` en Phase 1.
- El endpoint real no aparecía ni en el HTML inicial ni en el JS principal
  (`common.js` solo traía iconos de Leaflet). Salió de
  `performance.getEntriesByType('resource')` después de que el mapa cargara teselas.
  Para mapas, esa es la vía directa; grepear el bundle fue tiempo perdido.
- `agent-browser eval` falla con "Identifier already declared" al reusar un nombre
  entre llamadas dentro de la misma página. Envolver en IIFE lo resuelve; no está
  en el core skill.
- No existe comando `viewport` en esta versión del binario, aunque el `--help`
  general lo lista en una línea de sintaxis. Verificación responsive quedó por
  clases CSS, no por ventana redimensionada.
