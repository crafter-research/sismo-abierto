# Log de auditoría

Corrida UTC: `2026-08-02T19:54:38.660Z`

## P1 · Coincidencia estricta

- Veredicto del protocolo congelado: `STRICT_HIT`
- Tasa base: 7.4% · Poco esperable según el histórico
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-20T11:51:15Z · M4.3 · CENSIS · Ica (departamento) · igp-censis-catalogo
- 2026-07-25T02:48:11Z · M4 · CENSIS · Lima y Callao (departamentos) · igp-censis-catalogo
- 2026-07-22T12:25:57Z · M4.1 · CENSIS · Lima y Callao (departamentos) · igp-censis-catalogo

### Evidencia

- [Consulta USGS para Ica (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-15.7&maxlatitude=-12.9&minlongitude=-76.6&maxlongitude=-74.6): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Ica (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta USGS para Lima y Callao (departamentos)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-13.6&maxlatitude=-10.2&minlongitude=-78&maxlongitude=-75.4): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Lima y Callao (departamentos)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-15.7&maxlatitude=-12.9&minlongitude=-76.6&maxlongitude=-74.6): 4 eventos históricos en esta geografía y rango; 4 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-13.6&maxlatitude=-10.2&minlongitude=-78&maxlongitude=-75.4): 0 eventos históricos en esta geografía y rango; 4 únicos en el conjunto de destinos

## P2 · Geografía ambigua

- Veredicto del protocolo congelado: `AMBIGUOUS_GEOGRAPHY`
- Tasa base: no disponible · Tasa base no disponible
- Capacidad predictiva: no establecida

### Candidatos

- Ningún evento candidato.

### Evidencia

- Sin evidencia registrada.

## P3 · Geografía ambigua

- Veredicto del protocolo congelado: `AMBIGUOUS_GEOGRAPHY`
- Tasa base: 26.4% · Posibilidad moderada sin predicción
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-26T15:49:41Z · M4.1 · CENSIS · Loreto (departamento) · igp-censis-catalogo

### Evidencia

