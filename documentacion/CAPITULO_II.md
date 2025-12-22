# CAPÍTULO II
# MARCO TEÓRICO

---

## 2.1 Fundamentación Teórica

El presente capítulo establece las bases teóricas y conceptuales que sustentan la propuesta de un Sistema de Ventas Integral para PYMES. Se abordan conceptos fundamentales de sistemas de información, ingeniería de software, metodologías de desarrollo, tecnologías web y seguridad informática, que constituyen el marco de referencia para el diseño del sistema propuesto.

---

## 2.2 Sistemas de Información

### 2.2.1 Definición

Un **sistema de información** es un conjunto organizado de elementos (personas, datos, actividades, recursos materiales y tecnológicos) que interactúan entre sí para procesar datos y generar información útil para la toma de decisiones en una organización (Laudon & Laudon, 2016).

### 2.2.2 Componentes de un Sistema de Información

1. **Hardware**: Equipos físicos (computadoras, servidores, dispositivos de red).
2. **Software**: Programas y aplicaciones que procesan los datos.
3. **Datos**: Materia prima que se transforma en información.
4. **Procedimientos**: Reglas y políticas que gobiernan la operación del sistema.
5. **Personas**: Usuarios que interactúan con el sistema.
6. **Redes**: Infraestructura de comunicación que conecta los componentes.

### 2.2.3 Clasificación de los Sistemas de Información

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **TPS (Transaction Processing Systems)** | Procesan transacciones diarias del negocio | Sistema de punto de venta |
| **MIS (Management Information Systems)** | Generan reportes para la gestión | Reportes de ventas mensuales |
| **DSS (Decision Support Systems)** | Apoyan la toma de decisiones | Análisis de tendencias de ventas |
| **ERP (Enterprise Resource Planning)** | Integran todos los procesos del negocio | SAP, Odoo |

El sistema propuesto corresponde principalmente a un **TPS con características de MIS**, ya que procesará transacciones de ventas y generará reportes de gestión.

### 2.2.4 Sistemas de Información para la Gestión Comercial

Los sistemas de gestión comercial, también conocidos como sistemas de punto de venta (POS) o sistemas de ventas, son aplicaciones diseñadas para automatizar y controlar las operaciones comerciales de una empresa, incluyendo:

- Registro de ventas y emisión de comprobantes.
- Control de inventario (entradas, salidas, stock).
- Gestión de clientes y proveedores.
- Administración de cuentas por cobrar y pagar.
- Generación de reportes de negocio.

---

## 2.3 Ingeniería de Software

### 2.3.1 Definición

La **ingeniería de software** es la aplicación de un enfoque sistemático, disciplinado y cuantificable al desarrollo, operación y mantenimiento de software (IEEE, 2014). Comprende métodos, herramientas y procedimientos para producir software de calidad.

### 2.3.2 Ciclo de Vida del Software

El ciclo de vida del desarrollo de software (SDLC) comprende las fases por las que atraviesa un proyecto de software:

1. **Análisis de requisitos**: Identificación y documentación de las necesidades del usuario.
2. **Diseño**: Definición de la arquitectura, componentes, interfaces y datos del sistema.
3. **Implementación**: Codificación del software según el diseño.
4. **Pruebas**: Verificación y validación del software.
5. **Despliegue**: Instalación y puesta en producción.
6. **Mantenimiento**: Corrección de errores y mejoras continuas.

### 2.3.3 Calidad del Software

Según la norma ISO/IEC 25010, la calidad del software se mide a través de las siguientes características:

- **Funcionalidad**: El software hace lo que debe hacer.
- **Confiabilidad**: El software mantiene su desempeño bajo condiciones específicas.
- **Usabilidad**: El software es fácil de usar y aprender.
- **Eficiencia**: El software utiliza recursos de manera óptima.
- **Mantenibilidad**: El software puede ser modificado fácilmente.
- **Portabilidad**: El software puede ser transferido a otros entornos.
- **Seguridad**: El software protege la información y los accesos.

---

## 2.4 Metodologías de Desarrollo de Software

### 2.4.1 Modelo en Cascada

El **modelo en cascada** es una metodología secuencial donde cada fase debe completarse antes de iniciar la siguiente. Las fases típicas son: requisitos, diseño, implementación, pruebas, despliegue y mantenimiento.

