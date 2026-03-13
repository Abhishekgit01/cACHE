import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Server, Zap, Clock, Activity, HardDrive, Terminal, Shield, Download } from 'lucide-react';
import PolicySelector from './components/PolicySelector';
import ComparePanel from './components/ComparePanel';
import CacheVisualizer from './components/CacheVisualizer';
import CyberTerminal from './components/CyberTerminal';
import HardwareMetrics from './components/HardwareMetrics';
import CPUPipeline from './components/CPUPipeline';
import Heatmap from './components/Heatmap';
import Charts from './components/Charts';

export default function App() {
    const [policy, setPolicy] = useState('adaptive');
    const [cacheSize, setCacheSize] = useState(4);
    const [workload, setWorkload] = useState('sequential');
    const [customTraceStr, setCustomTraceStr] = useState('');
    const [archTarget, setArchTarget] = useState('cpu');
    const [workloads, setWorkloads] = useState(['sequential', 'loop', 'random', 'hotspot', 'ml', 'analytics', 'custom']);
    const [isPaused, setIsPaused] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const [isRunning, setIsRunning] = useState(false);
    const [sysInfo, setSysInfo] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [steps, setSteps] = useState([]);
    const [baselineSteps, setBaselineSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(-1);
    const [policyLog, setPolicyLog] = useState([]);

    // Phase 15: Fetch System Info
    useEffect(() => {
        const fetchSys = async () => {
            try {
                const res = await fetch('http://localhost:3001/sys-info');
                const data = await res.json();
                setSysInfo(data);
            } catch (e) { }
        };
        fetchSys();
    }, []);

    // Playback timer
    useEffect(() => {
        if (!isRunning || isPaused || steps.length === 0) return;

        if (activeStep < steps.length - 1) {
            const timer = setTimeout(() => {
                setActiveStep(prev => prev + 1);
            }, 400);
            return () => clearTimeout(timer);
        } else if (activeStep >= steps.length - 1 && steps.length > 0) {
            setIsRunning(false);
        }
    }, [steps, activeStep, isRunning, isPaused]);

    const runSimulation = async (overridePolicy, overrideSize, overrideWorkload, overrideArch) => {
        const p = overridePolicy || policy;
        const s = overrideSize || cacheSize;
        const w = overrideWorkload || workload;
        const a = overrideArch || archTarget;

        setIsRunning(true);
        setIsPaused(false); // Ensure not paused when starting new simulation
        setMetrics(null);
        setPolicyLog([]);
        setSteps([]);
        setBaselineSteps([]);
        setActiveStep(-1);

        // Parse custom trace if selected
        let customTrace = [];
        if (w === 'custom') {
            customTrace = customTraceStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            if (customTrace.length === 0) {
                alert("Please enter a valid comma-separated list of numbers for the custom trace.");
                setIsRunning(false);
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3001/run-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policy: p,
                    cacheSize: s,
                    workload: w,
                    archTarget: a,
                    workload: w,
                    archTarget: a,
                    customTrace
                })
            });
            const data = await response.json();

            setMetrics(data);
            setPolicyLog(data.policyLog || []);
            setSteps(data.steps || []);
            setBaselineSteps(data.baselineSteps || []);
            setActiveStep(0); // start animation
        } catch (err) {
            console.error(err);
            alert('Error running simulation. Is the API server running on port 3001?');
            setIsRunning(false);
        }
    };

    // Phase 13: Voice Control
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
            if (command.includes('run') || command.includes('start')) runSimulation();
            if (command.includes('pause') || command.includes('stop')) setIsPaused(true);
            if (command.includes('resume') || command.includes('continue')) setIsPaused(false);
            if (command.includes('adaptive')) setPolicy('adaptive');
        };

        if (isListening) recognition.start();
        else recognition.stop();

        return () => recognition.stop();
    }, [isListening]);

    const handleExport = () => {
        window.open('http://localhost:3001/export-cpp', '_blank');
    };

    const currentState = activeStep >= 0 && steps[activeStep] ? steps[activeStep].cacheState : [];
    const currentEnginePolicy = activeStep >= 0 && steps[activeStep] ? steps[activeStep].policy : policy;

    // Progressive Metrics calculation (Updates as simulation plays)
    const currentSteps = steps.slice(0, activeStep + 1);
    const progressiveMetrics = (() => {
        if (currentSteps.length === 0) return metrics; // Fallback or loading
        const hits = currentSteps.filter(s => s.hit).length;
        const total = currentSteps.length;
        const evictions = currentSteps.filter(s => s.evicted !== -1).length;
        const avgLat = currentSteps.reduce((acc, s) => acc + (s.latency || 0), 0) / total;

        const evRate = evictions / total;
        const isThrashing = evRate > 0.4;

        return {
            ...metrics,
            hitRate: hits / total,
            missRate: (total - hits) / total,
            evictionRate: evRate,
            totalAccesses: total,
            latency: avgLat,
            evictions: evictions,
            coldMisses: currentSteps.filter(s => s.cause?.includes('RAM_FETCH')).length,
            capacityMisses: 0,
            conflictMisses: 0,
            thrashingLevel: isThrashing ? 'Critical' : 'Stable',
            thrashingColor: isThrashing ? '#ff4444' : '#22c55e'
        };
    })();

    const displayMetrics = activeStep >= 0 ? progressiveMetrics : null;

    return (
        <div className="dashboard">
            <header className="header" style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.8rem 2rem' }}>
                <div style={{ zIndex: 10, position: 'relative', width: '100%' }}>
                    <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '2rem' }}>
                        <div className="title-area">
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <Cpu size={28} color="var(--accent-cyan)" />
                                SILICON <span className="cyan">ENGINE</span>
                            </h1>
                            <p className="subtitle" style={{ color: 'rgba(6, 182, 212, 0.6)', fontSize: '0.65rem', margin: 0 }}>HIGH-PRECISION DIGITAL TWIN</p>
                        </div>

                        {/* Phase 20: Minimal Live Hardware HUD */}
                        {sysInfo && (
                            <div className="live-hardware-hud" style={{
                                flex: 1,
                                maxWidth: '600px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '0.5rem 1.2rem',
                                borderRadius: '4px',
                                display: 'flex',
                                gap: '2rem',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>CPU</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>{sysInfo.model.split('@')[0]}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>GPU</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{sysInfo.gpu}</div>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>LOAD </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{sysInfo.load}%</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>RAM </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{sysInfo.usedRAM}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.2' }}>
                                CORE_STATUS<br />
                                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>SYNCHRONIZED</span>
                            </div>
                            <button
                                className={`button-primary ${isRunning ? 'active' : ''}`}
                                onClick={() => runSimulation()}
                                style={{ padding: '0.5rem 1.2rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}
                            >
                                {isRunning ? <div className="spinner" style={{ width: '12px', height: '12px' }}></div> : <Terminal size={14} />}
                                {isRunning ? 'RESTART' : 'START SIMULATION'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>


            <div className="grid-layout">
                {/* Left Column: Controls & Metrics */}
                <div className="left-panel">
                    <div className="card" style={{ marginBottom: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div className="card-title" style={{ fontSize: '0.75rem' }}>
                            <Shield size={14} color="var(--accent-orange)" />
                            SILICON CONFIGURATION [LIVE]
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.5rem 0' }}>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CACHE CAP</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{cacheSize} BLOCKS</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>HIT LATENCY</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>1 CYCLE</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MISS LATENCY</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>{archTarget === 'gpu' ? 500 : 100} CYCLES</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ADDRESS SPACE</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>0x0F (16B)</div>
                            </div>
                        </div>
                    </div>

                    <PolicySelector
                        policy={policy} setPolicy={setPolicy}
                        cacheSize={cacheSize} setCacheSize={setCacheSize}
                        workload={workload} setWorkload={setWorkload}
                        archTarget={archTarget} setArchTarget={setArchTarget}
                        onRun={runSimulation}
                        isRunning={isRunning}
                        workloads={workloads}
                    />

                    {/* Hardware Health & 3Cs */}
                    <HardwareMetrics metrics={displayMetrics} />
                    <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <motion.div whileHover={{ scale: 1.02 }} className="metric-box" style={{ border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                            <div className="label"><Server size={14} style={{ display: 'inline', marginRight: '4px' }} /> Engine</div>
                            <div className="metric-val purple" style={{ fontSize: '1.2rem' }}>{currentEnginePolicy.toUpperCase()}</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} className="metric-box">
                            <div className="label">Simulation Efficiency</div>
                            <div className={`metric-val ${displayMetrics ? (displayMetrics.hitRate > 0.75 ? 'green' : 'red') : ''}`} style={{ fontSize: '1.2rem' }}>
                                {displayMetrics ? (displayMetrics.hitRate * 100).toFixed(1) + '%' : '--'}
                            </div>
                        </motion.div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="metric-box">
                                <div className="metric-label">AVG LATENCY</div>
                                <div className="metric-value" style={{ color: 'var(--accent-orange)' }}>
                                    {displayMetrics ? displayMetrics.latency.toFixed(2) : '0.0'}ns
                                </div>
                            </div>
                            <div className="metric-box">
                                <div className="metric-label">ACTIVE ADDR</div>
                                <div className="metric-value" style={{ fontSize: '0.9rem' }}>
                                    0x{activeStep >= 0 && steps[activeStep] ? steps[activeStep].key.toString(16).toUpperCase() : '----'}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
                                <span>TOTAL RAM ACCESSES</span>
                                <span>{displayMetrics ? displayMetrics.totalAccesses : 0}</span>
                            </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} className="metric-box">
                            <div className="label"><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> Peak Lat</div>
                            <div className="metric-val cyan" style={{ fontSize: '1.2rem' }}>
                                {displayMetrics ? displayMetrics.latency.toFixed(1) : '--'}
                            </div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} className="metric-box">
                            <div className="label"><HardDrive size={14} style={{ display: 'inline', marginRight: '4px' }} /> Evictions</div>
                            <div className={`metric-val ${displayMetrics && displayMetrics.evictions > 0 ? 'red' : ''}`} style={{ fontSize: '1.2rem' }}>
                                {displayMetrics ? displayMetrics.evictions : '--'}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Center Column: Visualizer & Heatmap */}
                <div className="center-panel">
                    {/* Phase 17: CPU Pipeline */}
                    <CPUPipeline activeStep={activeStep} steps={steps} />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
                        <CacheVisualizer
                            title="3D ADAPTIVE ENGINE"
                            cacheSize={cacheSize}
                            currentState={activeStep >= 0 && steps[activeStep] ? steps[activeStep].cacheState : []}
                            currentAccess={activeStep >= 0 && steps[activeStep] ? steps[activeStep].key : null}
                            highlightColor="var(--accent-cyan)"
                        />
                        <CacheVisualizer
                            title="BASELINE LRU (STATIC)"
                            cacheSize={cacheSize}
                            currentState={activeStep >= 0 && baselineSteps[activeStep] ? baselineSteps[activeStep].cacheState : []}
                            currentAccess={activeStep >= 0 && baselineSteps[activeStep] ? baselineSteps[activeStep].key : null}
                            highlightColor="var(--accent-purple)"
                        />
                    </div>
                    <Heatmap frequencyMap={metrics ? metrics.frequencyMap : {}} />
                    <CyberTerminal
                        steps={steps}
                        activeStep={activeStep}
                        policyLog={policyLog}
                        baselineSteps={baselineSteps}
                    />
                </div>

                {/* Right Column: ROI, Logs, Charts */}
                <div className="right-panel">
                    {activeStep === steps.length - 1 && steps.length > 0 && (
                        <ComparePanel metrics={metrics} activePolicy={currentEnginePolicy} />
                    )}

                    {/* Time-Travel Scrubber */}
                    {steps.length > 0 && (
                        <div className="card" style={{ padding: '1rem' }}>
                            <div className="label">Time-Travel Debugger: Step {activeStep}/{steps.length - 1}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    {isPaused ? <Zap size={18} fill="#f59e0b" /> : <Activity size={18} />}
                                </button>
                                <input
                                    type="range"
                                    min="0" max={steps.length - 1}
                                    value={activeStep}
                                    className="input-range"
                                    onChange={(e) => { setIsPaused(true); setActiveStep(parseInt(e.target.value)); }}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    onClick={handleExport}
                                    style={{
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid rgba(139, 92, 246, 0.4)',
                                        padding: '0.4rem 1rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--accent-purple)',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={14} />
                                    EXPORT C++ SOURCE
                                </motion.div>
                            </div>
                        </div>
                    )}

                    <div style={{ height: '350px' }}>
                        <Charts comparison={steps.length > 0 && activeStep === steps.length - 1 ? (metrics ? metrics.comparison : null) : null} />
                    </div>
                </div>
            </div>
        </div>
    );
}
