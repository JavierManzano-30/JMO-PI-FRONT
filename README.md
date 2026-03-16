# SnapNation Frontend

SPA en React + Vite integrada con el backend real (`JMO-PI-BACK`).

## Integracion real
- API base configurable por entorno: `VITE_API_URL`.
- Autenticacion JWT real contra backend (`/auth/register`, `/auth/login`).
- Sesion persistida en `localStorage` y restaurada con `/users/me`.
- Dashboard, detalle, subida de foto, votos y perfil consumen endpoints reales.

## Variable de entorno
Crear `.env` en `JMO-PI-FRONT`:

```bash
VITE_API_URL=http://localhost:3000/api/v1
```

## Mapa principal de rutas
- `/login`
- `/register`
- `/no-session`
- `/app/dashboard`
- `/app/photos/:photoId`
- `/app/photos/:photoId/closed`
- `/app/photos/upload`
- `/app/photos/upload/success`
- `/app/profile`
- `/app/profile/edit`

## Puesta en marcha
1. Levantar backend y base de datos (ver README de `JMO-PI-BACK`).
2. En frontend:

```bash
npm install
npm run dev
```

3. Abrir `http://localhost:5173`.
