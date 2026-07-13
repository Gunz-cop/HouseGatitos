# SDI — Etapa 6.2: preparación del primer live controlado

Esta carpeta contiene la evidencia revisable para el primer live de SDI en
HouseGatitos. No autoriza una publicación. En particular, durante esta etapa
no se ejecutan `npx sdi baseline --confirm` ni `npx sdi run` contra la
configuración real.

## Subetapa 6.2.1 — candidato live congelado

El candidato de build está fijado en House commit
`0c07c1439578bcb6ab18a682da58e8c7de1b747c`. Ese commit incorpora solamente
las dos variantes optimizadas que el código selecciona para el post Savannah:
`gato-savannah-portada-editorial-card.webp` y
`gato-savannah-portada-editorial-thumb.webp`. Ambas aparecen referenciadas en
el HTML compilado.

Los otros 412 derivados no versionados de `public/assets/images/optimized/`
no están referenciados por el build candidato; se clasificaron como artefactos
generados ajenos al candidato y no se incluyeron ni se eliminaron del
worktree editorial original. Los archivos locales restantes (`.agents/`,
briefs, plan de contenido y `scripts/organizar-briefs.js`) no intervienen en
el build y permanecen fuera de esta rama. La evidencia se ejecutó en un
worktree limpio dedicado de la rama de congelación.

El state legacy sigue siendo un archivo local ignorado por diseño. Se copió
solo como entrada de lectura al worktree de evidencia y se verificó sin
cambios con SHA-256
`78a0ee38132869d066cc432acbc858ed720bb6f98dc5701b36c2ea3ee0cf0475`.

### Dependencia SDI fijada

- Commit SDI: `3546d8d79d4fcc285b2ff662422deb6d13b5eb2d`.
- Paquete instalado: `@sdi/cli` `0.1.0`.
- Tarball: `../../SDI/sdi-cli-0.1.0.tgz`.
- SHA-256: `aac5aec39ce06f988e09f8751c881a989f0ca15f560c77da06c19529ef9088a1`.
- `package-lock.json` conserva la referencia `file:../../SDI/sdi-cli-0.1.0.tgz`
  y su integridad SHA-512.

### Evidencia de ejecución

- `npm ci`: correcto; npm informó 5 vulnerabilidades de dependencias (no se
  modificaron dependencias durante esta subetapa).
- `npm run build`: correcto; 87 páginas generadas.
- `npm run sdi:shadow:compare`: 86 recursos finales, 2 `created`, 84
  `updated`, 0 `deleted`, sin duplicados, rechazos, colisiones ni HTML ausente.
- `npm run sdi:live:plan`: 86 entradas, 2 `created`, 84 `updated`, 0
  `unchanged`, 0 `deleted`.
- No se creó `.sdi/state.json`; no se ejecutaron baseline, live, deploy ni
  llamadas reales a IndexNow.

El lote incluye commit de House, commit/versión/tarball/SHA de SDI, fecha de
generación, hashes legacy y actuales, resumen completo y entradas ordenadas.
El plan valida el SHA-256 aprobado antes de escribirlo y no contiene secretos.

### Comparación con 6.2 y reproducibilidad

Frente al lote 6.2 anterior: no hay URLs añadidas/eliminadas, cambios de
clasificación, cambios de hashes ni diferencias de conteo. La incorporación
de las dos variantes Savannah elimina la ambigüedad del worktree, pero no
altera el HTML ya observado en 6.2. Después de limpiar los artefactos de
build y regenerar build, shadow y plan, los dos lotes tuvieron el mismo
SHA-256: `911b875b33475418f7f1c61ff4036d2898d9c9af2484c317ed108ca813834562`.

El candidato técnico es **GO** para la revisión de autorización de 6.3. Esto
no constituye autorización del Product Owner ni permite ejecutar el live.

## Lote propuesto

`live-batch.json` se regenera con `npm run sdi:live:plan` a partir de `dist/`
y de `lib/discovery/state/sdi-state.json`. Es determinista, no contiene HTML
ni credenciales y conserva por entrada la URL, clasificación, hash legacy,
hash actual y evidencia de que no fue eliminada.

El build revisado produce 86 URLs publicables: 2 `created`, 84 `updated`, 0
`unchanged` y 0 `deleted`.

### Corrección de 6.2 resuelta

La ambigüedad de assets se resolvió en la subetapa 6.2.1 con el commit y la
evidencia anteriores. Sigue siendo obligatoria la revisión humana del lote y
la autorización explícita antes de 6.3.

## Por qué aparecen 84 updates

La comparación reproducible contra `379f72e` (2026-06-19, el commit del
último ciclo legacy) recompone exactamente los 84 hashes legacy: 84
`unchanged`, sin altas ni bajas. Por tanto, el state legacy es consistente con
ese build y no hay evidencia de timestamps, serialización no determinista ni
otra diferencia de toolchain.

El build actual cambia los 84 HTML respecto a ese punto. La causa común es de
contenido/layout global: entre ambos commits cambiaron `src/style.css`,
`src/lib/posts.js`, `src/pages/index.astro` y la plantilla
`src/pages/[silo]/[slug].astro`; esta última añadió los contenedores de
publicidad en los artículos. Además hay cambios editoriales verificables en
Abisinio, Bengalí y Savannah. Las dos altas corresponden a los posts Somali y
maullido nocturno. Las muestras de home, categoría (`/razas/`), artículo
(Abisinio), herramienta (calculadora) y ambos created se incluyen en el lote
por URL/hash; home, categoría y herramienta también cambian porque referencian
los assets globales generados por el CSS actualizado.