- [Consulta USGS para Tumbes (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-4.3&maxlatitude=-3.4&minlongitude=-81.1&maxlongitude=-80.1): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Tumbes (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta USGS para Piura (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-6.6&maxlatitude=-4&minlongitude=-81.4&maxlongitude=-79.1): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Piura (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta USGS para Loreto (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-8.7&maxlatitude=-0.03&minlongitude=-77.9&maxlongitude=-69.9): 1 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Loreto (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta USGS para La Libertad (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-8.99&maxlatitude=-6.9&minlongitude=-79.7&maxlongitude=-76.8): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para La Libertad (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta USGS para Áncash (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-28&orderby=time&minmagnitude=3.4&minlatitude=-10.8&maxlatitude=-8&minlongitude=-78.7&maxlongitude=-76.7): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Áncash (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-28&minimaMagnitud=3.4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 32 eventos devueltos en el rango
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-4.3&maxlatitude=-3.4&minlongitude=-81.1&maxlongitude=-80.1): 5 eventos históricos en esta geografía y rango; 16 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-6.6&maxlatitude=-4&minlongitude=-81.4&maxlongitude=-79.1): 5 eventos históricos en esta geografía y rango; 16 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-8.7&maxlatitude=-0.03&minlongitude=-77.9&maxlongitude=-69.9): 8 eventos históricos en esta geografía y rango; 16 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-8.99&maxlatitude=-6.9&minlongitude=-79.7&maxlongitude=-76.8): 0 eventos históricos en esta geografía y rango; 16 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=3.9&maxmagnitude=4.4&minlatitude=-10.8&maxlatitude=-8&minlongitude=-78.7&maxlongitude=-76.7): 0 eventos históricos en esta geografía y rango; 16 únicos en el conjunto de destinos

## P4 · Coincidencia estricta

- Veredicto del protocolo congelado: `STRICT_HIT`
- Tasa base: 99.3% · Muy esperable sin predicción
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-29T13:19:36.661Z · M5.4 · 11 km N of Tsunagi, Japan · Japón (país) · usgs-fdsn
- 2026-07-28T08:08:35.421Z · M5.6 · 16 km NE of Tsunagi, Japan · Japón (país) · usgs-fdsn
- 2026-07-29T15:10:02.995Z · M5.4 · 53 km E of Rapu-Rapu, Philippines · Filipinas (país) · usgs-fdsn
- 2026-07-26T10:57:37.061Z · M5.3 · 25 km NW of Kupang, Indonesia · Indonesia (Java, Bali y Nusa Tenggara) · usgs-fdsn
- 2026-07-23T22:58:36.362Z · M5.8 · 130 km W of Ternate, Indonesia · Indonesia (Maluku) · usgs-fdsn
- 2026-07-30T04:42:12.667Z · M5.4 · 201 km W of Abepura, Indonesia · Indonesia (Papúa occidental) · usgs-fdsn
- 2026-07-24T12:14:28.267Z · M5.4 · 202 km W of Abepura, Indonesia · Indonesia (Papúa occidental) · usgs-fdsn
- 2026-07-24T11:11:34.234Z · M5.3 · 197 km W of Abepura, Indonesia · Indonesia (Papúa occidental) · usgs-fdsn

### Evidencia

- [Consulta USGS para Venezuela (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=0.6&maxlatitude=12.2&minlongitude=-73.4&maxlongitude=-59.8): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para México (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=14.5&maxlatitude=32.7&minlongitude=-118.4&maxlongitude=-86.7): 1 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Panamá (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=7.2&maxlatitude=9.6&minlongitude=-83.05&maxlongitude=-77.2): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Japón (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=24&maxlatitude=45.6&minlongitude=122.9&maxlongitude=146): 8 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Filipinas (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=4.6&maxlatitude=21.1&minlongitude=116.9&maxlongitude=126.6): 9 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Sumatra)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-6.2&maxlatitude=6.2&minlongitude=94.5&maxlongitude=106.5): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Java, Bali y Nusa Tenggara)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-11.5&maxlatitude=-5&minlongitude=105&maxlongitude=125): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Kalimantan)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-4.5&maxlatitude=4.5&minlongitude=108&maxlongitude=119): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Sulawesi)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-6&maxlatitude=2.5&minlongitude=118&maxlongitude=125.5): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Maluku)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-9&maxlatitude=2.5&minlongitude=124&maxlongitude=135): 4 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Papúa occidental)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-01&orderby=time&minmagnitude=4.8&minlatitude=-10&maxlatitude=1.5&minlongitude=130&maxlongitude=141.1): 11 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=0.6&maxlatitude=12.2&minlongitude=-73.4&maxlongitude=-59.8): 2 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=14.5&maxlatitude=32.7&minlongitude=-118.4&maxlongitude=-86.7): 12 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=7.2&maxlatitude=9.6&minlongitude=-83.05&maxlongitude=-77.2): 0 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=24&maxlatitude=45.6&minlongitude=122.9&maxlongitude=146): 63 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=4.6&maxlatitude=21.1&minlongitude=116.9&maxlongitude=126.6): 37 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-6.2&maxlatitude=6.2&minlongitude=94.5&maxlongitude=106.5): 4 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-11.5&maxlatitude=-5&minlongitude=105&maxlongitude=125): 6 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-4.5&maxlatitude=4.5&minlongitude=108&maxlongitude=119): 0 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-6&maxlatitude=2.5&minlongitude=118&maxlongitude=125.5): 8 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-9&maxlatitude=2.5&minlongitude=124&maxlongitude=135): 32 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.3&maxmagnitude=5.9&minlatitude=-10&maxlatitude=1.5&minlongitude=130&maxlongitude=141.1): 8 eventos históricos en esta geografía y rango; 165 únicos en el conjunto de destinos

## P5 · Coincidencia estricta

- Veredicto del protocolo congelado: `STRICT_HIT`
- Tasa base: 37.4% · Posibilidad moderada sin predicción
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-23T02:38:25Z · M4.5 · CENSIS · Arequipa (departamento) · igp-censis-catalogo+usgs-fdsn

