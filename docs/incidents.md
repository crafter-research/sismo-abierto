# Incidentes y emergencias

La capa de incidentes combina datos sísmicos automáticos con cortes humanitarios revisados.
Está diseñada para seguir disponible aunque Neon o el proveedor oficial tengan una caída
temporal.

## Flujo público

1. Trigger.dev ejecuta `incident-seismic-sync` cada minuto.
2. El detalle oficial del evento se normaliza y se guarda como una versión sísmica inmutable.
3. Vercel ejecuta `/api/cron/incidents` cada cinco minutos como respaldo.
4. La web y `GET /api/v1/incidents/colombia-2026-08-10` leen la versión persistida.
5. Si la versión supera 90 segundos, la lectura intenta actualizarla usando la caché compartida
   de 60 segundos.
6. El navegador refresca la ruta cada 60 segundos.

Sin `DATABASE_URL`, la página conserva el último corte humanitario revisado incluido en el
repositorio y consulta el evento sísmico en origen. La respuesta marca `storage: fallback`.

## Revisión humanitaria

Las rutas privadas requieren `Authorization: Bearer $INCIDENT_ADMIN_SECRET`.

Crear un candidato:

```bash
curl -X POST https://sismo.crafter.run/api/internal/incidents/colombia-2026-08-10/versions \
  -H "Authorization: Bearer $INCIDENT_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary @reporte-003.json
```

Ejemplo de payload:

```json
{
  "versionLabel": "Reporte preliminar 003",
  "observedAt": "2026-08-10T18:00:00-05:00",
  "source": {
    "name": "Unidad Nacional para la Gestión del Riesgo de Desastres",
    "url": "https://www.gestiondelriesgo.gov.co/",
    "reportNumber": "003",
    "issuedAt": "2026-08-10T18:00:00-05:00"
  },
  "facts": [
    {
      "key": "deaths",
      "value": 51,
      "displayValue": "51",
      "label": "fallecidos"
    }
  ]
}
```

Listar candidatos pendientes:

```bash
curl https://sismo.crafter.run/api/internal/incidents/colombia-2026-08-10/versions \
  -H "Authorization: Bearer $INCIDENT_ADMIN_SECRET"
```

Publicar una versión revisada:

```bash
curl -X POST https://sismo.crafter.run/api/internal/incidents/colombia-2026-08-10/versions/VERSION_ID/publish \
  -H "Authorization: Bearer $INCIDENT_ADMIN_SECRET"
```

Una versión pendiente nunca aparece en la web, API pública o CLI. Publicar no modifica ni
elimina cortes anteriores.

## Persistencia

La migración crea `incidents` e `incident_versions`. La segunda tabla conserva snapshots JSON
con fuente, hora observada, estado de revisión y hora de publicación. Los IDs de versiones
sísmicas son deterministas, por lo que Trigger.dev, Vercel y la autocorrección pública pueden
ejecutarse a la vez sin duplicar el mismo corte.

El SQL canónico vive en `packages/incidents/src/neon-store.ts` y debe aplicarse con el flujo de
migraciones por branch de Neon antes de habilitar los jobs en producción.
