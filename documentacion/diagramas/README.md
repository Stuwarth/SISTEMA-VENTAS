# Diagramas del Sistema de Ventas Integral

Este directorio contiene los diagramas en formato PlantUML para el Sistema de Ventas.

## Archivos incluidos

1. **casos_de_uso.puml** - Diagrama de Casos de Uso del sistema
2. **diagrama_er.puml** - Diagrama Entidad-Relación (modelo de base de datos)

## Cómo generar las imágenes

### Opción 1: PlantUML Online (Recomendado - más fácil)

1. Abre [PlantUML Web Server](https://www.plantuml.com/plantuml/uml/)
2. Copia el contenido del archivo `.puml`
3. Pega en el editor
4. La imagen se genera automáticamente
5. Haz clic derecho en la imagen → "Guardar imagen como..."
6. Guarda como PNG o SVG

### Opción 2: Extensión VS Code

1. Instala la extensión "PlantUML" en VS Code
2. Abre el archivo `.puml`
3. Presiona `Alt + D` para ver la vista previa
4. Clic derecho → "Export Current Diagram"
5. Selecciona formato PNG

### Opción 3: Línea de comandos

Si tienes Java y PlantUML instalados:

```bash
java -jar plantuml.jar casos_de_uso.puml
java -jar plantuml.jar diagrama_er.puml
```

## Descripción de los diagramas

### Diagrama de Casos de Uso

Muestra las interacciones entre los actores (Administrador, Vendedor, Sistema) y las funcionalidades del sistema, organizadas por módulos:

- **Módulo de Autenticación**: Login, logout, recuperación de contraseña
- **Módulo de Productos e Inventario**: CRUD de productos, categorías, control de stock
- **Módulo de Ventas**: POS, registro de ventas, comprobantes
- **Módulo de Clientes**: Gestión de clientes, historial, cuentas por cobrar
- **Módulo de Compras**: Proveedores, registro de compras
- **Módulo de Usuarios**: Gestión de usuarios, roles, auditoría
- **Módulo de Reportes**: Reportes de ventas, inventario, dashboard
- **Módulo de Configuración**: Datos del negocio, impuestos

### Diagrama Entidad-Relación

Muestra el modelo de datos propuesto con las siguientes entidades:

| Entidad | Descripción |
|---------|-------------|
| Usuario | Usuarios del sistema (admin, vendedor) |
| Categoria | Categorías de productos |
| Producto | Catálogo de productos |
| Cliente | Información de clientes |
| Proveedor | Información de proveedores |
| Venta | Cabecera de ventas |
| DetalleVenta | Líneas de productos en cada venta |
| Compra | Cabecera de compras/ingresos |
| DetalleCompra | Líneas de productos en cada compra |
| MovimientoInventario | Historial de movimientos de stock |
| CuentaPorCobrar | Ventas a crédito pendientes |
| PagoCuenta | Pagos recibidos de cuentas por cobrar |
| Configuracion | Parámetros del sistema |
| RegistroActividad | Log de auditoría |

## Uso en el documento Word

1. Genera las imágenes en formato PNG (resolución recomendada: 300 DPI)
2. Inserta las imágenes en las secciones correspondientes:
   - Casos de Uso → Capítulo III (Marco Práctico) o Anexos
   - Diagrama ER → Capítulo III (Marco Práctico) o Anexos
3. Agrega un título y número a cada figura
4. Incluye una breve descripción debajo de cada diagrama
