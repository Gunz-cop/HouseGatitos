# SDI — Etapa 6.4: sustitución del discovery legacy

## Estado

Desde esta etapa, **SDI es el único flujo de discovery activo de
HouseGatitos**. Por decisión del Product Owner, el deploy es exclusivamente
remoto y parte de GitHub:

```text
IDE -> push a GitHub -> Cloudflare build -> Cloudflare deploy
-> verificar commit publicado -> SDI local
```

Cloudflare construye y publica el Worker; no ejecuta SDI, no lee state y no
recibe `@sdi/cli` como dependencia. `sdi:run` solo se ejecuta desde el
checkout local que preserva el state, tras confirmar que Cloudflare publicó el
mismo commit. Si el build o deploy remoto fallan, SDI no se ejecuta.

## Inventario y resolución del legacy

| Elemento | Clasificación | Resolución 6.4 |
| --- | --- | --- |
| `lib/discovery/**` | Retirar | Eliminado: runner, discovery Astro, state adapter, IndexNow y Google legacy no tienen consumidores activos. |
| `scripts/discovery-runner.mjs` y `npm run discovery` | Retirar | Eliminados; ya no hay comando que pueda lanzar el legacy. |
| `scripts/sdi-shadow-compare.mjs` | Diagnóstico temporal | Eliminado tras el shadow aprobado de 6.1. |
| `scripts/sdi-live-plan.mjs` | Diagnóstico temporal | Eliminado tras el único live 6.3. |
| `scripts/sdi-live-fake.mjs` | Diagnóstico temporal | Eliminado; su resultado queda descrito en la evidencia 6.2. |
| `tsx` | Dependencia exclusiva del shadow | Retirada. |
| `lib/discovery/state/*` | State legacy activo | No se versiona ni se conserva en el checkout operativo. El backup histórico externo de 6.3 se preserva fuera de Git. |
| `docs/sdi-stage-6-2/` y `docs/sdi-stage-6-3/` | Evidencia histórica | Conservadas y marcadas como no operativas. |

No quedan imports, scripts de `package.json`, dependencias ni llamadas de
deploy hacia discovery legacy. `@sdi/cli` tampoco es dependencia del build
remoto; el binario SDI se instala y ejecuta solo en la máquina local operadora.
Los imports profundos de `@sdi/cli/dist/**` no forman parte de la integración
productiva.

## State operativo local

El state operativo es `.sdi/state.json`. No se versiona: contiene el inventario
mutable local de SDI y está ignorado por Git junto con reportes, lock y backups
atómicos. El state inicial aprobado es el schema v1 de 6.3: 86 recursos y
SHA-256 `7e6bc79283dbd68612dafe61ad036728af0519e448f37885c57816c9fa7c9f53`.

- **Persistencia:** conservar `.sdi/` en el checkout local desde el que se
  ejecuta SDI. Cloudflare nunca recibe este directorio; `dist/` remoto es
  desechable, el state local no.
- **Backup:** antes de cambios operativos, copiar `.sdi/state.json`,
  `.sdi/state.json.bak` si existe y `.sdi/last-run.json` a una ruta local
  fechada fuera de Git. El backup histórico previo al primer live está en
  `C:\Users\grcx1\OneDrive\Documentos\SDI-6-3-backups\HouseGatitos-20260713-104905`.
- **Restauración:** detener ejecuciones, conservar la copia dañada para
  diagnóstico y restaurar `state.json` (o su `.bak` validado) en `.sdi/`.
  Ejecutar `npm run build` y `npx sdi run --dry-run`; no usar `baseline` si
  existe un state recuperable.
- **Checkout/entorno limpio:** no ejecutar live sin restaurar primero un backup
  validado de `.sdi/state.json`. Un state ausente requiere restauración; usar
  `baseline --confirm` crearía una nueva línea base y no es el procedimiento
  de recuperación de HouseGatitos.

## Operación

Se requiere Node 22.12+ y `npm ci` para el build local de diagnóstico. El
tarball aprobado de SDI se instala localmente en la máquina operadora, fuera de
las dependencias de HouseGatitos, por ejemplo:

```powershell
Set-Location C:\Users\grcx1\OneDrive\Documentos\SDI
npm run build
npm pack
npm install --global .\sdi-cli-0.1.0.tgz
```

Después de push, revisar que Cloudflare terminó correctamente y publicó el
commit esperado. Solo entonces, desde el checkout local de HouseGatitos:

```powershell
$env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-system-ca').Trim())
npm run sdi:run
```

No se deshabilita TLS. Tras cada ejecución, inspeccionar `.sdi/last-run.json`:
`success`, conteos de `created`/`updated`/`unchanged`/`deleted`, y para live,
`indexNow.accepted: true`. La aceptación de IndexNow confirma recepción de la
notificación, **no** garantiza indexación, ranking ni plazo de indexación.

## Validación de la etapa

El 13 de julio de 2026 se validó este flujo con un cambio visible y reversible
en una sola página: se añadió una frase sobre una rutina breve de juego al final
de `/razas/gato-somali/`.

| Comprobación | Resultado |
| --- | --- |
| Baseline previo | 0 created, 0 updated, 86 unchanged, 0 deleted |
| Delta previo al deploy | 0 created, 1 updated, 85 unchanged, 0 deleted |
| Worker publicado | `c71b49d3-c118-4e2a-b91b-793f43f65127` |
| Verificación productiva | Página y sitemap HTTP 200; cambio visible en la página |
| Live SDI | `success`; 1 submitted, 1 batch, 1 attempt, `accepted: true` |
| State posterior al live | SHA-256 `9d29978f98987b8946b2d582028d81a92403e4dc3888f8bf8567b3659640bfe3` |

El dry-run posterior debe cerrar con 0 created, 0 updated, 86 unchanged y 0
deleted; ese resultado confirma que el state quedó idempotente después del live.

## Fallos y rollback

| Situación | Acción |
| --- | --- |
| Build o deploy falla | No ejecutar SDI. Corregir o restaurar el Worker y repetir el orden completo. |
| Deploy correcto, SDI falla | El state anterior permanece; corregir y repetir `sdi:run`. |
| Live aceptado, fallo local antes de guardar state | Restaurar el state previo y repetir cuando sea seguro: SDI es at-least-once y puede reenviar URLs aceptadas. |
| State perdido o corrupto | Restaurar backup validado; SDI también intenta `.bak`. No crear baseline sobre la pérdida. |
| Worker debe revertirse | Usar el mecanismo habitual de Wrangler/Cloudflare para volver a la versión previa; después ejecutar build, dry-run y SDI solo si el contenido desplegado cambió. |

Una notificación que IndexNow ya aceptó no se puede deshacer. Por eso el
rollback recupera contenido y state, pero no promete revertir la recepción
externa.
