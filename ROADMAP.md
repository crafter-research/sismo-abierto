# Roadmap

Orden aproximado. Los gates de seguridad y revisión científica no se negocian por velocidad.

## Ahora

- [x] Deploy público en Vercel (sismo-abierto.vercel.app). Falta dominio propio.
- [ ] Veredictos reales de Verifica cuando venzan las ventanas congeladas (26 jul → 1 ago
      2026): correr el evaluador, publicar candidatos, desacuerdos de fuentes y tasa base.
- [ ] Revisión científica externa de la interpretación ACELDAT (componentes Z/N/E, PGA,
      distancia epicentral) antes de difundir la demo.
- [x] Probes en producción: Vercel Cron cada 30 min + Neon para historial persistente, y drift check en GitHub Actions cada 6 h.

## Siguiente

- [x] Veredictos de Verifica con point-in-polygon real sobre límites INEI para departamentos
      del Perú, con banda de frontera simétrica de 0.25°; países siguen en cajas documentadas.
- [ ] Espectrograma y espectro de Fourier por estación en el visor de ondas.
- [ ] Comparador de eventos (mismo lugar, distinta magnitud/profundidad) en Aula.
- [ ] Más lecciones: profundidad y distancia; qué son Z/N/E y PGA; predicción vs pronóstico
      vs alerta temprana.
- [ ] `sismo` como paquete instalable (`bunx sismo`), con `sismo schema <cmd>` para
      introspección de agentes.
- [ ] Badge público de estado por fuente (SVG servido por la API).

## Después

- [ ] Estado de Fuentes público (gate: revisión institucional del lenguaje con el IGP).
- [ ] Cronología volcánica por volcán (gate: fuente autoritativa de vigencia del nivel y
      mapeo determinista registro→boletín; hoy `FRESHNESS_UNKNOWN` y sección bloqueada).
- [ ] Notificaciones opt-in no críticas (nunca alertas de seguridad).
- [ ] Clientes generados desde OpenAPI (TS/Python) si aparece adopción real.
- [ ] i18n (quechua y aimara primero, luego inglés).
- [ ] Modo educativo offline para colegios (snapshot local de eventos de ejemplo).

## Fuera de alcance (permanente)

- Predicción sísmica, scoring de riesgo o cualquier promesa de anticipación.
- Alertas de seguridad o evacuación — eso es competencia exclusiva de los canales oficiales.
- Redistribuir datasets de las fuentes sin términos de reutilización confirmados.
- Presentar el proyecto como oficial o respaldado por el IGP.
