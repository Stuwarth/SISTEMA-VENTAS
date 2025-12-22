# Diseño: Apertura/Cierre de Caja y Auditoría

Objetivo: implementar sesiones de caja profesionales para controlar efectivo y detectar discrepancias o robos.

Colecciones Firestore propuestas:

- `cash_sessions` (top-level)
  - Fields:
    - `tenantId` (string)
    - `openedBy` (string, email)
    - `openedAt` (timestamp)
    - `startBalance` (number) // efectivo inicial en caja
    - `closedBy` (string|null)
    - `closedAt` (timestamp|null)
    - `countedCash` (number|null) // efectivo contado al cierre
    - `expectedCash` (number|null) // calculado al cierre
    - `difference` (number|null) // countedCash - expectedCash
    - `status` (string) // 'open' | 'closed'
    - `notes` (string)

- `cash_movements` (top-level) — registro cronológico de movimientos en caja
  - Fields:
    - `tenantId`, `type` ('ingreso'|'retiro'|'venta'|'diferencia'|'ajuste'),
    - `amount` (number), `reason` (string), `referenceId` (saleId or sessionId),
    - `createdBy`, `createdAt`

- `audit_logs` (top-level)
  - Fields:
    - `tenantId`, `action` (string), `entity` (string), `entityId` (string),
    - `before` (map|null), `after` (map|null), `performedBy`, `timestamp`

Flujos principales:

1. Apertura de caja
   - El usuario autorizado crea una `cash_session` con `startBalance` y `openedAt`.
   - Registrar `audit_logs` y un `cash_movements` tipo `ingreso` con referencia a la sesión.

2. Registro de ventas
   - Las ventas ya existentes se registran en `sales` (ya implementado). Cuando una venta se registra, también añadir un `cash_movements` tipo `venta` con `referenceId = saleId` y `amount` (si `paymentMethod === 'efectivo'`).

3. Movimientos manuales
   - Permitir registrar ingresos/egresos (retiros de caja, ingresos por transferencias diferidas) apuntando a la sesión activa.

4. Cierre de caja
   - Calcular `salesTotal` = suma de ventas en efectivo entre `openedAt` y `now` (por tenant y por sesión).
   - Calcular `movementsTotal` = suma de `cash_movements` tipo ingreso/retiro en el rango.
   - `expectedCash = startBalance + salesTotal + ingresos - retiros`.
   - Usuario introduce `countedCash`; `difference = countedCash - expectedCash`.
   - Registrar cierre: actualizar `cash_sessions` con `closedAt`, `countedCash`, `expectedCash`, `difference`, `closedBy`, `status='closed'`.
   - Registrar `cash_movements` tipo `diferencia` si diferencia != 0.
   - Registrar `audit_logs` con resumen.

5. Arqueos y aprobaciones
   - Permitir exportar informe de cierre y solicitar aprobación de supervisor (rol `owner`/`admin`).
   - En caso de diferencias repetidas o mayores a umbral, crear alerta y bloquear caja hasta investigación.

Seguridad / RNF relevantes:
- Verificar `userData.role` en cliente y en reglas Firestore (`RNF-03`).
- Hacer cierres atómicos con Cloud Function que use `firebase-admin` para evitar manipulaciones desde cliente.
- Mantener `audit_logs` inmutables (no permitir modificaciones, solo append).

Siguientes implementaciones:
- `src/pages/Cashbox.jsx` — UI profesional para apertura/cierre/arqueos.
- `src/utils/cashbox.js` — helpers para crear sesiones, calcular expectedCash y aplicar cierre.
- Cloud Function `closeCashSession` (opcional) para cierre atómico.

Notas: este diseño permite detectar diferencias entre efectivo contado y esperado y dejar trazabilidad completa. Para producción, recomendamos mover el cierre de caja a Cloud Function protegida por IAM.
