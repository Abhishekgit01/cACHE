import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CyberTerminal({ steps, activeStep, policyLog, baselineSteps = [] }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeStep, steps]);

    // Combine logs up to the activeStep
    const visibleSteps = steps.slice(0, activeStep + 1);

    if (activeStep < 0 && steps.length === 0) {
        return (
            <div className="cyber-terminal" style={{ height: '320px' }}>
                <div className="terminal-header">
                    <span>JARVIS.OS // SYSTEM.IDLE</span>
                    <span className="blinking-cursor">_</span>
                </div>
                <div className="terminal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    AWAITING SIMULATION INSTRUCTIONS...
                </div>
            </div>
        )
    }

    return (
        <div className="cyber-terminal" style={{ height: '450px', background: '#000', border: '1px solid #00ff0033' }}>
            <div className="terminal-header" style={{ background: '#111', color: '#00ff00', borderBottom: '1px solid #00ff0033' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff00', boxShadow: '0 0 8px #00ff00' }}></div>
                    <span>SILICON_KERNEL // MEMORY_ACCESS_MONITOR</span>
                </div>
                <span className="blinking-cursor">_</span>
            </div>
            <div className="terminal-body" ref={scrollRef} style={{ background: '#000', color: '#00ff00', fontFamily: '"Courier New", Courier, monospace' }}>
                <AnimatePresence>
                    {visibleSteps.map((step, idx) => {
                        const logsForStep = policyLog.filter(l => l.index === step.index);

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="terminal-line"
                                style={{
                                    borderLeft: step.hit ? '2px solid #00ff00' : '2px solid #ff0000',
                                    paddingLeft: '12px',
                                    marginBottom: '1.2rem',
                                    borderBottom: '1px solid #00ff0011',
                                    paddingBottom: '0.8rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', opacity: 0.8 }}>
                                    <div>[REQUEST_ID: {step.index.toString().padStart(4, '0')}]</div>
                                    <div>ADDR_BUS: {step.binary}</div>
                                </div>

                                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                    <span style={{ color: '#00ff00' }}>&gt; ACCESS </span>
                                    <span style={{ fontWeight: 'bold' }}>{step.hex}</span>
                                    <span style={{ marginLeft: '12px', color: step.hit ? '#00ff00' : '#ff0000' }}>
                                        {step.hit ? '>> [CACHE_HIT]' : '>> [CACHE_MISS]'}
                                    </span>
                                </div>

                                {!step.hit && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        style={{
                                            background: 'rgba(255, 0, 0, 0.1)',
                                            padding: '4px 8px',
                                            fontSize: '0.7rem',
                                            borderLeft: '2px solid #ff0000',
                                            margin: '8px 0'
                                        }}
                                    >
                                        <div style={{ color: '#ff4444' }}>⚡ PHYSICAL_RAM_FETCH_INITIATED</div>
                                        <div style={{ opacity: 0.7 }}>PATH: CPU_BUS -&gt; NORTHBRIDGE -&gt; DRAM_CONTROLLER</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span>LATENCY_STALL:</span>
                                            <div style={{ flex: 1, height: '4px', background: '#330000' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ height: '100%', background: '#ff0000' }}
                                                />
                                            </div>
                                            <span>{step.latency}ns</span>
                                        </div>
                                    </motion.div>
                                )}

                                {step.hit && (
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7, color: '#00ff00' }}>
                                        L1_SIGNAL: DATA_CARRIER_DETECTED (LATENCY: {step.latency}ns)
                                    </div>
                                )}

                                {logsForStep.length > 0 && (
                                    <div style={{ marginTop: '8px', padding: '6px', border: '1px dashed #00ff0066', borderRadius: '4px' }}>
                                        {logsForStep.map((l, i) => (
                                            <div key={i} style={{ color: '#00ff00', fontSize: '0.7rem' }}>
                                                {`! KERNEL_ADAPT: ${l.reason}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
