# SIAC API

Backend para perfil, datos medicos y foto de perfil con MongoDB.

## Requisitos
- Node.js 18+
- MongoDB Atlas

## Configuracion
1. Copia el archivo de ejemplo y agrega tus credenciales:

```
cp .env.example .env
```

2. Completa:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES`
- `PUBLIC_BASE_URL`

## Ejecutar

```
npm install
npm run dev
```

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/medical`
- `PUT /api/medical`
- `POST /api/upload/profile-photo` (multipart form-data con `photo`)
