# Sistema de Ventas - MVP (React + Firebase)

Este repositorio contiene un scaffold básico para un MVP de un sistema de ventas multitenant usando React (Vite) y Firebase (Auth + Firestore + Hosting).

Funcionalidades incluidas en el scaffold:
- Autenticación con email/password
- Onboarding para crear un `tenant` (negocio) y guardar `tenantId` en `users/{uid}`
- CRUD básico en Firestore para `products` y `sales` filtrado por `tenantId`
- Reglas de Firestore (en `firestore.rules`) para asegurar separación entre tenants

Pasos para poner en marcha (local):

1) Tener Node.js instalado (>=16)
2) Abrir carpeta `frontend` y ejecutar:

```powershell
cd frontend
npm install
npm run dev
```

3) Crear proyecto en Firebase Console (https://console.firebase.google.com). Habilitar:
   - Authentication (Email/Password)
   - Firestore (modo producción o modo de pruebas según prefieras)
   - Hosting (opcional para desplegar luego)

4) Copiar la configuración de Firebase del proyecto y pegar en `src/firebase.js` reemplazando los placeholders.

5) Subir reglas de seguridad (recomendado usar Firebase CLI):

```powershell
npm install -g firebase-tools
firebase login
firebase init firestore
# selecciona usar las reglas desde firestore.rules
firebase deploy --only firestore
```

6) Inicializar Hosting y desplegar (opcional):

```powershell
firebase init hosting
firebase deploy --only hosting
```

Notas y siguientes pasos sugeridos:
- Implementar Dashboard con reporte de ventas por periodo (CSV export).
- Añadir roles y permisos (admin, vendedor).
- Mejorar UX y estilos con Material UI o Bootstrap.

Si quieres, continúo y:
- Conecto el scaffold a un proyecto Firebase que tú crees (me pegas la config)
- Implemento CRUD avanzado y reportes (si hay tiempo)
