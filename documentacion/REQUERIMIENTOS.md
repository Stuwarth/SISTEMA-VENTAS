# REQUERIMIENTOS DEL SISTEMA

## Requerimientos Funcionales (RF)

Los requerimientos funcionales describen las funciones específicas que el sistema debe realizar.

---

### Módulo de Productos e Inventario

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-01 | Gestionar productos | El sistema debe permitir crear, editar, eliminar y consultar productos con los siguientes datos: código/SKU, nombre, descripción, categoría, precio de venta, precio de compra, stock actual, stock mínimo, stock máximo, unidad de medida, estado (activo/inactivo). | Alta |
| RF-02 | Gestionar categorías | El sistema debe permitir crear, editar y eliminar categorías de productos para su clasificación. | Media |
| RF-03 | Control de stock | El sistema debe actualizar automáticamente el stock al registrar ventas (resta) y compras (suma). | Alta |
| RF-04 | Alertas de stock bajo | El sistema debe notificar cuando un producto alcance su stock mínimo. | Media |
| RF-05 | Búsqueda de productos | El sistema debe permitir buscar productos por nombre, código, categoría o descripción. | Alta |
| RF-06 | Historial de movimientos | El sistema debe registrar todos los movimientos de inventario (entradas, salidas, ajustes) con fecha, cantidad y motivo. | Media |

---

### Módulo de Ventas

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-07 | Registrar venta | El sistema debe permitir registrar ventas con: fecha, cliente (opcional), productos vendidos (cantidad, precio unitario), descuentos, impuestos, total y método de pago. | Alta |
| RF-08 | Punto de venta (POS) | El sistema debe proporcionar una interfaz rápida para registrar ventas en tiempo real, con búsqueda de productos y cálculo automático de totales. | Alta |
| RF-09 | Aplicar descuentos | El sistema debe permitir aplicar descuentos por producto o por venta total (porcentaje o monto fijo). | Media |
| RF-10 | Calcular impuestos | El sistema debe calcular automáticamente los impuestos según la configuración (IVA u otros). | Media |
| RF-11 | Métodos de pago | El sistema debe permitir registrar el método de pago: efectivo, tarjeta, transferencia, crédito. | Alta |
| RF-12 | Anular venta | El sistema debe permitir anular una venta registrada, devolviendo los productos al inventario. | Media |
| RF-13 | Imprimir comprobante | El sistema debe permitir imprimir o generar PDF del comprobante de venta (ticket o factura simple). | Media |
| RF-14 | Consultar ventas | El sistema debe permitir consultar el historial de ventas con filtros por fecha, cliente, vendedor y estado. | Alta |

---

### Módulo de Clientes

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-15 | Gestionar clientes | El sistema debe permitir crear, editar, eliminar y consultar clientes con: nombre/razón social, NIT/CI, teléfono, email, dirección, notas. | Alta |
| RF-16 | Historial de compras | El sistema debe mostrar el historial de compras de cada cliente. | Media |
| RF-17 | Cuentas por cobrar | El sistema debe registrar y consultar las cuentas pendientes de pago de los clientes (ventas a crédito). | Media |
| RF-18 | Buscar clientes | El sistema debe permitir buscar clientes por nombre, NIT/CI o teléfono. | Alta |

---

### Módulo de Compras y Proveedores

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-19 | Gestionar proveedores | El sistema debe permitir crear, editar, eliminar y consultar proveedores con: nombre, NIT, teléfono, email, dirección, productos que provee. | Media |
| RF-20 | Registrar compra | El sistema debe permitir registrar compras/ingresos de mercadería con: fecha, proveedor, productos (cantidad, costo unitario), total. | Alta |
| RF-21 | Actualizar precios de compra | El sistema debe actualizar el precio de compra del producto al registrar una nueva compra. | Baja |
| RF-22 | Consultar compras | El sistema debe permitir consultar el historial de compras con filtros por fecha y proveedor. | Media |

---

### Módulo de Usuarios y Seguridad

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-23 | Gestionar usuarios | El sistema debe permitir crear, editar, desactivar y consultar usuarios con: nombre, email, contraseña, rol. | Alta |
| RF-24 | Roles y permisos | El sistema debe implementar al menos dos roles: Administrador (acceso total) y Vendedor (acceso limitado a ventas y consultas). | Alta |
| RF-25 | Autenticación | El sistema debe requerir inicio de sesión con email y contraseña para acceder. | Alta |
| RF-26 | Cerrar sesión | El sistema debe permitir cerrar sesión de forma segura. | Alta |
| RF-27 | Recuperar contraseña | El sistema debe permitir recuperar la contraseña mediante email (futuro). | Baja |
| RF-28 | Registro de actividad | El sistema debe registrar las acciones realizadas por cada usuario (quién, qué, cuándo). | Media |

---