En consecuencia, enviar las 86 URLs es técnicamente razonable: representa
cambios publicados acumulados, no ruido de build. La revisión humana del lote
sigue siendo obligatoria.

## Estrategia de state recomendada

Se recomienda la opción A: importar el state legacy y ejecutar un único live
aprobado. Conserva la migración prevista, comunica los cambios acumulados y
permite probar `created`/`updated` con trazabilidad. Antes del live, copiar
`lib/discovery/state/sdi-state.json` y sus archivos legacy asociados a una
ubicación de backup fuera de Git; mantenerlos intactos durante al menos un
ciclo posterior exitoso.

La opción B no es recomendable para este piloto: ocultaría los cambios desde
junio y reduciría el valor de validación. Con `legacyStatePath` configurado,
`baseline --confirm` detecta el legacy importable y no puede sustituirlo. Para
forzar B habría que apartar ese legacy de la configuración, una desviación del
paso de migración aprobado que debe revisarse con Sol antes de realizarse.

## Credenciales y precondiciones

- La variable exacta es `INDEXNOW_KEY`; está excluida de Git mediante `.env`.
- La key pública ya existe en `public/` y su URL same-origin respondió HTTP
  200 con contenido coincidente durante la verificación explícita.
- `sdi.config.mjs` deriva `keyLocation` de esa variable en ejecución; la
  configuración versionada no contiene el valor de la key y SDI lo omite del
  reporte redactado.
- El runner legacy requiere `--use-system-ca`; úsalo también para la
  verificación y el live si el entorno lo necesita. No se permite bypass TLS.

## Prueba fake

`npm run sdi:live:fake` crea state y reportes solo en un directorio temporal y
dirige el lote real a un servidor HTTP local inyectado en el destino de SDI.
Verifica host, key, `keyLocation`, payload de 86 URLs, batches, redacción de
reportes, aceptación 200/202, rechazo 400, retry de 429/500 y timeout. El
state temporal avanza únicamente tras 200/202 completos. Con 86 URLs hay un
solo batch (el límite SDI es 1.000), así que la prueba de fallo en segundo
batch no aplica a este lote real.

## Orden operativo propuesto para 6.3

No ejecutar estos comandos hasta obtener la autorización indicada abajo.

```powershell
# 1. Fijar la evidencia del build que se desplegará.
npm run build
npm run sdi:live:plan

# 2. Desplegar sin ejecutar el discovery legacy.
npm --cache .npm-cache exec wrangler -- deploy

# 3. Verificar el deployment y la key publicada (con CA del sistema si aplica).
$env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-system-ca').Trim())
# comprobar URL del deploy, sitemap y keyLocation; no imprimir la key.

# 4. Conservar backup antes del único live aprobado.
# Copiar lib/discovery/state/ y, si existe, .sdi/state.json a una ruta fechada fuera de Git.

# 5. Únicamente tras aprobación: ejecutar SDI desde el tarball/commit fijado.
npx sdi run

# 6. Inspeccionar .sdi/last-run.json y confirmar state v1 en .sdi/state.json.
```

El script productivo existente `npm run deploy` ya ordena build → deploy →
legacy discovery. No se modifica en esta etapa: para 6.3 el despliegue debe
invocarse sin ese último paso, seguido del único live SDI autorizado.

## Rollback operativo

SDI es at-least-once: no hay despublicación ni reversión en IndexNow.

| Situación | Acción |
| --- | --- |
| Falla antes de publicar | Conservar reporte y lock/evidencia; corregir y repetir solo tras aprobación. El state anterior queda vigente. |
| Falla durante batches | No avanzar state; conservar reporte y reintentar posteriormente desde el mismo state. Algunas URLs pueden recibirse dos veces. |
| Publica todo pero falla state | Conservar reporte y state previo; no inventar state. Repetir puede duplicar envíos. |
| Guarda state pero falla reporte | Conservar state confirmado y el reporte anterior; recuperar el resultado desde consola/evidencia, sin revertir state. |
| Lock stale | Inspeccionar dueño/fecha; usar el mecanismo explícito de limpieza stale solo si procede, nunca borrar un lock activo o inválido a ciegas. |
| Resultado ambiguo | Tratarlo como posible publicación parcial, preservar artefactos y no asumir que IndexNow no recibió URLs. |

Conservar: backup legacy, copia del state SDI previo si ya existiera, reporte del
run, commit de House, commit/tarball de SDI y SHA-256.

## Checklist de aprobación para Gonzalo

- [x] Commit exacto de House revisado para el build candidato.
- [x] Worktree de evidencia limpio; lote regenerado desde ese commit exacto.
- [x] Commit exacto de SDI revisado.
- [x] SHA-256 del tarball de SDI verificado.
- [x] Build exitoso y lote regenerado/revisado.
- [ ] Deploy exitoso y verificado.
- [ ] `INDEXNOW_KEY` y `keyLocation` validadas sin filtración.
- [ ] Estrategia A de state aprobada.
- [ ] Backup legacy confirmado.
- [ ] Endpoint fake ejecutado con éxito.
- [ ] Rollback at-least-once revisado.
- [ ] Ventana de ejecución aprobada.
- [ ] Autorización explícita del Product Owner para un único live.

Sin todas las casillas anteriores, no se ejecuta el live.
