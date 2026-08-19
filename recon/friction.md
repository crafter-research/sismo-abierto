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

## Recon INDECI · 2026-08-19

- `datosabiertos.gob.pe/api/3/action/package_search` devuelve **418 con CloudWAF**
  ante curl, y pasa sin problema con agent-browser. El playbook ya dice "headed
  browser para primer contacto"; este es otro caso que lo confirma, y vale nombrar
  el 418 como firma porque no es un código que uno asocie a WAF.
- La búsqueda del portal CKAN devuelve las **facetas de filtro** mezcladas con los
  resultados en el DOM ("emergencia (2) Apply emergencia filter"). Un selector
  genérico de `a` trae basura; hay que filtrar por longitud y descartar
  `/Apply |filter/`. Costó una iteración.
- `agent-browser eval` reusa el contexto de la página entre llamadas, así que
  `const x` en dos llamadas seguidas tira `SyntaxError: Identifier 'x' has already
  been declared`. Reproducido a propósito. Se evita envolviendo en IIFE
  `(() => { ... })()` o no declarando nada. Vale para el core skill.
