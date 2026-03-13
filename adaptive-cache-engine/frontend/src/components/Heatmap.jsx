import React from 'react';
import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';

export default function Heatmap({ frequencyMap = {} }) {
    // Find max frequency for color scaling
    const maxFreq = Math.max(1, ...Object.values(frequencyMap));

    // Determine standard address range (1 to 100 for our workloads)
    const cells = Array.from({ length: 100 }, (_, i) => i + 1);

    const getHeatColor = (freq) => {
        if (!freq || freq === 0) return 'rgba(255, 255, 255, 0.03)';
        // Scale 0.0 to 1.0
        const ratio = freq / maxFreq;

        if (ratio < 0.2) return `rgba(59, 130, 246, ${0.1 + ratio})`; // Deep Blue
        if (ratio < 0.4) return `rgba(6, 182, 212, ${0.4 + ratio})`; // Cyan
        if (ratio < 0.6) return `rgba(34, 197, 94, ${0.6 + ratio})`; // Green
        if (ratio < 0.8) return `rgba(234, 179, 8, ${0.8 + ratio})`; // Yellow
        return `rgba(239, 68, 68, 1)`; // Hot Red
    };

    return (
        <div className="card heatmap-panel" style={{ padding: '1rem' }}>
            <div className="heatmap-header" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Waves size={18} color="var(--accent-cyan)" />
                    Dynamic Memory Heatmap
                </div>
                <div className="heatmap-legend" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem' }}>
                    <span style={{ opacity: 0.5 }}>COLD</span>
                    <div style={{
                        width: '100px',
                        height: '6px',
                        background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e, #eab308, #ef4444)',
                        borderRadius: '3px'
                    }} />
                    <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>HOT</span>
                </div>
            </div>

            <div className="heatmap-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(20, 1fr)',
                gap: '4px'
            }}>
                {cells.map(addr => {
                    const freq = frequencyMap[addr] || 0;
                    return (
                        <motion.div
                            key={addr}
                            initial={false}
                            animate={{ backgroundColor: getHeatColor(freq) }}
                            style={{
                                height: '14px',
                                borderRadius: '2px',
                                cursor: 'pointer'
                            }}
                            title={`Address: ${addr} | Accesses: ${freq}`}
                            whileHover={{ scale: 1.5, zIndex: 10, boxShadow: '0 0 10px rgba(255,255,255,0.2)' }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