### Módulo de Reportes

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-29 | Reporte de ventas | El sistema debe generar reportes de ventas por periodo (diario, semanal, mensual, personalizado) mostrando totales, cantidad de transacciones y productos vendidos. | Alta |
| RF-30 | Reporte de productos más vendidos | El sistema debe mostrar un ranking de los productos más vendidos en un periodo. | Media |
| RF-31 | Reporte de inventario | El sistema debe generar un reporte del estado actual del inventario (stock, valor, productos bajo mínimo). | Alta |
| RF-32 | Reporte de clientes | El sistema debe mostrar los clientes con mayor volumen de compras. | Baja |
| RF-33 | Exportar reportes | El sistema debe permitir exportar reportes en formato PDF y/o Excel (CSV). | Media |
| RF-34 | Dashboard/Panel | El sistema debe mostrar un panel de control con indicadores clave: ventas del día, productos con stock bajo, gráficos de tendencias. | Media |

---

### Módulo de Configuración

| ID | Requerimiento | Descripción | Prioridad |
|----|---------------|-------------|-----------|
| RF-35 | Datos del negocio | El sistema debe permitir configurar los datos del negocio: nombre, NIT, dirección, teléfono, logo. | Media |
| RF-36 | Configurar impuestos | El sistema debe permitir configurar el porcentaje de impuestos (IVA). | Media |
| RF-37 | Configurar moneda | El sistema debe permitir configurar la moneda y formato de números. | Baja |

---

## Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales describen las características de calidad del sistema.

---

### Seguridad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-01 | Cifrado de contraseñas | Las contraseñas deben almacenarse cifradas utilizando algoritmos seguros (bcrypt, Argon2). |
| RNF-02 | Comunicación segura | La comunicación entre cliente y servidor debe realizarse mediante HTTPS. |
| RNF-03 | Control de acceso | El sistema debe verificar permisos en cada operación según el rol del usuario. |
| RNF-04 | Protección contra ataques | El sistema debe implementar medidas contra inyección SQL, XSS y CSRF. |
| RNF-05 | Sesiones seguras | Las sesiones deben expirar después de un periodo de inactividad (ej: 30 minutos). |

---

### Rendimiento

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-06 | Tiempo de respuesta | Las operaciones comunes (consultas, registro de venta) deben completarse en menos de 2 segundos. |
| RNF-07 | Carga de página | La página inicial debe cargar en menos de 3 segundos con conexión estándar. |
| RNF-08 | Concurrencia | El sistema debe soportar al menos 10 usuarios simultáneos sin degradación significativa. |

---

### Usabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-09 | Interfaz intuitiva | La interfaz debe ser fácil de usar sin necesidad de capacitación extensa. |
| RNF-10 | Diseño responsivo | La interfaz debe adaptarse a diferentes tamaños de pantalla (PC, tablet). |
| RNF-11 | Mensajes claros | El sistema debe mostrar mensajes de error y confirmación claros y en español. |
| RNF-12 | Accesibilidad | El sistema debe seguir buenas prácticas de accesibilidad web (contraste, tamaño de texto). |

---

### Disponibilidad y Confiabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-13 | Disponibilidad | El sistema debe estar disponible al menos el 99% del tiempo en horario laboral. |
| RNF-14 | Respaldo de datos | Se deben realizar respaldos automáticos de la base de datos diariamente. |
| RNF-15 | Recuperación | El sistema debe poder recuperarse de fallos sin pérdida significativa de datos. |

---

### Mantenibilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-16 | Código modular | El código debe estar organizado en módulos/componentes independientes. |
| RNF-17 | Documentación | El código debe estar documentado (comentarios, README, documentación de API). |
| RNF-18 | Estándares de código | El código debe seguir estándares y buenas prácticas (linting, formato consistente). |
| RNF-19 | Control de versiones | Todo el código debe estar versionado en un repositorio Git. |

---

### Portabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-20 | Navegadores | El sistema debe funcionar correctamente en Chrome, Firefox, Edge y Safari (versiones recientes). |
| RNF-21 | Despliegue | El sistema debe poder desplegarse en servicios de hosting comunes (Vercel, Heroku, VPS). |
| RNF-22 | Base de datos | El diseño debe permitir migración a otros SGBD con cambios mínimos. |

---

### Escalabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-23 | Crecimiento de datos | El sistema debe manejar eficientemente el crecimiento de datos (miles de productos, ventas). |
| RNF-24 | Nuevos módulos | La arquitectura debe permitir agregar nuevos módulos sin afectar los existentes. |

---

## Matriz de Trazabilidad

| Objetivo Específico | Requerimientos Relacionados |
|---------------------|----------------------------|
| OE1: Analizar requerimientos | RF-01 a RF-37, RNF-01 a RNF-24 |
| OE2: Seleccionar tecnologías | RNF-16 a RNF-22 |
| OE3: Diseñar arquitectura | RF-23 a RF-28, RNF-01 a RNF-05 |
| OE4: Elaborar RF detallados | RF-01 a RF-37 |
| OE5: Plan de implementación | RNF-13 a RNF-15, RNF-21 |
| OE6: Documentar propuesta | RNF-17 |

---

**Nota:** Los requerimientos están priorizados como Alta (esencial para la versión inicial), Media (importante pero puede diferirse) y Baja (deseable para versiones futuras).
