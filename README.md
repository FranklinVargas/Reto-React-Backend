# Plataforma de pedidos

Este repositorio contiene una API Express con Sequelize y una interfaz web ligera para gestionar productos y pedidos. El stack completo se puede ejecutar con Docker Compose junto con una base de datos MySQL.

## Estructura del proyecto

- **backend/**: código de la API Node.js.
- **frontend/**: interfaz web estática que consume la API.
- **docker-compose.yml**: orquestación de los contenedores (frontend, backend y base de datos).

## Requisitos previos

- Docker y Docker Compose instalados.

## Puesta en marcha con Docker

1. Copia las variables necesarias (en este caso ya vienen definidas en el `docker-compose.yml`).
2. Levanta los servicios:

   ```bash
   docker compose up --build
   ```

3. Servicios disponibles:
   - Frontend: <http://localhost:5173>
   - API: <http://localhost:4000>
   - MySQL expuesto en el puerto `3306` con base de datos `retoapp` y credenciales `retoapp/secretpass`.

La API aplica migraciones automáticas al iniciar (`sequelize.sync({ alter: true })`), por lo que el esquema se ajustará a los modelos vigentes.

## Desarrollo local sin Docker

1. Instala dependencias del backend:

   ```bash
   cd backend
   npm install
   ```

2. Configura un archivo `.env` en `backend/` con los datos de tu base de datos MySQL.

3. Ejecuta el backend en modo desarrollo:

   ```bash
   npm run dev
   ```

4. Abre el frontend estático desde `frontend/index.html` o sirviéndolo con cualquier servidor web (por ejemplo `npx serve frontend`).

## Personalización del frontend

El archivo `frontend/app.js` lee la API desde `http://localhost:4000/api` por defecto. Si despliegas los servicios en otro dominio o puerto puedes definir `window.API_BASE_URL` antes de cargar el script, por ejemplo:

```html
<script>
  window.API_BASE_URL = "https://mi-dominio.com/api";
</script>
<script type="module" src="./app.js"></script>
```

## Scripts útiles

- **backend**
  - `npm run dev`: inicia el servidor con recarga en caliente (requiere `nodemon`).
  - `npm start`: inicia el servidor en modo producción.
  - `node src/seed.js`: carga productos de ejemplo.

## Pruebas de salud

- `GET http://localhost:4000/` → respuesta `{ ok: true }`.
- `GET http://localhost:4000/api/products` → lista de productos registrados.

## Notas

- El frontend es completamente estático y se comunica con la API mediante `fetch`.
- Asegúrate de que la base de datos esté accesible antes de iniciar el backend en desarrollo.

