import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { openCashSession, closeCashSession } from '../utils/cashbox';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ==================== HELPERS ====================

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast-notification toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${msg}</span>`;
  el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;' : ''}
    ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;' : ''}
  `;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100px)'; setTimeout(() => el.remove(), 300); }, 3500);
}

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatTime = (date) => date?.toDate?.().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) || '--:--';

// ==================== STYLES ====================
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '24px 32px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '100px',
    color: '#10b981',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pulsingDot: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
  },
  btnDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '28px',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHighlight: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: '20px',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  cardValue: {
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-1px',
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  section: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  sectionCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '20px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionBody: {
    padding: '24px 28px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  listItemLast: {
    borderBottom: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'rgba(255,255,255,0.4)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: '480px',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    padding: '28px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  modalClose: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '32px',
  },
  modalFooter: {
    padding: '24px 32px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  inputLabel: {
    display: 'block',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  inputBig: {
    fontSize: '32px',
    textAlign: 'center',
    padding: '24px',
  },
  inputHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    marginTop: '10px',
  },
  textarea: {
    width: '100%',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  // Closed state
  closedContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  closedCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '32px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '64px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },
  closedIcon: {
    width: '120px',
    height: '120px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
    borderRadius: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '56px',
    margin: '0 auto 32px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  closedTitle: {
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  closedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  openBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '16px',
    color: 'white',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
    transition: 'all 0.3s ease',
  },
  // Summary box
  summaryBox: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  summaryRowLast: {
    borderBottom: 'none',
    paddingTop: '16px',
    marginTop: '8px',
    borderTop: '2px solid rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
  summaryValue: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#10b981',
  },
  differenceBox: {
    borderRadius: '16px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  differenceIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
};