### Evidencia

- [Consulta USGS para Arequipa (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-30&orderby=time&minmagnitude=4&minlatitude=-17.3&maxlatitude=-14.6&minlongitude=-75.1&maxlongitude=-70.8): 1 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Arequipa (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-30&minimaMagnitud=4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 15 eventos devueltos en el rango
- [Consulta USGS para Tacna (departamento)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-30&orderby=time&minmagnitude=4&minlatitude=-18.35&maxlatitude=-16.9&minlongitude=-71.2&maxlongitude=-69.5): 1 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta CENSIS para Tacna (departamento)](https://censis.igp.gob.pe/api/ultimo-sismo/descargar-datos?tipoCatalogo=Instrumental&fechaInicio=2026-07-20&fechaFin=2026-07-30&minimaMagnitud=4&maximaMagnitud=9&minimaProfundidad=0&maximaProfundidad=900&latitudNorte=-1.396&latitudSur=-25.701&longitudEste=-65.624&longitudOeste=-87.382): 15 eventos devueltos en el rango
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5.1&minlatitude=-17.3&maxlatitude=-14.6&minlongitude=-75.1&maxlongitude=-70.8): 12 eventos históricos en esta geografía y rango; 19 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5.1&minlatitude=-18.35&maxlatitude=-16.9&minlongitude=-71.2&maxlongitude=-69.5): 7 eventos históricos en esta geografía y rango; 19 únicos en el conjunto de destinos

## P6 · Coincidencia estricta

- Veredicto del protocolo congelado: `STRICT_HIT`
- Tasa base: 97.9% · Muy esperable sin predicción
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-24T16:51:37.514Z · M5.7 · 49 km W of Turangi, New Zealand · Nueva Zelanda (país) · usgs-fdsn
- 2026-07-24T21:37:56.459Z · M6 · 82 km W of Sola, Vanuatu · Vanuatu (país) · usgs-fdsn
- 2026-07-29T15:10:02.995Z · M5.4 · 53 km E of Rapu-Rapu, Philippines · Filipinas (país) · usgs-fdsn
- 2026-07-23T22:58:36.362Z · M5.8 · 130 km W of Ternate, Indonesia · Indonesia (Maluku) · usgs-fdsn
- 2026-07-30T04:42:12.667Z · M5.4 · 201 km W of Abepura, Indonesia · Indonesia (Papúa occidental) · usgs-fdsn
- 2026-07-24T12:14:28.267Z · M5.4 · 202 km W of Abepura, Indonesia · Indonesia (Papúa occidental) · usgs-fdsn
- 2026-07-28T20:27:57.268Z · M5.4 · 211 km SE of Kokopo, Papua New Guinea · Papúa Nueva Guinea (país) · usgs-fdsn

### Evidencia

