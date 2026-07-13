# SDI — Etapa 6.3: primer live controlado

## Resultado

**GO.** Se ejecutó exactamente un live de SDI contra el Worker productivo de
HouseGatitos. IndexNow aceptó el único batch de 86 URLs y el dry-run posterior
confirmó la idempotencia sin publicar.

Esta evidencia no contiene credenciales, contenido de state ni contenido de
reportes operativos.

## Identidad aprobada

| Elemento | Valor |
| --- | --- |
| Rama de evidencia | `codex/sdi-stage-6-3-first-live` |
| Commit House desplegado | `ec1b9669bea068dd4ca2c8630f17d363c1b1bd6b` |
| Commit de contenido House | `0c07c1439578bcb6ab18a682da58e8c7de1b747c` |
| Commit SDI | `3546d8d79d4fcc285b2ff662422deb6d13b5eb2d` |
| Versión SDI | `0.1.0` |
| SHA-256 tarball SDI | `aac5aec39ce06f988e09f8751c881a989f0ca15f560c77da06c19529ef9088a1` |
| SHA-256 del lote | `911b875b33475418f7f1c61ff4036d2898d9c9af2484c317ed108ca813834562` |
| SHA-256 legacy state | `78a0ee38132869d066cc432acbc858ed720bb6f98dc5701b36c2ea3ee0cf0475` |

## Preflight y deploy

- El worktree congelado inició limpio, sin `.sdi/state.json` ni lock.
- El build generó 87 páginas y el lote reproducible conservó 86 URLs: 2
  `created`, 84 `updated`, 0 `unchanged`, 0 `deleted`.
- Se preservó una copia local del state legacy y la evidencia operativa fuera
  de Git antes del deploy.
- Se publicó únicamente el Worker existente `housegatitos`, con el comando:

  ```powershell
  $env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-system-ca').Trim())
  npm --cache .npm-cache exec wrangler -- deploy
  ```

- No se ejecutó `npm run deploy` ni el discovery legacy.
- Worker version publicado: `00086b19-9e22-4b48-840c-f3e069644b27`.
- Home, ambos sitemaps, una URL created, una URL updated y la key pública
  respondieron HTTP 200; la comparación de la key se realizó solo en memoria.

## Ejecución SDI

| Verificación | Resultado |
| --- | --- |
| Dry-run pre-live | 2 created, 84 updated, 0 unchanged, 0 deleted |
| Hora de inicio del live | `2026-07-13T14:05:29.5332298-06:00` |
| Comando live | `npx sdi run` |
| Exit code | 0 |
| Status | success |
| Submitted | 86 |
| Batches | 1 |
| Attempts | 1 |
| Accepted | true |
| SHA-256 state confirmado | `7e6bc79283dbd68612dafe61ad036728af0519e448f37885c57816c9fa7c9f53` |
| SHA-256 reporte live | `2813fdce2f45451d0e37ec5707c4049e46d655d2c121bb792fa4ecef307cbfe9` |
| Recursos en state v1 | 86 |
| Lock residual | ausente |

El reporte live se preservó fuera de Git antes del dry-run posterior, que por
contrato reemplaza `.sdi/last-run.json`.

## Verificación posterior

- Dry-run posterior: 0 created, 0 updated, 86 unchanged, 0 deleted.
- El state conservó el mismo SHA-256 tras ese dry-run.
- El reporte dry-run terminó en `success`, sin bloque `indexNow` y sin errores.
- Ningún reporte inspeccionado contenía la key de IndexNow.
- No hubo segundo live ni retry manual.

## Cierre

La Etapa 6.3 cumple los criterios autorizados para **GO**. El discovery legacy
permanece sin sustituir y no se inició ninguna migración adicional.
