import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

function showToast(msg, type = 'info') {
    const el = document.createElement('div')
    el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px; font-family: system-ui;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : ''}
    ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;' : ''}
  `
    el.innerHTML = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3500)
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '32px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    header: {
        marginBottom: '32px',
    },
    title: {
        color: 'white',
        fontSize: '28px',
        fontWeight: '700',
        margin: 0,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        marginTop: '4px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
    },
    card: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    cardHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    cardIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
    },
    cardTitle: {
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
    },
    cardDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '13px',
    },
    cardBody: {
        padding: '24px',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    inputLabel: {
        display: 'block',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '8px',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '15px',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
    },
    inputRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    textarea: {
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '15px',
        minHeight: '80px',
        resize: 'vertical',
        boxSizing: 'border-box',
    },
    btn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 24px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s ease',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    btnSecondary: {
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    logoUpload: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        border: '2px dashed rgba(255,255,255,0.1)',
        marginBottom: '20px',
    },
    logoPreview: {
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        overflow: 'hidden',
    },
    logoImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    taxCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    taxInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    taxIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    },
    taxLabel: {
        color: 'white',
        fontWeight: '600',
        marginBottom: '4px',
    },
    taxDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '13px',
    },
    taxInput: {
        width: '100px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '18px',
        fontWeight: '700',
        textAlign: 'center',
    },
    switch: {
        position: 'relative',
        width: '52px',
        height: '28px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '14px',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
    },
    switchActive: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
    },
    switchThumb: {
        position: 'absolute',
        top: '2px',
        left: '2px',
        width: '24px',
        height: '24px',
        background: 'white',
        borderRadius: '12px',
        transition: 'transform 0.2s ease',
    },
    switchThumbActive: {
        transform: 'translateX(24px)',
    },
    previewCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        color: '#1e293b',
        marginTop: '20px',
    },
    previewHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e2e8f0',
    },
    previewLogo: {
        width: '60px',
        height: '60px',
        borderRadius: '8px',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        overflow: 'hidden',
    },
    previewName: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
    },
    previewInfo: {
        fontSize: '13px',
        color: '#64748b',
    },
}

export default function Settings() {
    const navigate = useNavigate()
    const { user, userData } = useOutletContext() || {}

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Business data
    const [businessName, setBusinessName] = useState('')
    const [businessNit, setBusinessNit] = useState('')
    const [businessPhone, setBusinessPhone] = useState('')
    const [businessEmail, setBusinessEmail] = useState('')
    const [businessAddress, setBusinessAddress] = useState('')
    const [businessLogo, setBusinessLogo] = useState('')
    const [businessSlogan, setBusinessSlogan] = useState('')

    // Tax settings
    const [ivaEnabled, setIvaEnabled] = useState(false)
    const [ivaPercentage, setIvaPercentage] = useState(13)
    const [ivaIncluded, setIvaIncluded] = useState(true)

    // Currency
    const [currency, setCurrency] = useState('BOB')
    const [currencySymbol, setCurrencySymbol] = useState('Bs')

    const tenantId = userData?.tenantId
    const isAdmin = userData?.role === 'owner' || userData?.role === 'admin'

    useEffect(() => {
        if (!tenantId) return

        const unsub = onSnapshot(doc(db, 'settings', tenantId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBusinessName(data.businessName || '')
                setBusinessNit(data.businessNit || '')
                setBusinessPhone(data.businessPhone || '')
                setBusinessEmail(data.businessEmail || '')
                setBusinessAddress(data.businessAddress || '')
                setBusinessLogo(data.businessLogo || '')
                setBusinessSlogan(data.businessSlogan || '')
                setIvaEnabled(data.ivaEnabled || false)
                setIvaPercentage(data.ivaPercentage || 13)
                setIvaIncluded(data.ivaIncluded !== false)
                setCurrency(data.currency || 'BOB')
                setCurrencySymbol(data.currencySymbol || 'Bs')
            }
            setLoading(false)
        })

        return () => unsub()
    }, [tenantId])

    const handleLogoUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validaciones
        if (!file.type.startsWith('image/')) {
            showToast('Solo se permiten imágenes', 'error')
            return
        }

        if (file.size > 1024 * 1024) { // 1MB límite inicial
            showToast('La imagen es muy grande. Máximo 1MB', 'error')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                // Redimensionar imagen para que no ocupe mucho espacio en Firestore
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                // Máxima dimensión 300px (suficiente para logo en factura)
                const maxSize = 300
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height
                        height = maxSize
                    }
                }

                canvas.width = width
                canvas.height = height
                ctx.drawImage(img, 0, 0, width, height)

                // Convertir a Base64 comprimido (JPEG calidad 0.7)
                const base64 = canvas.toDataURL('image/jpeg', 0.7)

                setBusinessLogo(base64)
                showToast('Logo procesado correctamente', 'success')
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        if (!isAdmin) {
            showToast('No tienes permisos para modificar', 'error')
            return
        }

        setSaving(true)
        try {
            await setDoc(doc(db, 'settings', tenantId), {
                businessName,
                businessNit,
                businessPhone,
                businessEmail,
                businessAddress,
                businessLogo, // Ahora guarda el string Base64 directamente
                businessSlogan,
                ivaEnabled,
                ivaPercentage: Number(ivaPercentage),
                ivaIncluded,
                currency,
                currencySymbol,
                updatedAt: new Date(),
                updatedBy: user?.email
            }, { merge: true })

            showToast('Configuración guardada', 'success')
        } catch (err) {
            showToast('Error: ' + err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    if (!user || !tenantId) {
        return (
            <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <p>Debes iniciar sesión.</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                    <p>Solo administradores pueden acceder a esta sección.</p>
                    <button style={{ ...styles.btn, ...styles.btnSecondary, marginTop: '16px' }} onClick={() => navigate('/dashboard')}>
                        Ir al Dashboard
                    </button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1s infinite' }}>⚙️</div>
                    <p>Cargando configuración...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, textarea:focus { border-color: #10b981 !important; outline: none; }
      `}</style>

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>⚙️ Configuración</h1>
                <p style={styles.subtitle}>Personaliza los datos de tu negocio y preferencias del sistema</p>
            </div>

            <div style={styles.grid}>
                {/* Business Info Card */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' }}>🏢</div>
                        <div>
                            <div style={styles.cardTitle}>Datos del Negocio</div>
                            <div style={styles.cardDesc}>Información que aparecerá en facturas y comprobantes</div>
                        </div>
                    </div>
                    <div style={styles.cardBody}>
                        {/* Logo Upload */}
                        <div style={styles.logoUpload}>
                            <div style={styles.logoPreview}>
                                {businessLogo ? (
                                    <img src={businessLogo} alt="Logo" style={styles.logoImg} />
                                ) : (
                                    '🏪'
                                )}
                            </div>
                            <div>
                                <div style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>Logo del Negocio</div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="logo-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleLogoUpload}
                                />
                                <label htmlFor="logo-upload" style={{ ...styles.btn, ...styles.btnSecondary, cursor: 'pointer' }}>
                                    📷 Subir Logo
                                </label>
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Nombre del Negocio *</label>
                            <input
                                type="text"
                                style={styles.input}
                                placeholder="Ej: Mi Tienda S.R.L."
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                            />
                        </div>

                        <div style={styles.inputRow}>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>NIT</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    placeholder="Ej: 123456789"
                                    value={businessNit}
                                    onChange={e => setBusinessNit(e.target.value)}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>Teléfono</label>
                                <input
                                    type="tel"
                                    style={styles.input}
                                    placeholder="Ej: 70012345"
                                    value={businessPhone}
                                    onChange={e => setBusinessPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Email</label>
                            <input
                                type="email"
                                style={styles.input}
                                placeholder="contacto@minegocio.com"
                                value={businessEmail}
                                onChange={e => setBusinessEmail(e.target.value)}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Dirección</label>
                            <textarea
                                style={styles.textarea}
                                placeholder="Av. Principal #123, Zona Centro, Santa Cruz"
                                value={businessAddress}
                                onChange={e => setBusinessAddress(e.target.value)}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Slogan (opcional)</label>
                            <input
                                type="text"
                                style={styles.input}
                                placeholder="Ej: Los mejores precios de la ciudad"
                                value={businessSlogan}
                                onChange={e => setBusinessSlogan(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Tax & Currency Card */}
                <div>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))' }}>💰</div>
                            <div>
                                <div style={styles.cardTitle}>Impuestos</div>
                                <div style={styles.cardDesc}>Configuración de IVA</div>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <div style={styles.taxCard}>
                                <div style={styles.taxInfo}>
                                    <div style={styles.taxIcon}>🧾</div>
                                    <div>
                                        <div style={styles.taxLabel}>IVA (Impuesto al Valor Agregado)</div>
                                        <div style={styles.taxDesc}>Aplicar IVA a las ventas</div>
                                    </div>
                                </div>
                                <div
                                    style={{ ...styles.switch, ...(ivaEnabled ? styles.switchActive : {}) }}
                                    onClick={() => setIvaEnabled(!ivaEnabled)}
                                >
                                    <div style={{ ...styles.switchThumb, ...(ivaEnabled ? styles.switchThumbActive : {}) }} />
                                </div>
                            </div>

                            {ivaEnabled && (
                                <>
                                    <div style={{ ...styles.taxCard, flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <div>
                                                <div style={styles.taxLabel}>Porcentaje de IVA</div>
                                                <div style={styles.taxDesc}>Bolivia: 13%</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    style={styles.taxInput}
                                                    value={ivaPercentage}
                                                    onChange={e => setIvaPercentage(e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <span style={{ color: 'white', fontWeight: '700' }}>%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={styles.taxCard}>
                                        <div style={styles.taxInfo}>
                                            <div style={{ ...styles.taxIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' }}>📦</div>
                                            <div>
                                                <div style={styles.taxLabel}>IVA incluido en precios</div>
                                                <div style={styles.taxDesc}>{ivaIncluded ? 'Los precios ya incluyen IVA' : 'Se sumará el IVA al total'}</div>
                                            </div>
                                        </div>
                                        <div
                                            style={{ ...styles.switch, ...(ivaIncluded ? styles.switchActive : {}) }}
                                            onClick={() => setIvaIncluded(!ivaIncluded)}
                                        >
                                            <div style={{ ...styles.switchThumb, ...(ivaIncluded ? styles.switchThumbActive : {}) }} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Currency Card */}
                    <div style={{ ...styles.card, marginTop: '24px' }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))' }}>💱</div>
                            <div>
                                <div style={styles.cardTitle}>Moneda</div>
                                <div style={styles.cardDesc}>Formato de moneda para el sistema</div>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <div style={styles.inputRow}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>Código de Moneda</label>
                                    <select
                                        style={{ ...styles.input, cursor: 'pointer' }}
                                        value={currency}
                                        onChange={e => {
                                            setCurrency(e.target.value)
                                            setCurrencySymbol(e.target.value === 'BOB' ? 'Bs' : e.target.value === 'USD' ? '$' : '€')
                                        }}
                                    >
                                        <option value="BOB" style={{ background: '#1e293b', color: 'white' }}>BOB - Boliviano</option>
                                        <option value="USD" style={{ background: '#1e293b', color: 'white' }}>USD - Dólar</option>
                                        <option value="EUR" style={{ background: '#1e293b', color: 'white' }}>EUR - Euro</option>
                                    </select>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>Símbolo</label>
                                    <input
                                        type="text"
                                        style={{ ...styles.input, textAlign: 'center', fontSize: '20px', fontWeight: '700' }}
                                        value={currencySymbol}
                                        onChange={e => setCurrencySymbol(e.target.value)}
                                        maxLength={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div style={{ ...styles.card, marginTop: '24px' }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' }}>👁️</div>
                            <div>
                                <div style={styles.cardTitle}>Vista Previa</div>
                                <div style={styles.cardDesc}>Así se verá en tus comprobantes</div>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <div style={styles.previewCard}>
                                <div style={styles.previewHeader}>
                                    <div style={styles.previewLogo}>
                                        {businessLogo ? (
                                            <img src={businessLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            '🏪'
                                        )}
                                    </div>
                                    <div>
                                        <div style={styles.previewName}>{businessName || 'Nombre del Negocio'}</div>
                                        <div style={styles.previewInfo}>NIT: {businessNit || '---'}</div>
                                        <div style={styles.previewInfo}>{businessAddress || 'Dirección del negocio'}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>
                                    <p>📞 {businessPhone || '---'} | ✉️ {businessEmail || '---'}</p>
                                    {businessSlogan && <p style={{ fontStyle: 'italic', marginTop: '8px' }}>"{businessSlogan}"</p>}
                                    {ivaEnabled && (
                                        <p style={{ marginTop: '8px', color: '#8b5cf6' }}>
                                            IVA: {ivaPercentage}% {ivaIncluded ? '(incluido)' : '(se suma al total)'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                    style={{ ...styles.btn, ...styles.btnPrimary, padding: '16px 32px', fontSize: '16px' }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
                </button>
            </div>
        </div>
    )
}
