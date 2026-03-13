import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';

export default function CacheVisualizer({
    cacheSize,
    currentState = [],
    currentAccess = null,
    title = "3D Silicon Cache Visualizer",
    highlightColor = "var(--accent-cyan)"
}) {
    // Pad the cache state up to cacheSize to show empty blocks
    const blocks = [...currentState];
    while (blocks.length < cacheSize) {
        blocks.push(null);
    }

    // Determine number of columns for the grid based on cacheSize
    const cols = Math.min(cacheSize, 8);

    return (
        <div className="card" style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column', minWidth: '320px' }}>
            <div className="card-title">
                <HardDrive size={18} color={highlightColor} />
                {title}
            </div>

            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '12px',
                padding: '2rem',
                perspective: '800px',
                transformStyle: 'preserve-3d'
            }}>
                {blocks.map((val, i) => {
                    const isActive = val !== null && val === currentAccess;
                    return (
                        <motion.div
                            key={i}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                backgroundColor: val === null ? 'var(--empty-color)' : (isActive ? highlightColor : 'var(--bg-hover)'),
                                translateZ: isActive ? 40 : 0,
                                rotateX: isActive ? -5 : 20,
                                rotateY: isActive ? 5 : -5,
                                boxShadow: isActive ? `0 15px 30px ${highlightColor}44` : 'none'
                            }}
                            className="cache-block"
                            style={{
                                height: '55px',
                                border: `1px solid ${isActive ? highlightColor : 'var(--border-subtle)'}`,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                color: isActive ? '#000' : 'var(--text-primary)',
                                position: 'relative'
                            }}
                        >
                            <span style={{ transform: 'rotateX(-10deg)' }}>{val === null ? '' : val}</span>
                            {isActive && (
                                <motion.div
                                    layoutId={`glow-${title}`}
                                    className="block-glow"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: highlightColor,
                                        filter: 'blur(20px)',
                                        opacity: 0.4,
                                        zIndex: -1
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ marginTop: 'auto', padding: '0.8rem', display: 'flex', gap: '1rem', fontSize: '0.7rem', color: '#8b8b99', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '10px', height: '10px', background: highlightColor, borderRadius: '2px' }}></div> Active
                </div>
                <div style={{ flex: 1, textAlign: 'right', opacity: 0.6 }}>Policy State: Active</div>
            </div>
        </div>
    );
}
