# Provider CENEPRED: microzonificación sísmica del CISMID

Estado: implementado y verificado contra el servicio real, desactivado hasta recibir un
token institucional.

## Decisión

La capa es técnicamente alcanzable sin credenciales. No debe consumirse hasta que CENEPRED
entregue acceso, porque **SIGRID no publica licencia ni términos de uso en ninguna parte**:
ni en el visor, ni en el sitio institucional, ni en el portal de transparencia. Ausencia de
licencia no es permiso.

Sismo Abierto se sostiene sobre procedencia citable. Servir una capa cuya autorización no se
puede mostrar contradice el principio que hace creíble todo lo demás.

## Qué se pide

| | |
|---|---|
| Servicio | `sigrid/Cartografia_Peligros/MapServer` |
| Capa | `5030402` · Microzonificación Sísmica - CISMID |
| Registros | 658 polígonos (medido) |
| Geometría | `esriGeometryPolygon`, WGS84 |
| Campos | 17, incluyendo departamento, provincia, distrito, id_zona, desc_zona, elaborac |
| Cobertura | Lima con detalle urbano, la que el estudio del CISMID publica como PDF de 22.9MB |
| Contacto | `soporte-sigrid@cenepred.gob.pe` y formulario dentro del visor |

Capas hermanas del mismo servicio, por si el permiso las alcanza: `5030401` (Zonificación
Sísmica-Geotécnica del IGP, 163) y `5030403` (Microzonificación MVCS, 85).

## Por qué no alcanza la capa del IGP

Son dos estudios distintos con nombre parecido. El del IGP cubre 57 ciudades del país con
polígonos gruesos; en el departamento de Lima cubre Barranca, Huacho, Chancay, Chosica,
Huaycán, Chaclacayo y Cañete, pero **ningún distrito de Lima Metropolitana**. El del CISMID
cubre justamente eso, manzana por manzana.

## Mecanismo observado

El backend de `sigridv3` acuña un token de ArcGIS server-side y lo embebe en el HTML como
`sessionStorage.setItem("arcgis_token", ...)`. No hay llamada cliente a `generateToken`.
El servicio valida ese token contra el header `Referer`, que debe ser exactamente
`https://sigrid.cenepred.gob.pe/`; dominio y esquema se comparan estrictos.

| Situación | Respuesta |
|---|---|
| Sin token | `499 Token Required` |
| Token válido + Referer correcto | 200 |
| Token vencido o Referer ajeno | `498 Invalid Token` |

`generateToken` por la vía documentada exige usuario y contraseña. No hay registro público.

Detalle completo del recon: `recon/sigrid-visor-dataflow.md`.

## Cómo se enciende

```bash
SISMO_CENEPRED_TOKEN=<token institucional> bun dev
```

Sin esa variable, cualquier consulta lanza `SourceError` con `kind: "disabled"`. El provider
NO se enciende en tests, a diferencia del de SGC: acá el gate es la licencia, no el entorno.

## Fuera de alcance mientras el gate siga cerrado

- Republicar la capa como GeoJSON propio.
- Vectorizar el PDF del CISMID: es obra derivada.
- Los cuatro FeatureServers de ArcGIS Online rotulados CISMID. Uno acepta ediciones anónimas,
  así que ninguno sirve como fuente.