**Ventajas:**
- Estructura clara y fácil de entender.
- Documentación completa en cada fase.
- Adecuado para proyectos con requisitos bien definidos.

**Desventajas:**
- Poca flexibilidad ante cambios.
- El cliente no ve el producto hasta el final.
- Riesgos se detectan tardíamente.

### 2.4.2 Metodologías Ágiles

Las **metodologías ágiles** son enfoques iterativos e incrementales que priorizan la colaboración, la adaptabilidad y la entrega continua de valor. Se basan en el Manifiesto Ágil (2001).

#### 2.4.2.1 Scrum

**Scrum** es un marco de trabajo ágil que organiza el desarrollo en ciclos cortos llamados **sprints** (generalmente de 2 a 4 semanas).

**Roles en Scrum:**
- **Product Owner**: Representa al cliente, define y prioriza los requisitos.
- **Scrum Master**: Facilita el proceso, elimina impedimentos.
- **Equipo de Desarrollo**: Desarrolladores que construyen el producto.

**Artefactos:**
- **Product Backlog**: Lista priorizada de requisitos del producto.
- **Sprint Backlog**: Tareas seleccionadas para el sprint actual.
- **Incremento**: Producto funcional al final de cada sprint.

**Eventos:**
- **Sprint Planning**: Planificación del sprint.
- **Daily Scrum**: Reunión diaria de 15 minutos.
- **Sprint Review**: Demostración del incremento al cliente.
- **Sprint Retrospective**: Análisis y mejora del proceso.

**Ventajas de Scrum:**
- Flexibilidad ante cambios de requisitos.
- Entregas frecuentes de valor.
- Mayor visibilidad del progreso.
- Colaboración continua con el cliente.

### 2.4.3 Selección de Metodología para el Proyecto

Para el sistema propuesto se recomienda utilizar una **metodología híbrida**:

- **Fase de análisis y diseño**: Enfoque más estructurado (similar a cascada) para documentar requisitos y diseño de manera completa, necesario para la propuesta académica.
- **Fase de implementación (futura)**: Enfoque ágil (Scrum) para el desarrollo iterativo del sistema.

---

## 2.5 Bases de Datos

### 2.5.1 Definición

Una **base de datos** es una colección organizada de datos almacenados y accedidos electrónicamente. Un **Sistema de Gestión de Bases de Datos (SGBD)** es el software que permite crear, administrar y consultar bases de datos.

### 2.5.2 Bases de Datos Relacionales

Las **bases de datos relacionales** organizan los datos en tablas (relaciones) compuestas por filas (registros) y columnas (atributos). Utilizan el **lenguaje SQL** (Structured Query Language) para consultas y manipulación de datos.

**Características:**
- Estructura tabular con relaciones definidas (claves primarias y foráneas).
- Integridad referencial.
- Soporte para transacciones ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad).
- Normalización para evitar redundancia.

**Ejemplos de SGBD relacionales:**
- MySQL
- PostgreSQL
- Microsoft SQL Server
- Oracle Database
- SQLite

### 2.5.3 Bases de Datos NoSQL

Las **bases de datos NoSQL** (Not Only SQL) son sistemas de almacenamiento que no utilizan el modelo relacional tradicional. Son útiles para datos no estructurados, grandes volúmenes o alta escalabilidad.

**Tipos:**
- **Documentales**: Almacenan datos en documentos JSON/BSON (MongoDB, CouchDB).
- **Clave-valor**: Almacenan pares clave-valor (Redis, DynamoDB).
- **Columnares**: Organizan datos por columnas (Cassandra, HBase).
- **Grafos**: Modelan relaciones entre entidades (Neo4j).

### 2.5.4 Selección del Gestor de Base de Datos: MySQL

Para el sistema propuesto se recomienda **MySQL** por las siguientes razones:

| Criterio | MySQL |
|----------|-------|
| **Licencia** | Open source (Community Edition gratuita) |
| **Madurez** | Más de 25 años de desarrollo, ampliamente probado |
| **Rendimiento** | Excelente para aplicaciones web de mediana escala |
| **Soporte** | Gran comunidad, documentación extensa |
| **Integración** | Compatible con todos los lenguajes y frameworks populares |
| **Hosting** | Disponible en la mayoría de servicios de hosting |
| **Herramientas** | phpMyAdmin, MySQL Workbench, DBeaver |