- [Consulta USGS para Nueva Zelanda (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-47.3&maxlatitude=-34.4&minlongitude=166.4&maxlongitude=178.6): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Vanuatu (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-20.3&maxlatitude=-13.1&minlongitude=166.5&maxlongitude=170.2): 5 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Fiji (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-19.2&maxlatitude=-15.7&minlongitude=176.8&maxlongitude=180): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Tonga (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-22.4&maxlatitude=-15.5&minlongitude=-176.2&maxlongitude=-173.7): 3 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Filipinas (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=4.6&maxlatitude=21.1&minlongitude=116.9&maxlongitude=126.6): 8 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Sumatra)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-6.2&maxlatitude=6.2&minlongitude=94.5&maxlongitude=106.5): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Java, Bali y Nusa Tenggara)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-11.5&maxlatitude=-5&minlongitude=105&maxlongitude=125): 2 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Kalimantan)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-4.5&maxlatitude=4.5&minlongitude=108&maxlongitude=119): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Sulawesi)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-6&maxlatitude=2.5&minlongitude=118&maxlongitude=125.5): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Maluku)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-9&maxlatitude=2.5&minlongitude=124&maxlongitude=135): 4 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Indonesia (Papúa occidental)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-10&maxlatitude=1.5&minlongitude=130&maxlongitude=141.1): 9 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Papúa Nueva Guinea (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-08-03&orderby=time&minmagnitude=4.9&minlatitude=-11.7&maxlatitude=-1&minlongitude=140.8&maxlongitude=155.9): 4 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-47.3&maxlatitude=-34.4&minlongitude=166.4&maxlongitude=178.6): 2 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-20.3&maxlatitude=-13.1&minlongitude=166.5&maxlongitude=170.2): 14 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-19.2&maxlatitude=-15.7&minlongitude=176.8&maxlongitude=180): 0 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-22.4&maxlatitude=-15.5&minlongitude=-176.2&maxlongitude=-173.7): 7 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=4.6&maxlatitude=21.1&minlongitude=116.9&maxlongitude=126.6): 31 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-6.2&maxlatitude=6.2&minlongitude=94.5&maxlongitude=106.5): 3 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-11.5&maxlatitude=-5&minlongitude=105&maxlongitude=125): 5 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-4.5&maxlatitude=4.5&minlongitude=108&maxlongitude=119): 0 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-6&maxlatitude=2.5&minlongitude=118&maxlongitude=125.5): 6 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-9&maxlatitude=2.5&minlongitude=124&maxlongitude=135): 24 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-10&maxlatitude=1.5&minlongitude=130&maxlongitude=141.1): 6 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=5.4&maxmagnitude=6&minlatitude=-11.7&maxlatitude=-1&minlongitude=140.8&maxlongitude=155.9): 15 eventos históricos en esta geografía y rango; 109 únicos en el conjunto de destinos

## P7 · Geografía ambigua

- Veredicto del protocolo congelado: `AMBIGUOUS_GEOGRAPHY`
- Tasa base: no disponible · Tasa base no disponible
- Capacidad predictiva: no establecida

### Candidatos

- Ningún evento candidato.

### Evidencia

- Sin evidencia registrada.

## P8 · Geografía ambigua

- Veredicto del protocolo congelado: `AMBIGUOUS_GEOGRAPHY`
- Tasa base: 43.4% · Posibilidad moderada sin predicción
- Capacidad predictiva: no establecida

### Candidatos

- 2026-07-24T02:42:36.550Z · M4.8 · 54 km NNW of San Antonio, Puerto Rico · Puerto Rico y región sísmica inmediata · usgs-fdsn

### Evidencia

- [Consulta USGS para República Dominicana (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-29&orderby=time&minmagnitude=4&minlatitude=17.5&maxlatitude=19.9&minlongitude=-72&maxlongitude=-68.3): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Puerto Rico y región sísmica inmediata](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-29&orderby=time&minmagnitude=4&minlatitude=17.8&maxlatitude=19&minlongitude=-67.5&maxlongitude=-65.2): 1 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Panamá (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-29&orderby=time&minmagnitude=4&minlatitude=7.2&maxlatitude=9.6&minlongitude=-83.05&maxlongitude=-77.2): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta USGS para Costa Rica (país)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-07-20&endtime=2026-07-29&orderby=time&minmagnitude=4&minlatitude=8&maxlatitude=11.2&minlongitude=-85.95&maxlongitude=-82.55): 0 eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5&minlatitude=17.5&maxlatitude=19.9&minlongitude=-72&maxlongitude=-68.3): 2 eventos históricos en esta geografía y rango; 26 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5&minlatitude=17.8&maxlatitude=19&minlongitude=-67.5&maxlongitude=-65.2): 0 eventos históricos en esta geografía y rango; 26 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5&minlatitude=7.2&maxlatitude=9.6&minlongitude=-83.05&maxlongitude=-77.2): 8 eventos históricos en esta geografía y rango; 26 únicos en el conjunto de destinos
- [Consulta de tasa base (365 días previos a la ventana)](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-07-20&endtime=2026-07-20&orderby=time&minmagnitude=4.5&maxmagnitude=5&minlatitude=8&maxlatitude=11.2&minlongitude=-85.95&maxlongitude=-82.55): 20 eventos históricos en esta geografía y rango; 26 únicos en el conjunto de destinos
