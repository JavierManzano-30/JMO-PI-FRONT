# SnapNation Frontend

SPA en `React + Vite`, conectada al backend real `JMO-PI-BACK`.

## Requisitos
- Node.js 18+ (recomendado 20 LTS)
- npm 9+

## Importante (proyecto extraído de ZIP)
Si el proyecto viene comprimido con `node_modules`, no uses ese estado como fuente de verdad.
Haz instalación limpia:

```bash
cd JMO-PI-FRONT
rm -rf node_modules dist
npm install
```

Opcional para validar coherencia con lockfile:

```bash
npm ci --dry-run
```

## Configuración
1. Copia variables de entorno:

```bash
cp .env.example .env
```

2. Ajusta `VITE_API_URL` si tu backend no corre en local por defecto:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Scripts
- `npm run dev`: servidor de desarrollo (`http://localhost:5173`)
- `npm run build`: build de producción
- `npm run preview`: sirve el build localmente

Nota: este frontend no tiene script `lint` configurado actualmente.

## Arranque
```bash
cd JMO-PI-FRONT
npm install
npm run dev
```

## Verificación mínima recomendada
```bash
npm run build
```

## Integración real con backend
- API base configurable por `VITE_API_URL`
- Auth JWT real (`/auth/register`, `/auth/login`, `/users/me`)
- Votos, comentarios, ranking/ganadores y perfil contra endpoints reales
- Realtime con Socket.IO para altas de foto, votos y comentarios

## Rutas principales
- `/winners`
- `/login`
- `/register`
- `/no-session`
- `/app/dashboard`
- `/app/winners`
- `/app/photos/:photoId`
- `/app/photos/:photoId/closed`
- `/app/photos/upload`
- `/app/photos/upload/success`
- `/app/profile`
- `/app/profile/edit`