**Alternativa**: PostgreSQL, que ofrece características más avanzadas y es igualmente gratuito y open source.

---

## 2.6 Arquitectura de Aplicaciones Web

### 2.6.1 Modelo Cliente-Servidor

La arquitectura **cliente-servidor** divide la aplicación en dos partes:
- **Cliente**: Interfaz de usuario que se ejecuta en el navegador.
- **Servidor**: Lógica de negocio y acceso a datos que se ejecuta en el servidor.

### 2.6.2 Arquitectura de Tres Capas

La **arquitectura de tres capas** separa la aplicación en:

1. **Capa de Presentación (Frontend)**: Interfaz de usuario, interacción con el usuario.
2. **Capa de Lógica de Negocio (Backend)**: Procesamiento, reglas de negocio, API.
3. **Capa de Datos**: Almacenamiento y acceso a la base de datos.

**Ventajas:**
- Separación de responsabilidades.
- Facilidad de mantenimiento.
- Escalabilidad independiente de cada capa.
- Reutilización de componentes.

### 2.6.3 API REST

Una **API REST** (Representational State Transfer) es una interfaz de programación que permite la comunicación entre el frontend y el backend mediante peticiones HTTP.

**Principios REST:**
- **Recursos identificados por URLs**: `/api/productos`, `/api/ventas`.
- **Operaciones mediante métodos HTTP**: GET (leer), POST (crear), PUT (actualizar), DELETE (eliminar).
- **Sin estado**: Cada petición contiene toda la información necesaria.
- **Respuestas en formato estándar**: Generalmente JSON.

**Ejemplo de endpoints para el sistema de ventas:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/productos | Obtener lista de productos |
| GET | /api/productos/:id | Obtener un producto por ID |
| POST | /api/productos | Crear nuevo producto |
| PUT | /api/productos/:id | Actualizar producto |
| DELETE | /api/productos/:id | Eliminar producto |
| GET | /api/ventas | Obtener lista de ventas |
| POST | /api/ventas | Registrar nueva venta |

---

## 2.7 Lenguajes y Frameworks de Desarrollo

### 2.7.1 Backend

#### 2.7.1.1 PHP y Laravel

**PHP** es un lenguaje de programación de servidor ampliamente utilizado para desarrollo web. **Laravel** es el framework PHP más popular, que proporciona una estructura elegante y herramientas para desarrollo rápido.

**Características de Laravel:**
- Arquitectura MVC (Modelo-Vista-Controlador).
- ORM Eloquent para manejo de base de datos.
- Sistema de migraciones y seeders.
- Autenticación y autorización integradas.
- Sistema de rutas y middlewares.
- Blade como motor de plantillas.

#### 2.7.1.2 Node.js y Express

**Node.js** es un entorno de ejecución de JavaScript en el servidor. **Express** es un framework minimalista para crear APIs y aplicaciones web.

**Características de Node.js/Express:**
- JavaScript en frontend y backend (mismo lenguaje).
- Alto rendimiento para operaciones I/O.
- NPM con miles de paquetes disponibles.
- Ideal para APIs REST y aplicaciones en tiempo real.

### 2.7.2 Frontend

#### 2.7.2.1 React

**React** es una biblioteca de JavaScript desarrollada por Facebook para construir interfaces de usuario. Es actualmente una de las tecnologías frontend más populares.

**Características de React:**
- Componentes reutilizables.
- Virtual DOM para rendimiento optimizado.
- JSX para escribir HTML en JavaScript.
- Estado y props para manejo de datos.
- Ecosistema rico (React Router, Redux, etc.).
- Gran comunidad y documentación.

#### 2.7.2.2 Vue.js

**Vue.js** es un framework progresivo de JavaScript para construir interfaces de usuario. Es conocido por su curva de aprendizaje suave.

**Características de Vue.js:**
- Sistema de componentes.
- Reactividad integrada.
- Vue Router para navegación.
- Vuex para manejo de estado.
- Single File Components (.vue).

### 2.7.3 Frameworks de Diseño CSS

#### 2.7.3.1 Tailwind CSS

**Tailwind CSS** es un framework de CSS utilitario que proporciona clases de bajo nivel para construir diseños personalizados.

