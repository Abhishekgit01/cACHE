import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, HardDrive, TrendingDown, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ComparePanel({ metrics, activePolicy }) {
    if (!metrics || !metrics.comparison || !metrics.comparison['LRU']) return null;

    const baseline = metrics.comparison['LRU'];
    const current = metrics;

    // Real CPU (LRU) vs Us calculation
    const latencySaved = baseline.latency - current.latency;
    const latencySavingsPct = latencySaved > 0 ? ((latencySaved / baseline.latency) * 100).toFixed(1) : 0;

    const evictionsSaved = baseline.evictions - current.evictions;
    const evictionsSavingsPct = evictionsSaved > 0 && baseline.evictions > 0
        ? ((evictionsSaved / baseline.evictions) * 100).toFixed(1)
        : 0;

    // Arbitrary but realistic power model: 1 memory access (RAM) = 50pJ, Cache = 1pJ
    const calculatePower = (hits, misses) => (hits * 1) + (misses * 50);

    const baselineHits = Math.round(baseline.hitRate * metrics.totalAccesses);
    const baselineMisses = metrics.totalAccesses - baselineHits;
    const baselinePower = calculatePower(baselineHits, baselineMisses);

    const currentHits = Math.round(current.hitRate * metrics.totalAccesses);
    const currentMisses = metrics.totalAccesses - currentHits;
    const currentPower = calculatePower(currentHits, currentMisses);

    const powerSaved = baselinePower - currentPower;
    const powerSavingsPct = powerSaved > 0 ? ((powerSaved / baselinePower) * 100).toFixed(1) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card compare-panel"
            style={{ border: '1px solid rgba(16, 185, 129, 0.4)', marginTop: '1.5rem', boxShadow: '0 0 25px rgba(16, 185, 129, 0.1)' }}
        >
            <div className="card-title" style={{ color: 'var(--accent-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} /> VS Real CPU (LRU Baseline) - ROI Dashboard
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, border: '1px solid currentColor', padding: '2px 6px', borderRadius: '4px' }}>
                    LIVE COMPARISON
                </span>
            </div>

            <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>

                {/* SPEED / LATENCY */}
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={16} /> SPEED / LATENCY
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                        {latencySavingsPct > 0 ? `+${latencySavingsPct}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <div>CPU: {baseline.latency} ops</div>
                        <div style={{ color: 'var(--accent-cyan)' }}>Us: {current.latency} ops</div>
                    </div>
                </div>

                {/* POWER / ENERGY */}
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-green)' }}>
                    <div style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={16} /> POWER SAVED
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                        {powerSavingsPct > 0 ? `+${powerSavingsPct}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <div>CPU: {baselinePower} pJ</div>
                        <div style={{ color: 'var(--accent-green)' }}>Us: {currentPower} pJ</div>
                    </div>
                </div>

                {/* STORAGE / I/O */}
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
                    <div style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <HardDrive size={16} /> STORAGE I/O REDUCED
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                        {evictionsSavingsPct > 0 ? `+${evictionsSavingsPct}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <div>CPU: {baseline.evictions} writes</div>
                        <div style={{ color: 'var(--accent-purple)' }}>Us: {current.evictions} writes</div>
                    </div>
                </div>

            </div>

            {/* Conclusion Text */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {latencySaved > 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)' }}>
                        <CheckCircle size={14} /> The Adaptive Engine is outperforming a standard internal CPU cache.
                    </span>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-red)' }}>
                        <AlertTriangle size={14} /> The Adaptive Engine is currently tied or underperforming the base standard CPU.
                    </span>
                )}
            </div>

        </motion.div>
    );
}
