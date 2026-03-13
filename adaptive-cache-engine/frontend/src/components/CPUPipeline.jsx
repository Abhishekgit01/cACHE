import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export default function CPUPipeline({ activeStep, steps }) {
    const currentStep = steps[activeStep] || null;
    const [subStep, setSubStep] = useState(0);

    // Realistic Pipeline State Machine: Cycles through stages within the 400ms heartbeat
    useEffect(() => {
        if (activeStep < 0) {
            setSubStep(0);
            return;
        }

        // Reset subStep on each new activeStep from parent
        setSubStep(0);

        // Cycle through 5 stages manually over 400ms (roughly 75ms per stage)
        const times = [0, 75, 150, 225, 300];
        const timers = times.map((t, i) => setTimeout(() => setSubStep(i), t));

        return () => timers.forEach(t => clearTimeout(t));
    }, [activeStep]);

    const stages = [
        { id: 'IF', label: 'INST_FETCH', desc: 'Fetching 0x' + (currentStep ? currentStep.key.toString(16) : '??') },
        { id: 'ID', label: 'DECODE', desc: 'Analyzing Bus' },
        { id: 'EX', label: 'EXECUTE', desc: 'ALU Signal' },
        { id: 'MEM', label: 'MEMORY', desc: 'Cache Probe' },
        { id: 'WB', label: 'WRITEBACK', desc: 'Commit Result' }
    ];

    return (
        <div className="card cpu-pipeline" style={{ padding: '1rem', minHeight: '130px', background: '#000', border: '1px solid #00ff0033' }}>
            <div className="card-title" style={{ fontSize: '0.75rem', color: '#00ff00', opacity: 0.8, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={14} />
                SILICON_CORE_PIPELINE [v4.2]
                {currentStep && <span style={{ marginLeft: 'auto', background: '#00ff0022', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem' }}>TICK: {activeStep}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 5%' }}>
                {/* Visual Connector Bus */}
                <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '1px', background: '#00ff0022', zIndex: 0 }} />

                {stages.map((stage, i) => {
                    const isActive = subStep === i && currentStep;
                    const isPassed = subStep > i && currentStep;

                    return (
                        <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, width: '18%' }}>
                            <motion.div
                                animate={{
                                    background: isActive ? '#00ff00' : (isPassed ? '#004400' : 'rgba(0,255,0,0.05)'),
                                    scale: isActive ? 1.2 : 1,
                                    borderColor: isActive ? '#fff' : '#00ff0044',
                                    boxShadow: isActive ? '0 0 15px #00ff00' : 'none'
                                }}
                                style={{
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '4px',
                                    border: '1px solid',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: isActive ? '#000' : (isPassed ? '#00ff00' : '#00ff0044'),
                                    fontFamily: 'monospace'
                                }}
                            >
                                {stage.id}
                            </motion.div>
                            <div style={{ fontSize: '0.55rem', textAlign: 'center', color: '#00ff00', opacity: isActive ? 1 : 0.4, fontFamily: 'monospace' }}>
                                {stage.label}
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ color: '#fff', fontSize: '0.5rem', marginTop: '2px' }}
                                    >
                                        [WORKING...]
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {currentStep && (
                <div style={{ marginTop: '1.2rem', padding: '8px', background: '#050505', border: '1px solid #00ff0022', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#00ff00', opacity: 0.8, marginBottom: '4px' }}>
                        <span>BUS_SERIAL_BITSTREAM:</span>
                        <span>HEX: {currentStep.hex}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#00ff00', letterSpacing: '3px', fontWeight: 'bold' }}>
                        {currentStep.binary.split('').map((bit, j) => (
                            <motion.span
                                key={j}
                                animate={{ color: bit === '1' ? '#00ff00' : '#004400', opacity: bit === '1' ? 1 : 0.5 }}
                            >
                                {bit}
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
