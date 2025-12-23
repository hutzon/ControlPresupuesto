# LedgerFlow - Especificación Técnica (Etapa 0)

## 1. Alcance del MVP

### INCLUYE (Lo que se construirá)
-   **Modelo de Datos**: Usuarios, Categorías de gastos (ej. comida, transporte), Transacciones (ingresos/gastos).
-   **Autenticación**: Registro e inicio de sesión seguro (JWT).
-   **Gestión de Gastos**: CRUD de transacciones (crear, leer, actualizar, borrar).
-   **Dashboard Mensual**: Visualización simple de gastos por categoría y balance total del mes actual.
-   **Perfil de Usuario**: Edición básica de datos del usuario.

### EXCLUYE (Para etapas futuras)
-   Presupuestos (Budgets) complejos con alertas.
-   Cuentas compartidas o familiares.
-   Integraciones con bancos (PSD2 / Plaid).
-   Múltiples monedas.
-   Exportación a Excel/PDF.
-   Recurrencia (gastos fijos automáticos).

## 2. Stack Tecnológico Definitivo

-   **Infraestructura**: Docker & Docker Compose (Todo containerizado).
-   **Backend**: Node.js con **NestJS** (Framework robusto y estructurado).
-   **Frontend**: **React** (Vite) + TypeScript.
-   **Base de Datos**: **PostgreSQL** 15+ (Relacional, robusta).
-   **Servidor Web / Proxy**: **Nginx** (Reverse proxy para desarrollo y producción simulada).

## 3. Principios de Arquitectura

-   **Modularidad**: Uso de Módulos en NestJS (AuthModule, TransactionModule, UserModule).
-   **Clean Architecture (Simplificada)**: Separación clara de controladores (HTTP), servicios (Lógica de negocio) y repositorios/entidades (Acceso a datos).
-   **RESTful API**: Diseño de API predecible y estándar.
-   **Stateless**: El backend no guarda estado de sesión, se usa JWT.

## 4. Convenciones y Estructura

### Estructura de Carpetas (Monorepo)
```
/
├── apps/
│   ├── backend/    # NestJS app
│   └── frontend/   # React app
├── docker/         # Configs de Docker/Nginx
├── docs/           # Documentación técnica
└── output/         # (Opcional) Artifacts build
```

### Convenciones de Código
-   **Idioma**: Inglés para código (variables, funciones), Español para documentación de alto nivel si se prefiere.
-   **Linting**: ESLint + Prettier obligatorios en ambos proyectos.
-   **Commits**: Conventional Commits (feat: ..., fix: ..., chore: ...).

## 5. Entornos y Docker

-   **DEV**: `docker-compose.yml` levanta todo con hot-reloading (bind mounts).
    -   Backend en watch mode.
    -   Frontend en dev server (Vite).
-   **PROD**: Dockerfiles optimizados (Multi-stage builds).
    -   Backend compilado a JS `dist/`.
    -   Frontend compilado a estáticos servidos por Nginx.

## 6. Seguridad Mínima Obligatoria

1.  **Contraseñas**: Hashing con bcrypt (nunca texto plano).
2.  **Auth**: JWT (JSON Web Tokens) con expiración razonable.
3.  **Validación**: DTOs validan toda entrada en el backend (class-validator).
4.  **CORS**: Configurado restrictivamente en NestJS.
5.  **Variables de Entorno**: Secretos (DB pass, JWT secret) NUNCA en código, siempre en `.env`.

## 7. Estructura del Repositorio

**Monorepo** (Carpeta `apps/`).
-   **Justificación**: Facilita la gestión de un solo proyecto fullstack, compartiendo contexto y simplificando el despliegue con Docker Compose.
