# Provider CENEPRED: microzonificación sísmica del CISMID

Estado: **autorizado por CENEPRED** (correo de `soporte-sigrid@cenepred.gob.pe`, 2026-08-19).
Implementado y verificado contra el servicio real.

## Decisión

El gate era de licencia, no de acceso técnico: la capa siempre fue alcanzable con el token del
visor, pero SIGRID no publicaba licencia ni términos de uso en ninguna parte, y ausencia de
licencia no es permiso.

CENEPRED autorizó por escrito reutilizar, almacenar y publicar la capa dentro de Sismo Abierto.
La autorización se archiva fuera de este repo, en el vault privado. Condiciones:

- **Atribución visible a CISMID** como fuente de la información.
- **Referencia al servicio SIGRID / Cartografía de Peligros** de donde se obtuvieron los datos.
- **Procedencia trazable** dentro de la plataforma.

El permiso comprende explícitamente obtener y almacenar los datos necesarios para publicarlos,
**sin depender del token del visor en cada consulta**. Por eso la capa se ingesta a Neon una vez
y se sirve desde ahí, en lugar de consultar SIGRID por request.

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
SISMO_CENEPRED_TOKEN=<token> bun dev
```

Sin esa variable, cualquier consulta lanza `SourceError` con `kind: "disabled"`. El provider
NO se enciende en tests.

El token sigue siendo necesario para **hablar con SIGRID durante la ingesta**, porque el
servicio no ofrece otra vía de acceso. Con el permiso concedido, lo correcto es ingestar una
vez a Neon y servir desde ahí: el correo autoriza justamente eso y evita depender de un token
que caduca a los 60 minutos.

## Sigue fuera de alcance

- Vectorizar el PDF del CISMID: es obra derivada, no está cubierto por el permiso.
- Los cuatro FeatureServers de ArcGIS Online rotulados CISMID. Uno acepta ediciones anónimas,
  así que ninguno sirve como fuente.
- Publicar la capa sin la atribución a CISMID y la referencia a SIGRID: es condición del permiso.
