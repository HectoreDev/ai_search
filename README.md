# AI Search

Monorepo con un frontend React + Vite y una API desplegable como Cloudflare Worker.

## Requisitos

- Node.js 22+ (requerido por la versión actual de Wrangler)
- pnpm 10+

## Desarrollo

En Ubuntu (WSL), instala Node.js 20+ y pnpm, entra al repositorio y ejecuta:

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787

Vite redirige las solicitudes a `/api/*` al Worker durante el desarrollo.

Si deseas ejecutar únicamente el Worker desde WSL:

```bash
pnpm dev:api
```

Para obtener mejor rendimiento en WSL, guarda el repositorio en el filesystem de
Ubuntu (por ejemplo `~/projects/ai_search`) en vez de `/mnt/c/...`.

## Comandos

```bash
pnpm dev:web
pnpm dev:api
pnpm typecheck
pnpm build
pnpm deploy:api
```

Antes de desplegar, ejecuta `pnpm wrangler login` o configura un token de Cloudflare.

```bash
pnpm exec wrangler login
pnpm deploy:api
```
