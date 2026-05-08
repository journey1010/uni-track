# AuthModule - Módulo de Autenticación

## Descripción

Módulo de autenticación implementado siguiendo Clean Architecture dentro del proyecto **uni-track** (NestJS). Provee endpoints de login y refresh con JWT, gestión de sesiones, limpieza programada de sesiones expiradas y un filtro global de excepciones.

---

## Endpoints

### POST `/api/auth/login`

Autentica un usuario con email y contraseña.

**Request Body:**

```json
{
    "email": "usuario@ejemplo.com",
    "password": "mipass1"
}
```

**Validaciones del DTO:**

| Campo      | Regla                                        |
|------------|----------------------------------------------|
| `email`    | Formato de email válido                      |
| `password` | Mínimo 5 caracteres, al menos un número      |

**Flujo interno:**

1. Busca el usuario por email con sus relaciones (roles, permisos directos, permisos por rol).
2. Verifica que el estado sea `ACTIVE` (enum `UserStatus`).
3. Valida la contraseña usando `Hash.check()` del helper de infraestructura.
4. Unifica permisos directos (`permission_user`) y por roles (`role_user` → `permission_role`), eliminando duplicados por `permission.code`.
5. Genera un par de tokens JWT:
   - **Access Token**: claims `aud`, `type: 'access'`, `sub`, `jti`, `vrs`, `level`, `permissions` (códigos).
   - **Refresh Token**: claims `aud`, `type: 'refresh'`, `sub`, `jti`.
6. Persiste ambas sesiones en la tabla `user_sessions` con IP, user-agent y fecha de expiración.
7. Retorna HTTP 200 con datos del usuario y permisos (por nombre).

**Response (200):**

```json
{
    "statusCode": 200,
    "message": "Login successful",
    "data": {
        "name": "System",
        "last_name": "Administrator",
        "email": "user@example.com",
        "phone": "00000000",
        "permissions": ["*", "users.view", "users.create"],
        "access_token": "eyJhbGci...",
        "refresh_token": "eyJhbGci..."
    }
}
```

---

### POST `/api/auth/refresh`

Renueva el access token y opcionalmente rota el refresh token.

**Request Body:**

```json
{
    "refresh_token": "eyJhbGci..."
}
```

**Flujo interno:**

1. Decodifica y verifica el refresh token JWT.
2. Valida que la sesión exista en `user_sessions` y no esté expirada.
3. Busca el usuario (primero en cache Redis/memory, luego en DB) y verifica que siga activo.
4. **Lógica de rotación**:
   - Si el refresh token expira en **menos de 24 horas** → genera nuevo refresh + nuevo access (rotación completa).
   - Si el margen es **mayor a 24 horas** → solo genera nuevo access token.
5. Persiste las nuevas sesiones en `user_sessions`.

**Response (200):**

```json
{
    "statusCode": 200,
    "message": "Token refreshed successfully",
    "data": {
        "access_token": "eyJhbGci...",
        "refresh_token": "eyJhbGci... (o null si no hubo rotación)",
        "name": "System",
        "last_name": "Administrator",
        "email": "user@example.com",
        "phone": "00000000",
        "permissions": ["*", "users.view"]
    }
}
```

---

## Infraestructura Transversal

### Global Exception Filter

Ubicación: `infrastructure/exceptions/global-exception.filter.ts`

| Entorno           | Comportamiento                                                   |
|-------------------|------------------------------------------------------------------|
| `local` / `dev`   | Responde con stack trace, clase del error, mensaje y ruta        |
| `production`      | Responde HTTP 503 con `"Ocurrió un error inesperado"`            |

**Logging**: Independientemente del entorno, escribe el detalle técnico completo en `logs/errors.log`.

### JWT Configuration

Ubicación: `infrastructure/config/jwt.config.ts`

| Variable ENV     | Descripción              | Default                        |
|------------------|--------------------------|--------------------------------|
| `JWT_SECRET`     | Secreto para firmar JWT  | `default_secret_change_me`     |
| `JWT_ACCESS_TTL` | TTL access token (seg)   | `3600` (1 hora)                |
| `JWT_REFRESH_TTL`| TTL refresh token (seg)  | `604800` (7 días)              |

### Redis Configuration

Ubicación: `infrastructure/config/redis.config.ts`

| Variable ENV  | Descripción      | Default     |
|---------------|------------------|-------------|
| `REDIS_HOST`  | Host de Redis    | `127.0.0.1` |
| `REDIS_PORT`  | Puerto de Redis  | `6379`      |

> **Nota**: Actualmente configurado con cache en memoria como fallback. Para habilitar Redis, descomentar la configuración en `app.module.ts`.

---

## Task Scheduling - Limpieza de Sesiones

Ubicación: `src/modules/auth/application/session-cleanup.task.ts`

- **Cron**: Cada 6 horas por defecto (`0 */6 * * *`), configurable vía `SESSION_CLEANUP_CRON`.
- **Acción**: Elimina todos los registros de `user_sessions` donde `expires_at < NOW()`.
- **Logging**: Registra en consola la cantidad de sesiones eliminadas.

---

## Estructura de Archivos

```
src/modules/auth/
├── auth.module.ts
├── application/
│   ├── dto/
│   │   └── login-response.dto.ts
│   ├── login-user.case.ts
│   ├── refresh-token.case.ts
│   └── session-cleanup.task.ts
└── infrastructure/
    ├── controllers/
    │   └── auth.controller.ts
    └── validation/
        ├── login.dto.ts
        └── refresh.dto.ts

infrastructure/
├── config/
│   ├── jwt.config.ts          ← NUEVO
│   └── redis.config.ts        ← NUEVO
└── exceptions/
    └── global-exception.filter.ts  ← NUEVO
```

---

## Variables de Entorno Requeridas

```env
# JWT
JWT_SECRET=tu_secreto_seguro
JWT_ACCESS_TTL=3600
JWT_REFRESH_TTL=604800

# Redis (opcional, fallback a memoria)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cron de limpieza
SESSION_CLEANUP_CRON=0 */6 * * *
```

---

## Dependencias Agregadas

```bash
# Producción
@nestjs/jwt
@nestjs/schedule
@nestjs/cache-manager
cache-manager
cache-manager-ioredis-yet
ioredis
class-validator
class-transformer
uuid

# Desarrollo
@types/uuid
```

---

## Result Pattern

Todas las respuestas de los use cases utilizan el patrón `Result<T, E>` definido en `src/common/results.ts`:

```typescript
Result.success(data)   // { ok: true, value: data }
Result.failure(error)  // { ok: false, error: error }
```

---

## Entidad de Sesión (`user_sessions`)

| Columna        | Tipo       | Descripción                          |
|----------------|------------|--------------------------------------|
| `id`           | bigint     | PK auto-incremental                 |
| `user_id`      | bigint     | FK hacia `users`                    |
| `jti`          | varchar    | JWT ID único (UUID)                 |
| `user_agent`   | text       | User-Agent del cliente              |
| `ip_address`   | varchar(45)| IP del cliente                      |
| `expires_at`   | timestamp  | Fecha de expiración del token       |
| `type`         | varchar(50)| `'access'` o `'refresh'`            |
| `last_used_at` | timestamp  | Última vez que se usó               |
| `created_at`   | timestamp  | Fecha de creación                   |
| `updated_at`   | timestamp  | Fecha de actualización              |
