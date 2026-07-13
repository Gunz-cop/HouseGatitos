# House Gatitos

Sitio estático Astro desplegado como assets del Worker `housegatitos` en
Cloudflare. Para reglas editoriales de imágenes, consulte `AGENTS.md`.

## Desarrollo

```powershell
npm ci
npm run dev
```

El build genera `dist/`, sitemaps y el HTML que SDI usa para detectar cambios.

## Flujo de producción

Decisión del Product Owner: GitHub es la fuente de verdad y Cloudflare es el
único ejecutor del deploy:

```text
IDE → push a GitHub → Cloudflare build → Cloudflare deploy
→ verificar el commit publicado → SDI local
```

- Cloudflare ejecuta únicamente `npm run build` y su deploy configurado. El
  build no ejecuta SDI, no lee `.sdi/` ni necesita `@sdi/cli`.
- No usar `wrangler deploy` como flujo normal.
- Tras verificar en Cloudflare que el commit correcto quedó publicado, desde el
  checkout local que conserva `.sdi/`, ejecutar `npm run sdi:run`.
- No ejecutar SDI si el build o deploy remoto fallaron, o si el commit publicado
  no coincide con el checkout local.

SDI no es dependencia de HouseGatitos: instálelo localmente desde el tarball
aprobado de SDI para que el binario `sdi` esté disponible en el `PATH` de la
máquina operadora. `INDEXNOW_KEY` vive solo en `.env` o en el entorno local.
No use bypass TLS; cuando el entorno lo requiera, aplique `--use-system-ca`
mediante `NODE_OPTIONS` antes de ejecutar SDI.

`.sdi/state.json` es state operativo local, no se versiona y no debe borrarse
durante un deploy o checkout. Contiene el snapshot usado para el siguiente
delta; su backup y restauración se documentan en
[`docs/sdi-stage-6-4/README.md`](docs/sdi-stage-6-4/README.md).

Una aceptación de IndexNow solo confirma recepción de la notificación; no
garantiza indexación ni ranking.
