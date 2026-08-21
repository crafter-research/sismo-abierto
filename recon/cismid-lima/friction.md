# Friction log — recon CISMID Lima (2026-08-21)

- El grep de operadores de path sobre el PDF crudo devolvio 0 en un PDF que SI
  tiene vectores. Los content streams estan comprimidos con Flate; contar
  operadores con `strings` sobre el archivo original es una medicion invalida.
  La herramienta correcta era `ogrinfo` desde el principio. Perdi dos pasos
  midiendo con el instrumento equivocado y estuve a punto de concluir
  "rasterizado" sobre el PDF de riesgo, que es justamente el que si sirve.

- El playbook no cubre el terreno "documento georreferenciado". Cae entre
  Terrain F (no backend / formato de archivo) y algo nuevo: un PDF de ArcGIS es
  una base de datos geografica disfrazada de imagen. La senal que lo delata es
  `Creator: Esri` en `pdfinfo` mas `NEATLINE` en `gdalinfo`. Vale una entrada
  propia: la pregunta "es imagen o es dato" se responde con `gdalinfo`, no
  mirando el archivo.

- `ogrinfo -so` (summary only) NO lista Feature Count por capa cuando se pide el
  dataset entero, solo los nombres. Hay que iterar capa por capa para contarlas.
  Con 57 capas eso es un loop, no un comando.

- Los bindings de Python de GDAL no vienen con `brew install gdal`. El
  equivalente por CLI (`ogrinfo -al | grep BRUSH`) funciona igual de bien para
  leer estilos y evita instalar nada mas.
