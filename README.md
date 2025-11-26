# 🖼 Frontend — SnapNation (Sprint 5)

El frontend de **SnapNation** es una SPA desarrollada en **React + Vite**, responsable de la interacción directa con el usuario: galería, detalle de foto, subida, votaciones, perfil y parte del panel de administración.

En este sprint el foco está en **documentar cómo el Frontend se relaciona con el Backend y con el dominio**, usando los diagramas UML creados en PlantUML.

---

## 🧩 Relación con los diagramas del Sprint 5

### 🎭 Casos de Uso

El frontend soporta los siguientes casos de uso del sistema:

- Registrar Usuario
- Iniciar Sesión
- Ver Galería
- Ver Detalle de Foto
- Subir Foto
- Votar Foto
- Ver Ganadores
- Ver / Editar Perfil
- (Admin) Moderar fotos
- (Admin) Crear tema semanal

📍 Diagrama: `docs/sprint5/usecase/`

---

### 🔁 Diagramas de Actividad (flujo de pantallas)

Los flujos de UI del frontend están documentados mediante diagramas de actividad. El frontend implementará:

- Subida y eliminación de foto (control de tema activo y tiempo)
- Votar foto (validación de login y voto único)
- Moderación (admin) (aprobar o eliminar fotos)
- Creación de tema semanal (admin)
- Visualizar Perfil de Usuario (estadísticas, fotos propias, votos realizados)

📍 Diagramas: `docs/sprint5/activities/`

---

### ⏱ Diagramas de Secuencia (Front ↔ Back)

Los diagramas de secuencia definen cómo el frontend interactúa con la API:

| Acción | Endpoint |
|--------|----------|
| Subir Foto | POST `/photos` |
| Votar Foto | POST `/photos/{id}/vote` |
| Ver Ganadores | GET `/photos/winners` |

Estas interacciones condicionan formularios, botones, mensajes de error y actualización de estado en la UI.

📍 Diagramas: `docs/sprint5/sequence/`

---

### 📦 Diagramas JSON (modelo de datos en la UI)

Los JSON documentados representan los datos que el frontend debe enviar y recibir:

- Respuesta Subir Foto (URL, autor, tema, timestamps, ID, etc.)
- Respuesta Ganadores Semanales (lista de fotos ganadoras, votos, autor, etc.)

📍 Diagramas: `docs/sprint5/json/`

---

### 🧱 Diagrama de Componentes (estructura de la SPA)

El diagrama de componentes describe la estructura del frontend y sus módulos principales:

| Componente | Función |
|------------|---------|
| GalleryView | Lista todas las fotos con filtros |
| PhotoDetailView | Muestra la foto y sus acciones |
| UploadView | Subida y validación de imagen |
| ProfileView | Datos del usuario y estadísticas |
| AdminPanel | Moderación y gestión de temas |
| VoteButton | Lógica y UI del voto |
| ThemeBanner | Información del tema semanal |

📍 Diagrama: `docs/sprint5/components/`

---

## 🚀 Puesta en marcha del Frontend

Para ejecutar el frontend:

- Acceder a la carpeta `JMO-PI-FRONT`
- Instalar dependencias con `npm install`
- Ejecutar con `npm run dev`
- Abrir en el navegador `http://localhost:5173`

---

## 🔐 Autenticación en el Frontend

El frontend trabaja con JWT emitidos por el backend:

- El token se almacena en `localStorage`
- Subida de fotos, voto y perfil requieren estar autenticado
- Las vistas de administración solo aparecen si el usuario tiene rol de administrador

📌 Esta lógica está representada en:
- Diagramas de Actividad (ramas lógicas de usuario logueado)
- Diagramas de Secuencia (validación del token en backend)

---

## 🛠 Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| React + Vite | SPA y bundling |
| React Router | Navegación |
| Axios / Fetch | Peticiones HTTP |
| JWT | Autenticación |
| Cloudinary (indirecto) | Visualización de imágenes |
| CSS / UI Library | Estilos |

---

👨‍💻 Autor: **Javier Manzano Oliveros**  
📚 2º DAW — Proyecto Integrado — Sprint 5
