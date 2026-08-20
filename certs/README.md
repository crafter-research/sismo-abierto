# Certificado intermedio de Sectigo

`geocatmin.ingemmet.gob.pe` sirve **solo su certificado hoja**, sin el intermedio que lo
encadena a la raíz. `openssl s_client` lo confirma:

```
0 s:C=PE, ST=Lima, O=Instituto Geologico, Minero y Metalurgico, CN=*.ingemmet.gob.pe
Verify return code: 21 (unable to verify the first certificate)
```

curl lo tolera porque completa la cadena por su cuenta; Bun/Node no, y la ingesta falla con
`unable to verify the first certificate`.

Es un defecto de configuración del servidor de INGEMMET, no del certificado: la CA es
Sectigo, pública y legítima, y la cadena **verifica correctamente** en cuanto se aporta el
intermedio:

```
openssl verify -untrusted inter.pem leaf.pem
leaf.pem: OK
```

`sectigo-ov-r36.pem` es ese intermedio, descargado del `CA Issuers` que el propio
certificado declara (`http://crt.sectigo.com/SectigoPublicServerAuthenticationCAOVR36.crt`).

Se usa con `NODE_EXTRA_CA_CERTS`, que **agrega** este certificado al almacén del sistema.
La validación TLS sigue activa: no se desactiva la verificación ni se usa
`NODE_TLS_REJECT_UNAUTHORIZED=0`, que aceptaría cualquier certificado de cualquier host.

```bash
NODE_EXTRA_CA_CERTS=certs/sectigo-ov-r36.pem bun scripts/ingest-ingemmet.ts ingemmet-fallas
```

Si INGEMMET arregla su cadena, esto deja de ser necesario y el archivo se puede borrar.
