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

El único mecanismo activo de discovery es SDI. Ejecutar los comandos en este
orden y desde el mismo directorio que contiene `.sdi/`:

```powershell
$env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-system-ca').Trim())
npm run build
npm run deploy
npm run sdi:run
```

- `npm run deploy` despliega solamente el Worker; no construye ni notifica.
- `npm run sdi:run` ejecuta el binario local `@sdi/cli` después de un deploy
  exitoso. Requiere `INDEXNOW_KEY` en `.env` o en el entorno.
- No continúe si un comando falla. Antes de un live, puede revisar el delta con
  `npx sdi run --dry-run`.

Wrangler debe autenticarse con la cuenta existente. No use bypass TLS; cuando
el entorno lo requiera, `--use-system-ca` se aplica mediante `NODE_OPTIONS`.

`.sdi/state.json` es state operativo local, no se versiona y no debe borrarse
durante un deploy o checkout. Contiene el snapshot usado para el siguiente
delta; su backup y restauración se documentan en
[`docs/sdi-stage-6-4/README.md`](docs/sdi-stage-6-4/README.md).

Una aceptación de IndexNow solo confirma recepción de la notificación; no
garantiza indexación ni ranking.
