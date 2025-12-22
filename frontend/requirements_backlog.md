# Requisitos - Backlog

Lista de requisitos extraídos de la documentación (CAPITULO_I, CAPITULO_II) con prioridad y estimación.

## Requisitos Funcionales (FR)

- **RF1 — Autenticación y multi-tenant**: cada usuario debe pertenecer a un `tenantId` y ver sólo sus datos. **Prioridad:** Must. **Estimación:** 4–6 h.
- **RF2 — Gestión de usuarios y roles (admin, vendedor)**: el sistema debe permitir roles y control de acceso. **Prioridad:** Must. **Estimación:** 6–8 h.
- **RF3 — CRUD Productos**: crear/editar/eliminar productos por tenant. **Prioridad:** Must. **Estimación:** 4 h.
- **RF4 — CRUD Clientes**: registrar y editar clientes (historial de compras). **Prioridad:** Must. **Estimación:** 4–6 h.
- **RF5 — Registrar ventas con detalle**: líneas, cantidades, totales y ligadas al `tenantId`. **Prioridad:** Must. **Estimación:** 8–12 h.
- **RF6 — Control de inventario**: ajustar stock al vender/ingresar. **Prioridad:** Must. **Estimación:** 4–6 h.
- **RF7 — Reportes**: ventas por periodo, top productos, ventas por cliente. **Prioridad:** Must. **Estimación:** 6–8 h.
- **RF8 — Generación de factura/recibo en PDF**: por venta. **Prioridad:** Must. **Estimación:** 6–8 h.
- **RF9 — Exportar reportes a CSV**: **Prioridad:** Should. **Estimación:** 2–3 h.

## Requisitos No Funcionales (NFR)

- **NFR1 — Seguridad**: HTTPS, reglas Firestore RBAC, sanitización de inputs y mitigación OWASP Top10. **Prioridad:** Must. **Estimación:** 4–6 h.
- **NFR2 — Usabilidad**: interfaz intuitiva, responsive y accesible. **Prioridad:** Must. **Estimación:** 8–12 h.
- **NFR3 — Rendimiento**: respuestas < 2s y paginación. **Prioridad:** Should. **Estimación:** 4–6 h.
- **NFR4 — Multitenancy**: separación estricta de datos por `tenantId`. **Prioridad:** Must. **Estimación:** 2–4 h.
- **NFR5 — Disponibilidad y backup**: plan de respaldo documentado. **Prioridad:** Should. **Estimación:** 2–4 h.

## Próximos pasos priorizados

1. Implementar módulo `Clientes` (RF4) y conectarlo al `tenantId` — crítica para demo/defensa.
2. Roles y permisos (RF2 + NFR1).
3. Mejorar UX (NFR2) aplicando tema profesional.
4. Implementar facturación en PDF y reportes.

---

Archivo generado automáticamente desde los documentos del proyecto.