**Características:**
- Clases utilitarias (flex, pt-4, text-center, etc.).
- Altamente personalizable.
- Diseño responsivo integrado.
- Tamaño optimizado en producción (purge CSS).
- No impone un diseño predefinido.

**Ejemplo:**
```html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Guardar
</button>
```

#### 2.7.3.2 Bootstrap

**Bootstrap** es el framework CSS más popular, que proporciona componentes prediseñados y un sistema de grillas.

**Características:**
- Componentes listos para usar (botones, modales, tablas, etc.).
- Sistema de grillas de 12 columnas.
- Diseño responsivo.
- Temas y personalización mediante variables SASS.

### 2.7.4 Selección de Tecnologías para el Proyecto

Para el sistema propuesto se recomienda el siguiente stack tecnológico:

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React + Vite | Rendimiento, componentes, gran ecosistema |
| **Estilos** | Tailwind CSS | Flexibilidad, diseño moderno, productividad |
| **Backend** | Node.js + Express (o Laravel) | API REST, escalable, JavaScript fullstack |
| **Base de datos** | MySQL (o PostgreSQL) | Relacional, maduro, gratuito |
| **Autenticación** | JWT (JSON Web Tokens) | Estándar para APIs REST |

---

## 2.8 Seguridad Informática

### 2.8.1 Importancia de la Seguridad en Aplicaciones Web

La seguridad es un aspecto crítico en sistemas que manejan información comercial y datos de clientes. Las principales amenazas incluyen:

- Acceso no autorizado a información sensible.
- Robo de credenciales.
- Inyección SQL y otros ataques.
- Pérdida o corrupción de datos.

### 2.8.2 Principios de Seguridad

1. **Confidencialidad**: Solo usuarios autorizados acceden a la información.
2. **Integridad**: Los datos no son alterados de forma no autorizada.
3. **Disponibilidad**: El sistema está accesible cuando se necesita.

### 2.8.3 Medidas de Seguridad a Implementar

| Área | Medida | Descripción |
|------|--------|-------------|
| **Autenticación** | Hash de contraseñas | Almacenar contraseñas con bcrypt o similar |
| | JWT | Tokens seguros para sesiones |
| | HTTPS | Comunicación cifrada |
| **Autorización** | Roles y permisos | Control de acceso basado en roles (RBAC) |
| **Validación** | Sanitización de inputs | Prevenir inyección SQL y XSS |
| | Validación en servidor | No confiar solo en validación del cliente |
| **Datos** | Backups automáticos | Respaldos periódicos de la base de datos |
| | Cifrado | Datos sensibles cifrados en reposo |

### 2.8.4 OWASP Top 10

El **OWASP Top 10** es una lista de las vulnerabilidades más críticas en aplicaciones web. El sistema propuesto debe considerar mitigaciones para:

1. Inyección (SQL, NoSQL, OS).
2. Autenticación rota.
3. Exposición de datos sensibles.
4. Entidades externas XML (XXE).
5. Control de acceso roto.
6. Configuración de seguridad incorrecta.
7. Cross-Site Scripting (XSS).
8. Deserialización insegura.
9. Uso de componentes con vulnerabilidades conocidas.
10. Registro y monitoreo insuficientes.

---

## 2.9 Control de Versiones

### 2.9.1 Git

**Git** es un sistema de control de versiones distribuido que permite rastrear cambios en el código fuente, colaborar con otros desarrolladores y mantener un historial completo del proyecto.

**Conceptos clave:**
- **Repositorio**: Almacén del código y su historial.
- **Commit**: Instantánea de cambios en un momento dado.
- **Branch**: Rama de desarrollo independiente.
- **Merge**: Fusión de ramas.
- **Pull/Push**: Sincronización con repositorio remoto.

### 2.9.2 GitHub

**GitHub** es una plataforma de hospedaje de repositorios Git que facilita la colaboración, revisión de código y gestión de proyectos.

**Características:**
- Repositorios públicos y privados.
- Issues para seguimiento de tareas y bugs.
- Pull Requests para revisión de código.
- GitHub Actions para integración continua.
- Documentación con GitHub Pages.

### 2.9.3 Flujo de Trabajo con Git

Para el proyecto se recomienda el flujo **Git Flow** simplificado:

- **main**: Rama de producción, código estable.
- **develop**: Rama de desarrollo, integración de features.
- **feature/xxx**: Ramas para nuevas funcionalidades.
- **hotfix/xxx**: Ramas para correcciones urgentes.

