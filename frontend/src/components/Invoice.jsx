import React from 'react'

export function renderInvoiceHTML({ sale, business }) {
  const date = sale.createdAt && sale.createdAt.toDate ? sale.createdAt.toDate().toLocaleString() : (sale.createdAt || '')

  const currencySymbol = (business && business.currencySymbol) || 'Bs'
  const ivaEnabled = business && business.ivaEnabled
  const ivaPercentage = (business && business.ivaPercentage) || 13
  const ivaIncluded = (business && business.ivaIncluded) !== false

  const itemsRows = (sale.items || []).map(it => {
    const name = it.productName || it.name || ''
    const qty = it.quantity || 0
    const price = (it.price || 0).toFixed(2)
    const subtotal = ((it.subtotal != null) ? it.subtotal : (it.price || 0) * qty).toFixed(2)
    return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 8px; color: #334155;">${name}</td>
      <td style="padding: 12px 8px; textAlign: center; color: #64748b;">${qty}</td>
      <td style="padding: 12px 8px; textAlign: right; color: #64748b;">${price}</td>
      <td style="padding: 12px 8px; textAlign: right; font-weight: 600; color: #0f172a;">${subtotal}</td>
    </tr>`
  }).join('')

  const subtotalRaw = sale.amount || 0
  let total = subtotalRaw
  let ivaAmount = 0
  let netAmount = subtotalRaw

  if (ivaEnabled) {
    if (ivaIncluded) {
      // Si IVA incluido: Total = Net + (Net + Rate) -> Net = Total / (1 + Rate)
      netAmount = total / (1 + (ivaPercentage / 100))
      ivaAmount = total - netAmount
    } else {
      // Si IVA NO incluido: Total = Net + (Net * Rate)
      ivaAmount = total * (ivaPercentage / 100)
      total = total + ivaAmount
    }
  }

  const bizName = (business && (business.businessName || business.name)) || 'Mi Negocio'
  const bizNIT = (business && (business.businessNit || business.nit)) || ''
  const bizAddr = (business && (business.businessAddress || business.address)) || 'Dirección no registrada'
  const bizPhone = (business && (business.businessPhone || business.phone)) || ''
  const bizLogo = (business && (business.businessLogo || business.logo)) || ''

  // Logo rendering: Image if available, else initial
  const logoHtml = bizLogo
    ? `<img src="${bizLogo}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`
    : `<div style="width: 48px; height: 48px; background: #eff6ff; color: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800;">
        ${bizName.charAt(0).toUpperCase()}
      </div>`

  return `
  <div id="invoice-root" style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; width: 800px; padding: 40px; box-sizing: border-box; background: #fff; position: relative;">
    
    <!-- Pattern Background Decoration -->
    <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #4f46e5 0%, #0ea5e9 100%);"></div>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div style="display: flex; gap: 16px;">
        ${logoHtml}
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${bizName}</h1>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${bizAddr}</div>
          ${bizNIT ? `<div style="font-size: 13px; color: #64748b;">NIT: ${bizNIT}</div>` : ''}
          ${bizPhone ? `<div style="font-size: 13px; color: #64748b;">Tel: ${bizPhone}</div>` : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Factura de Venta</div>
        <div style="font-size: 18px; font-weight: 700; color: #0f172a;">#${sale.id.slice(-8).toUpperCase()}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${date}</div>
      </div>
    </div>

    <!-- Client & Meta Info Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div>
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Cliente</div>
        <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${sale.clientName || 'Cliente General'}</div>
        <div style="font-size: 13px; color: #64748b;">ID: ${sale.clientId || '-'}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Detalles</div>
        <div style="font-size: 13px; color: #334155;"><strong>Atendido por:</strong> ${sale.createdBy || 'Sistema'}</div>
        <div style="font-size: 13px; color: #334155;"><strong>Método de Pago:</strong> <span style="text-transform: capitalize;">${sale.paymentMethod || 'Efectivo'}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Producto</th>
          <th style="text-align: center; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 80px;">Cant.</th>
          <th style="text-align: right; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 100px;">Precio</th>
          <th style="text-align: right; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 280px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">
          <span>Subtotal</span>
          <span>${netAmount.toFixed(2)}</span>
        </div>
        
        ${ivaEnabled ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">
          <span>IVA (${ivaPercentage}%)</span>
          <span>${ivaAmount.toFixed(2)}</span>
        </div>` : ''}

        <div style="display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; align-items: flex-end;">
          <span style="font-size: 16px; font-weight: 700; color: #0f172a;">Total a Pagar</span>
          <span style="font-size: 24px; font-weight: 800; color: #2563eb;">${currencySymbol} ${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 48px; border-top: 1px dashed #e2e8f0; padding-top: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
      <p style="margin: 0 0 4px 0;">Gracias por su preferencia</p>
      ${business && business.businessSlogan ? `<p style="margin: 0 0 4px 0; font-style: italic;">"${business.businessSlogan}"</p>` : ''}
      <p style="margin: 0;">Este documento no es válido para crédito fiscal salvo indicación contraria.</p>
    </div>

  </div>`
}

export default function Invoice() { return null }
