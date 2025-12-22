import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '20px', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '32px' },
    title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
    card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    th: { textAlign: 'left', padding: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
    badge: { padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
}

export default function ActivityLog() {
    const { userData } = useOutletContext() || {}
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userData?.tenantId) return

        // Consultar Movimientos de Stock (Principal fuente de auditoría por ahora)
        // Nota: Firestore composite index might be needed for tenantId + createdAt
        // If fail, we will query by tenantId only and sort in memory for MVP
        const q = query(
            collection(db, 'stock_movements'),
            where('tenantId', '==', userData.tenantId)
        )

        const unsub = onSnapshot(q, snap => {
            const arr = []
            snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
            // Sort in memory to avoid index creation delay
            arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            setLogs(arr.slice(0, 100)) // Limit to last 100
            setLoading(false)
        })

        return () => unsub()
    }, [userData])

    const formatDate = (ts) => {
        if (!ts) return '-'
        return new Date(ts.toDate()).toLocaleString('es-BO')
    }

    const getBadgeColor = (type) => {
        if (type === 'in') return { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' } // Green
        if (type === 'out') return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' } // Red
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }
    }

    const getReasonLabel = (reason) => {
        const map = {
            'sale': 'Venta',
            'purchase': 'Compra',
            'adjustment': 'Ajuste Manual',
            'return': 'Devolución'
        }
        return map[reason] || reason
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>📜 Registro de Actividad</h1>
                <p style={styles.subtitle}>Auditoría de movimientos de inventario y acciones</p>
            </div>

            <div style={styles.card}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando actividad...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No hay registros de actividad recientes</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Acción</th>
                                    <th style={styles.th}>Producto</th>
                                    <th style={styles.th}>Cantidad</th>
                                    <th style={styles.th}>Motivo</th>
                                    <th style={styles.th}>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{formatDate(log.createdAt)}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, ...getBadgeColor(log.type) }}>
                                                {log.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, fontWeight: '600' }}>{log.productName || log.productId}</td>
                                        <td style={{ ...styles.td, fontWeight: '700', fontFamily: 'monospace', fontSize: '15px' }}>
                                            {log.type === 'out' ? '-' : '+'}{Math.abs(log.quantity)}
                                        </td>
                                        <td style={styles.td}>{getReasonLabel(log.reason)} {log.referenceId ? <span style={{ fontSize: '11px', opacity: 0.5 }}>#{log.referenceId.slice(-4)}</span> : ''}</td>
                                        <td style={{ ...styles.td, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{log.createdBy || 'Sistema'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
