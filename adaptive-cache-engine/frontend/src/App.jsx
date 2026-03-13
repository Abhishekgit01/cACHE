import React, { useState, useEffect } from 'react';
import PolicySelector from './components/PolicySelector';
import CacheVisualizer from './components/CacheVisualizer';
import Heatmap from './components/Heatmap';
import Charts from './components/Charts';

export default function App() {
    const [policy, setPolicy] = useState('adaptive');
    const [cacheSize, setCacheSize] = useState(8);
    const [workload, setWorkload] = useState('sequential');
    const [workloads, setWorkloads] = useState(['sequential', 'loop', 'random', 'hotspot', 'ml', 'analytics']);

    const [isRunning, setIsRunning] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [policyLog, setPolicyLog] = useState([]);
    const [steps, setSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(-1);

    // Playback timer
    useEffect(() => {
        if (steps.length > 0 && activeStep < steps.length - 1 && isRunning) {
            const timer = setTimeout(() => {
                setActiveStep(prev => prev + 1);
            }, 50); // 50ms per step animation
            return () => clearTimeout(timer);
        } else if (activeStep >= steps.length - 1) {
            setIsRunning(false); // Done animating
        }
    }, [steps, activeStep, isRunning]);

    const runSimulation = async () => {
        setIsRunning(true);
        setMetrics(null);
        setPolicyLog([]);
        setSteps([]);
        setActiveStep(-1);

        try {
            const res = await fetch('http://localhost:3001/run-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policy, cacheSize, workload })
            });
            const data = await res.json();

            setMetrics(data);
            setPolicyLog(data.policyLog);
            setSteps(data.steps);
            setActiveStep(0); // start animation
        } catch (err) {
            console.error(err);
            alert('Error running simulation. Is the API server running on port 3001?');
            setIsRunning(false);
        }
    };

    const currentState = activeStep >= 0 && steps[activeStep] ? steps[activeStep].cacheState : [];
    const currentEnginePolicy = activeStep >= 0 && steps[activeStep] ? steps[activeStep].policy : policy;

    return (
        <div className="dashboard">
            <header className="header">
                <div>
                    <h1 className="title">Self-Adaptive Cache Engine</h1>
                    <p className="subtitle">Real-time memory simulation & dynamic policy switching</p>
                </div>
                <div>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        System Status: {isRunning ? <span style={{ color: 'var(--accent-cyan)' }}>Simulating...</span> : <span style={{ color: 'var(--accent-green)' }}>Ready</span>}
                    </span>
                </div>
            </header>

            <div className="grid-layout">
                {/* Left Column: Controls & Log */}
                <div className="left-panel">
                    <PolicySelector
                        policy={policy} setPolicy={setPolicy}
                        cacheSize={cacheSize} setCacheSize={setCacheSize}
                        workload={workload} setWorkload={setWorkload}
                        workloads={workloads}
                        onRun={runSimulation}
                        isRunning={isRunning}
                    />

                    <div className="card">
                        <div className="card-title">Policy Switch Log</div>
                        <div className="log-container">
                            {policyLog.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                                    No policy switches yet.<br />Run adaptive mode to see logs.
                                </div>
                            ) : (
                                policyLog.map((log, i) => (
                                    <div key={i} className={`log-entry ${log.reason.includes('Thrashing') ? 'thrash' : ''}`}>
                                        <span className="log-time">[Access #{log.index}]</span>
                                        Switched <span className="log-policy">{log.from}</span> → <span className="log-policy">{log.to}</span>
                                        <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            Reason: {log.reason}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Visualizer, Metrics, Charts */}
                <div className="main-panel">

                    <div className="metrics-grid">
                        <div className="metric-box">
                            <div className="label">Current Policy</div>
                            <div className="metric-val purple">{currentEnginePolicy.toUpperCase()}</div>
                        </div>
                        <div className="metric-box">
                            <div className="label">Hit Rate Target: {'>'}75%</div>
                            <div className={`metric-val ${metrics ? (metrics.hitRate > 0.75 ? 'green' : 'red') : ''}`}>
                                {metrics ? (metrics.hitRate * 100).toFixed(1) + '%' : '--'}
                            </div>
                        </div>
                        <div className="metric-box">
                            <div className="label">Latency Simulation</div>
                            <div className="metric-val cyan">
                                {metrics ? metrics.latency.toFixed(1) + 'c' : '--'}
                            </div>
                        </div>
                        <div className="metric-box">
                            <div className="label">Evictions</div>
                            <div className={`metric-val ${metrics && metrics.thrashing ? 'red' : ''}`}>
                                {metrics ? metrics.evictions : '--'}
                            </div>
                        </div>
                    </div>

                    <CacheVisualizer
                        cacheSize={cacheSize}
                        state={currentState}
                        steps={steps}
                        currentStepIndex={activeStep}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <Heatmap frequencyMap={metrics ? metrics.frequencyMap : {}} />
                        <Charts comparison={metrics ? metrics.comparison : null} />
                    </div>

                </div>
            </div>
        </div>
    );
}