// ==================== MAIN COMPONENT ====================
export default function Cashbox() {
  const { user, userData } = useOutletContext() || {};
  const navigate = useNavigate();
  const tenantId = userData?.tenantId;

  // State
  const [openSession, setOpenSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openerName, setOpenerName] = useState('');

  // Totals
  const [totals, setTotals] = useState({
    salesTotal: 0,
    salesCount: 0,
    byMethod: { efectivo: 0, tarjeta: 0, qr: 0, credito: 0 },
    expenses: 0,
    expensesList: [],
  });

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Forms
  const [startBalance, setStartBalance] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [closingStep, setClosingStep] = useState(1);

  // ==================== EFFECTS ====================

  // 1. Listen for open session
  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'cash_sessions'), where('tenantId', '==', tenantId), where('status', '==', 'open'));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setOpenSession({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setOpenSession(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tenantId]);

  // 2. Get opener name
  useEffect(() => {
    if (openSession?.openedBy) {
      getDoc(doc(db, 'users', openSession.openedBy)).then(snap => {
        if (snap.exists()) setOpenerName(snap.data().email?.split('@')[0] || 'Usuario');
      });
    }
  }, [openSession?.openedBy]);

  // 3. Calculate totals in real-time
  useEffect(() => {
    if (!openSession || !tenantId) return;

    const sessionStart = openSession.openedAt;

    const salesQ = query(collection(db, 'sales'),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', sessionStart),
      orderBy('createdAt', 'desc')
    );

    const movQ = query(collection(db, 'cash_movements'),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', sessionStart),
      orderBy('createdAt', 'desc')
    );

    const unsubSales = onSnapshot(salesQ, (snap) => {
      const byMethod = { efectivo: 0, tarjeta: 0, qr: 0, credito: 0 };
      let salesTotal = 0;
      let salesCount = 0;

      snap.forEach(doc => {
        const d = doc.data();
        if (d.status === 'canceled') return;
        const method = d.paymentMethod || 'efectivo';
        const amt = Number(d.amount || 0);
        if (byMethod[method] !== undefined) byMethod[method] += amt;
        else byMethod.efectivo += amt;
        salesTotal += amt;
        salesCount++;
      });

      setTotals(prev => ({ ...prev, salesTotal, salesCount, byMethod }));
    });

    const unsubMov = onSnapshot(movQ, (snap) => {
      let expenses = 0;
      const expensesList = [];

      snap.forEach(doc => {
        const d = doc.data();
        const amt = Number(d.amount || 0);
        // IMPORTANTE: 'change' NO es un gasto, es solo devolver el exceso del pago
        // Solo contamos retiros y gastos reales
        if (['retiro', 'withdrawal', 'gasto'].includes(d.type)) {
          expenses += amt;
          expensesList.push({ id: doc.id, ...d });
        }
      });

      setTotals(prev => ({ ...prev, expenses, expensesList }));
    });

    return () => { unsubSales(); unsubMov(); };
  }, [openSession, tenantId]);

  // ==================== HANDLERS ====================

  const handleOpenSession = async (e) => {
    e.preventDefault();
    if (Number(startBalance) < 0) return showToast('Ingresa un monto válido', 'error');
    setLoading(true);
    try {
      await openCashSession({ startBalance: Number(startBalance), notes: 'Apertura de caja' });
      setShowOpenModal(false);
      setStartBalance('');
      showToast('¡Caja abierta exitosamente!', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseReason) return showToast('Completa todos los campos', 'error');
    setLoading(true);
    try {
      await addDoc(collection(db, 'cash_movements'), {
        tenantId,
        type: 'retiro',
        amount: Number(expenseAmount),
        reason: expenseReason,
        createdBy: user?.email,
        createdAt: serverTimestamp(),
        referenceId: openSession?.id || null
      });
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseReason('');
      showToast('Gasto registrado correctamente', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    setLoading(true);
    try {
      await closeCashSession({ sessionId: openSession.id, countedCash: Number(countedCash) });

      // Generate PDF Report before closing
      await generateClosingReport();

      showToast('Caja cerrada correctamente', 'success');
      setShowCloseModal(false);
      setClosingStep(1);
      setCountedCash('');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PDF REPORT GENERATION ====================
  const generateClosingReport = async () => {
    try {
      const [jspdfModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
      const html2canvas = html2canvasModule.default;

      const now = new Date();
      const dateStr = now.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
      const openTime = openSession?.openedAt?.toDate?.()?.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) || '--:--';

      const diffStatus = getDifferenceStatus();
      const diffColor = diffStatus === 'success' ? '#10b981' : diffStatus === 'warning' ? '#f59e0b' : '#ef4444';
      const diffText = diffStatus === 'success' ? 'CUADRADA' : diffStatus === 'warning' ? 'DIFERENCIA MODERADA' : 'DIFERENCIA SIGNIFICATIVA';

      const reportHTML = `
        <div id="report-root" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; width: 800px; padding: 40px; box-sizing: border-box; background: white;">
          
          <!-- Header -->
          <div style="border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a;">CIERRE DE CAJA</h1>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">Reporte de Arqueo Diario</p>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; color: #64748b;">Fecha: <strong style="color: #0f172a;">${dateStr}</strong></div>
                <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Hora de Cierre: <strong style="color: #0f172a;">${timeStr}</strong></div>
              </div>
            </div>
          </div>

          <!-- Session Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Apertura</div>
              <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${openTime}</div>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Responsable</div>
              <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${openerName || user?.email || 'Cajero'}</div>
            </div>
          </div>

          <!-- Financial Summary -->
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
            📊 RESUMEN FINANCIERO
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Fondo Inicial de Caja</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(cashInitial)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">+ Ventas en Efectivo (${totals.salesCount} transacciones)</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #10b981;">+ ${formatCurrency(cashSales)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">- Gastos / Retiros (${totals.expensesList.length} movimientos)</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ef4444;">- ${formatCurrency(cashExpenses)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 16px 12px; font-weight: 700; color: #0f172a; font-size: 16px;">= EFECTIVO ESPERADO EN CAJA</td>
              <td style="padding: 16px 12px; text-align: right; font-weight: 800; color: #0f172a; font-size: 20px;">${formatCurrency(expectedCash)}</td>
            </tr>
          </table>

          <!-- Other Payment Methods -->
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
            💳 VENTAS POR MÉTODO DE PAGO
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px;">
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0;">
              <div style="font-size: 12px; color: #166534;">Efectivo</div>
              <div style="font-size: 18px; font-weight: 700; color: #166534;">${formatCurrency(totals.byMethod.efectivo)}</div>
            </div>
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
              <div style="font-size: 12px; color: #1e40af;">Tarjeta</div>
              <div style="font-size: 18px; font-weight: 700; color: #1e40af;">${formatCurrency(totals.byMethod.tarjeta)}</div>
            </div>
            <div style="background: #faf5ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e9d5ff;">
              <div style="font-size: 12px; color: #7e22ce;">QR</div>
              <div style="font-size: 18px; font-weight: 700; color: #7e22ce;">${formatCurrency(totals.byMethod.qr)}</div>
            </div>
            <div style="background: #fefce8; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #fef08a;">
              <div style="font-size: 12px; color: #a16207;">Crédito</div>
              <div style="font-size: 18px; font-weight: 700; color: #a16207;">${formatCurrency(totals.byMethod.credito)}</div>
            </div>
          </div>

          <!-- Cash Count Comparison -->
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
            🧮 ARQUEO DE CAJA
          </h2>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Esperado</div>
              <div style="font-size: 24px; font-weight: 800; color: #0f172a;">${formatCurrency(expectedCash)}</div>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Contado</div>
              <div style="font-size: 24px; font-weight: 800; color: #0f172a;">${formatCurrency(Number(countedCash))}</div>
            </div>
            <div style="background: ${diffStatus === 'success' ? '#f0fdf4' : diffStatus === 'warning' ? '#fffbeb' : '#fef2f2'}; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid ${diffColor};">
              <div style="font-size: 12px; color: ${diffColor}; text-transform: uppercase; margin-bottom: 8px;">Diferencia</div>
              <div style="font-size: 24px; font-weight: 800; color: ${diffColor};">${difference >= 0 ? '+' : ''}${formatCurrency(difference)}</div>
            </div>
          </div>

          <!-- Status Badge -->
          <div style="background: ${diffStatus === 'success' ? '#f0fdf4' : diffStatus === 'warning' ? '#fffbeb' : '#fef2f2'}; padding: 16px 24px; border-radius: 8px; border: 1px solid ${diffColor}; margin-bottom: 30px; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">${diffStatus === 'success' ? '✅' : diffStatus === 'warning' ? '⚠️' : '❌'}</div>
            <div>
              <div style="font-weight: 700; color: ${diffColor}; font-size: 16px;">CAJA ${diffText}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                ${diffStatus === 'success' ? 'El arqueo coincide con el esperado.' :
          diffStatus === 'warning' ? 'Existe una diferencia moderada. Se recomienda verificar.' :
            'Diferencia significativa detectada. Requiere revisión.'}
              </div>
            </div>
          </div>

          ${totals.expensesList.length > 0 ? `
          <!-- Expenses List -->
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
            📤 DETALLE DE GASTOS / RETIROS
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Motivo</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${totals.expensesList.map(exp => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155;">${exp.reason || 'Sin descripción'}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ef4444;">- ${formatCurrency(exp.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          <!-- Footer -->
          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 12px; color: #94a3b8;">
                Documento generado automáticamente el ${dateStr} a las ${timeStr}
              </div>
              <div style="font-size: 12px; color: #94a3b8;">
                Sistema de Ventas POS
              </div>
            </div>
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
              <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #0f172a; padding-top: 8px; font-size: 12px; color: #64748b;">Firma del Cajero</div>
              </div>
              <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #0f172a; padding-top: 8px; font-size: 12px; color: #64748b;">Firma del Supervisor</div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Create container and render
      const container = document.createElement('div');
      container.style.cssText = 'position: fixed; left: -9999px; top: 0;';
      container.innerHTML = reportHTML;
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cierre_caja_${dateStr.replace(/\//g, '-')}.pdf`);

      document.body.removeChild(container);
      showToast('Reporte PDF generado correctamente', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Error generando PDF: ' + err.message, 'error');
    }
  };

  // ==================== CALCULATIONS ====================

  const cashInitial = Number(openSession?.startBalance || 0);
  const cashSales = totals.byMethod.efectivo;
  const cashExpenses = totals.expenses;
  const expectedCash = cashInitial + cashSales - cashExpenses;
  const difference = (Number(countedCash) || 0) - expectedCash;

  const getDifferenceStatus = () => {
    if (Math.abs(difference) <= 5) return 'success';
    if (Math.abs(difference) <= 20) return 'warning';
    return 'error';
  };

  // ==================== RENDER ====================

  if (loading && !openSession) {
    return (
      <div style={{ ...styles.closedContainer, flexDirection: 'column' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px', animation: 'pulse 1s infinite' }}>💳</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Cargando información de caja...</div>
      </div>
    );
  }

  // ========== CLOSED STATE ==========
  if (!openSession) {
    return (
      <div style={styles.closedContainer}>
        <div style={styles.closedCard}>
          <div style={styles.closedIcon}>💵</div>
          <h1 style={styles.closedTitle}>La Caja está Cerrada</h1>
          <p style={styles.closedText}>
            Para comenzar a registrar ventas y movimientos de efectivo,
            primero debes abrir la caja ingresando el saldo inicial.
          </p>
          <button style={styles.openBtn} onClick={() => setShowOpenModal(true)}>
            <span>🔓</span>
            Abrir Caja
          </button>
        </div>

        {/* Open Modal */}
        {showOpenModal && (
          <div style={styles.modalOverlay} onClick={() => setShowOpenModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Apertura de Caja</h3>
                <button style={styles.modalClose} onClick={() => setShowOpenModal(false)}>×</button>
              </div>
              <form onSubmit={handleOpenSession}>
                <div style={styles.modalBody}>
                  <div style={{ ...styles.closedIcon, width: '80px', height: '80px', fontSize: '40px', marginBottom: '24px' }}>💰</div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Saldo Inicial en Caja (Bs)</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{ ...styles.input, ...styles.inputBig }}
                      placeholder="0.00"
                      value={startBalance}
                      onChange={e => setStartBalance(e.target.value)}
                      autoFocus
                    />
                    <p style={styles.inputHint}>
                      Cuenta el dinero físico disponible en el cajón antes de iniciar operaciones.
                    </p>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button type="button" style={styles.btnSecondary} onClick={() => setShowOpenModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.btnPrimary}>
                    <span>✓</span> Confirmar Apertura
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== OPEN STATE - DASHBOARD ==========
  return (
    <div style={styles.container}>
      {/* Add keyframe animations */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <h1 style={styles.title}>Gestión de Caja</h1>
            <div style={styles.subtitle}>
              📅 {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
              &nbsp;&nbsp;•&nbsp;&nbsp;
              👤 {openerName || 'Cajero'}
              &nbsp;&nbsp;•&nbsp;&nbsp;
              🕐 Desde {formatTime(openSession.openedAt)}
            </div>
          </div>
          <div style={styles.statusBadge}>
            <div style={styles.pulsingDot}></div>
            Caja Abierta
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.btnSecondary} onClick={() => setShowExpenseModal(true)}>
            <span>📤</span> Registrar Gasto
          </button>
          <button style={styles.btnDanger} onClick={() => { setShowCloseModal(true); setClosingStep(1); }}>
            <span>🔒</span> Cerrar Caja
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={styles.grid}>
        {/* Total Sales */}
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)' }}>
            📊
          </div>
          <div style={styles.cardLabel}>Ventas Totales</div>
          <div style={styles.cardValue}>{formatCurrency(totals.salesTotal)}</div>
          <div style={styles.cardMeta}>
            <span style={{ color: '#10b981' }}>↑</span> {totals.salesCount} transacciones
          </div>
        </div>

        {/* Expected Cash */}
        <div style={{ ...styles.card, ...styles.cardHighlight }}>
          <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)' }}>
            💵
          </div>
          <div style={styles.cardLabel}>Efectivo Esperado</div>
          <div style={{ ...styles.cardValue, color: '#10b981' }}>{formatCurrency(expectedCash)}</div>
          <div style={styles.cardMeta}>
            Base: {formatCurrency(cashInitial)} + Ventas: {formatCurrency(cashSales)}
          </div>
        </div>

        {/* Digital Sales */}
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
            💳
          </div>
          <div style={styles.cardLabel}>Ventas Digitales</div>
          <div style={styles.cardValue}>{formatCurrency(totals.byMethod.tarjeta + totals.byMethod.qr)}</div>
          <div style={styles.cardMeta}>
            Tarjeta: {formatCurrency(totals.byMethod.tarjeta)} • QR: {formatCurrency(totals.byMethod.qr)}
          </div>
        </div>

        {/* Expenses */}
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)' }}>
            📤
          </div>
          <div style={styles.cardLabel}>Gastos / Retiros</div>
          <div style={{ ...styles.cardValue, color: '#ef4444' }}>{formatCurrency(totals.expenses)}</div>
          <div style={styles.cardMeta}>
            {totals.expensesList.length} movimientos registrados
          </div>
        </div>
      </div>

      {/* Detail Sections */}
      <div style={styles.section}>
        {/* Expenses List */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <span>📋</span> Últimos Gastos
            </div>
          </div>
          <div style={styles.sectionBody}>
            {totals.expensesList.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <p>No hay gastos registrados en esta sesión</p>
              </div>
            ) : (
              totals.expensesList.slice(0, 5).map((exp, idx) => (
                <div key={exp.id} style={{ ...styles.listItem, ...(idx === totals.expensesList.length - 1 ? styles.listItemLast : {}) }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>{exp.reason}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                      {formatTime(exp.createdAt)} • {exp.createdBy?.split('@')[0]}
                    </div>
                  </div>
                  <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '16px' }}>
                    - {formatCurrency(exp.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Help */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <span>💡</span> Resumen de Caja
            </div>
          </div>
          <div style={styles.sectionBody}>
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>💰 Saldo Inicial</span>
                <span style={styles.summaryValue}>{formatCurrency(cashInitial)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>➕ Ventas en Efectivo</span>
                <span style={{ ...styles.summaryValue, color: '#10b981' }}>+ {formatCurrency(cashSales)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>➖ Gastos / Retiros</span>
                <span style={{ ...styles.summaryValue, color: '#ef4444' }}>- {formatCurrency(cashExpenses)}</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.summaryRowLast }}>
                <span style={{ ...styles.summaryLabel, fontWeight: '600', color: 'white' }}>= Debe haber en caja</span>
                <span style={styles.summaryTotal}>{formatCurrency(expectedCash)}</span>
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6' }}>
              <strong style={{ color: 'white' }}>Recuerda:</strong> Registra cada salida de dinero físico
              usando el botón "Registrar Gasto" para que el cierre cuadre correctamente.
            </div>
          </div>
        </div>
      </div>

      {/* ========== EXPENSE MODAL ========== */}
      {showExpenseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowExpenseModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Registrar Salida de Dinero</h3>
              <button style={styles.modalClose} onClick={() => setShowExpenseModal(false)}>×</button>
            </div>
            <form onSubmit={handleRecordExpense}>
              <div style={styles.modalBody}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Monto (Bs)</label>
                  <input
                    type="number"
                    step="0.50"
                    style={{ ...styles.input, fontSize: '24px', fontWeight: '700' }}
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Motivo del gasto</label>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    placeholder="Ej: Compra de insumos, pago a proveedor..."
                    value={expenseReason}
                    onChange={e => setExpenseReason(e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowExpenseModal(false)}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnDanger}>
                  <span>📤</span> Registrar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== CLOSE MODAL ========== */}
      {showCloseModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: closingStep === 2 ? '560px' : '480px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {closingStep === 1 ? '🔢 Arqueo de Caja' : '📊 Resumen de Cierre'}
              </h3>
              <button style={styles.modalClose} onClick={() => { setShowCloseModal(false); setClosingStep(1); }}>×</button>
            </div>

            <div style={styles.modalBody}>
              {closingStep === 1 && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧮</div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.6' }}>
                      Cuenta <strong style={{ color: 'white' }}>todo el dinero físico</strong> que tienes en la caja
                      (billetes y monedas) e ingresa el total abajo.
                    </p>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Dinero contado (Bs)</label>
                    <input
                      type="number"
                      step="0.50"
                      style={{ ...styles.input, ...styles.inputBig }}
                      placeholder="0.00"
                      value={countedCash}
                      onChange={e => setCountedCash(e.target.value)}
                      autoFocus
                    />
                  </div>
                </>
              )}

              {closingStep === 2 && (
                <>
                  {/* Summary */}
                  <div style={styles.summaryBox}>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>Saldo Inicial</span>
                      <span style={styles.summaryValue}>{formatCurrency(cashInitial)}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>+ Ventas en Efectivo</span>
                      <span style={{ ...styles.summaryValue, color: '#10b981' }}>{formatCurrency(cashSales)}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>- Gastos / Retiros</span>
                      <span style={{ ...styles.summaryValue, color: '#ef4444' }}>{formatCurrency(cashExpenses)}</span>
                    </div>
                    <div style={{ ...styles.summaryRow, ...styles.summaryRowLast }}>
                      <span style={{ ...styles.summaryLabel, fontWeight: '600', color: 'white' }}>Debe haber en caja:</span>
                      <span style={styles.summaryTotal}>{formatCurrency(expectedCash)}</span>
                    </div>
                  </div>

                  {/* Comparison */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ ...styles.summaryBox, textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>TÚ CONTASTE</div>
                      <div style={{ color: 'white', fontSize: '28px', fontWeight: '700' }}>{formatCurrency(Number(countedCash))}</div>
                    </div>
                    <div style={{ ...styles.summaryBox, textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>DIFERENCIA</div>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: getDifferenceStatus() === 'success' ? '#10b981' : getDifferenceStatus() === 'warning' ? '#f59e0b' : '#ef4444'
                      }}>
                        {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                      </div>
                    </div>
                  </div>

                  {/* Status Alert */}
                  <div style={{
                    ...styles.differenceBox,
                    background: getDifferenceStatus() === 'success'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : getDifferenceStatus() === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${getDifferenceStatus() === 'success' ? 'rgba(16, 185, 129, 0.3)' : getDifferenceStatus() === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}>
                    <div style={{
                      ...styles.differenceIcon,
                      background: getDifferenceStatus() === 'success'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : getDifferenceStatus() === 'warning'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                    }}>
                      {getDifferenceStatus() === 'success' ? '✓' : getDifferenceStatus() === 'warning' ? '⚠' : '✕'}
                    </div>
                    <div>
                      <div style={{
                        color: getDifferenceStatus() === 'success' ? '#10b981' : getDifferenceStatus() === 'warning' ? '#f59e0b' : '#ef4444',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}>
                        {getDifferenceStatus() === 'success' ? 'Caja Cuadrada' : getDifferenceStatus() === 'warning' ? 'Diferencia Moderada' : 'Diferencia Significativa'}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                        {getDifferenceStatus() === 'success'
                          ? 'La diferencia está dentro del rango aceptable.'
                          : getDifferenceStatus() === 'warning'
                            ? 'Verifica si hay algún error de conteo.'
                            : 'Se recomienda revisar las transacciones del día.'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              {closingStep === 1 ? (
                <>
                  <button type="button" style={styles.btnSecondary} onClick={() => setShowCloseModal(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btnPrimary, opacity: countedCash ? 1 : 0.5 }}
                    disabled={!countedCash}
                    onClick={() => setClosingStep(2)}
                  >
                    Ver Resumen →
                  </button>
                </>
              ) : (
                <>
                  <button type="button" style={styles.btnSecondary} onClick={() => setClosingStep(1)}>
                    ← Volver a Contar
                  </button>
                  <button type="button" style={styles.btnDanger} onClick={handleCloseSession}>
                    <span>🔒</span> Cerrar Caja
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