---

## 2.10 Herramientas de Desarrollo

### 2.10.1 Entorno de Desarrollo Integrado (IDE)

- **Visual Studio Code**: Editor de código gratuito, extensible, con soporte para múltiples lenguajes. Extensiones recomendadas: ESLint, Prettier, GitLens, Thunder Client.

### 2.10.2 Herramientas de Diseño

- **Figma**: Diseño de interfaces y prototipos interactivos (gratuito para uso personal).
- **Draw.io**: Diagramas UML, ER, flujos (gratuito).

### 2.10.3 Herramientas de Prueba

- **Postman / Thunder Client**: Pruebas de API REST.
- **Jest**: Framework de pruebas para JavaScript.
- **PHPUnit**: Framework de pruebas para PHP.

### 2.10.4 Herramientas de Despliegue

- **Vercel / Netlify**: Hosting para frontend (gratuito para proyectos pequeños).
- **Railway / Render**: Hosting para backend y base de datos.
- **Docker**: Contenedores para entornos consistentes.

---

## 2.11 Análisis de Sistemas Similares

### 2.11.1 TuGerente.com

**TuGerente** es una plataforma boliviana de gestión de inventarios y ventas para PYMES.

**Módulos principales:**
- Inventario (control de stock, almacenes, movimientos).
- Compras (órdenes de compra, proveedores, precios de compra).
- Ventas (clientes, pedidos, puntos de venta).
- Cuentas y Gastos (cuentas por pagar y cobrar).
- Producción (gestión de insumos y procesos productivos).
- Análisis y Reportes (reportes detallados, indicadores de crecimiento).

**Características destacadas:**
- Experiencia 100% online.
- Adaptable a múltiples rubros (comercios, distribuidoras, restaurantes).
- Integraciones con WhatsApp Business y SIAT.
- Resultados reportados: 63% de crecimiento anual, 10-12 horas de ahorro semanal.

**Limitaciones identificadas:**
- Requiere suscripción mensual.
- Dependencia de conexión a Internet.

### 2.11.2 Comparativa de Sistemas

| Característica | TuGerente | Alegra | Odoo | Sistema Propuesto |
|----------------|-----------|--------|------|-------------------|
| Inventario | ✓ | ✓ | ✓ | ✓ |
| Ventas/POS | ✓ | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | ✓ | ✓ |
| Compras | ✓ | ✓ | ✓ | ✓ |
| Reportes | ✓ | ✓ | ✓ | ✓ |
| Facturación electrónica | ✓ | ✓ | ✓ | Futuro |
| Contabilidad | Básica | ✓ | ✓ | No |
| Código abierto | No | No | Sí | Sí |
| Costo | Mensual | Mensual | Variable | Gratuito/bajo |
| Personalización | Media | Baja | Alta | Alta |

### 2.11.3 Valor Agregado del Sistema Propuesto

El sistema propuesto busca diferenciarse por:

1. **Código abierto**: Posibilidad de personalización total según las necesidades del negocio.
2. **Sin costos de suscripción**: Ideal para negocios con recursos limitados.
3. **Simplicidad**: Enfocado en las funciones esenciales, sin complejidad innecesaria.
4. **Tecnologías modernas**: Stack actualizado que facilita el mantenimiento y la escalabilidad.
5. **Adaptabilidad local**: Diseñado considerando las necesidades específicas de PYMES bolivianas.

---

## Referencias Bibliográficas del Capítulo II

- Laudon, K. C., & Laudon, J. P. (2016). *Management Information Systems: Managing the Digital Firm*. Pearson.
- Pressman, R. S. (2014). *Ingeniería del Software: Un Enfoque Práctico*. McGraw-Hill.
- Sommerville, I. (2016). *Software Engineering*. Pearson.
- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*.
- Elmasri, R., & Navathe, S. B. (2016). *Fundamentals of Database Systems*. Pearson.
- OWASP Foundation. (2021). *OWASP Top Ten*.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE)*.
- Documentación oficial de React, Vue.js, Laravel, Node.js, MySQL, Tailwind CSS.

---

**Nota:** Este documento contiene el contenido del Capítulo II (Marco Teórico). Las referencias deben ser formateadas según el estilo requerido por tu universidad (APA, IEEE, etc.).
