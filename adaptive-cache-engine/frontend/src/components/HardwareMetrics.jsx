import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, AlertTriangle, BarChart, Binary, LayoutGrid } from 'lucide-react';

export default function HardwareMetrics({ metrics }) {
    if (!metrics) return (
        <div className="card" style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>
            <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <div>AWAITING SILICON TELEMETRY...</div>
        </div>
    );

    const {
        coldMisses,
        capacityMisses,
        conflictMisses,
        thrashingLevel,
        thrashingColor,
        evictionRate,
        hitRate,
        missRate,
        latency,
        totalAccesses,
        currentPolicy,
        archTarget
    } = metrics;

    const missStats = [
        { label: 'Compulsory (Cold)', value: coldMisses, color: 'var(--accent-cyan)' },
        { label: 'Capacity (Full)', value: capacityMisses, color: 'var(--accent-orange)' },
        { label: 'Conflict (Map)', value: conflictMisses, color: 'var(--accent-red)' }
    ];

    return (
        <div className="card hardware-telemetry" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="var(--accent-cyan)" />
                    Hardware Health & 3Cs Analysis
                </div>
                <div style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    UNIT: {archTarget.toUpperCase()}
                </div>
            </div>

            {/* Performance Matrix Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>HIT RATE</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>{(hitRate * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>MISS RATE</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-red)', fontWeight: 'bold' }}>{(missRate * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>AVG LATENCY</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 'bold' }}>{latency}ns</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                {/* 3Cs Chart Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', opacity: 0.6, marginBottom: '-4px' }}>MISS CLASSIFICATION</div>
                    {missStats.map((stat, i) => (
                        <div key={i} style={{ fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', opacity: 0.8 }}>
                                <span>{stat.label}</span>
                                <span style={{ color: stat.color }}>{stat.value}</span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, totalAccesses > 0 ? (stat.value / totalAccesses) * 300 : 0)}%` }}
                                    style={{ height: '100%', background: stat.color }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* System Health Area */}
                <div style={{
                    borderLeft: '1px solid var(--border-subtle)',
                    paddingLeft: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HEALTH LVL</div>
                        <motion.div
                            animate={{ opacity: (thrashingLevel || 'Stable') === 'Critical' ? [0.4, 1, 0.4] : 1 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: thrashingColor || 'var(--accent-green)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            {thrashingLevel === 'Critical' ? <AlertTriangle size={14} /> : <Shield size={14} />}
                            {((thrashingLevel || 'Stable')).toUpperCase()}
                        </motion.div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>EV RATE</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                            {(evictionRate * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Pattern Analysis Footer */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                    <BarChart size={12} />
                    PATTERN: <span style={{ color: 'white' }}>MIXED/ADAPTIVE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                    <LayoutGrid size={12} />
                    ACTIVE: <span style={{ color: 'var(--accent-cyan)' }}>{currentPolicy}</span>
                </div>
            </div>
        </div>
    );
}
