import React from 'react';

export default function PolicySelector({
    policy, setPolicy,
    cacheSize, setCacheSize,
    workload, setWorkload,
    onRun, isRunning, workloads
}) {
    const policies = [
        { id: 'LRU', label: 'LRU', desc: 'Least Recently Used' },
        { id: 'FIFO', label: 'FIFO', desc: 'First In First Out' },
        { id: 'LFU', label: 'LFU', desc: 'Least Frequently Used' },
        { id: 'LIFO', label: 'LIFO', desc: 'Last In First Out' },
        { id: 'adaptive', label: 'Adaptive', desc: 'Auto-Switching Engine' }
    ];

    return (
        <div className="card">
            <div className="card-title">Simulation Control Panel</div>

            <div style={{ marginBottom: '1.5rem' }}>
                <span className="label">Replacement Policy</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {policies.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPolicy(p.id)}
                            style={{
                                flex: 1,
                                minWidth: '80px',
                                padding: '0.6rem 0.5rem',
                                border: `1px solid ${policy === p.id ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                                background: policy === p.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.3)',
                                color: policy === p.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: policy === p.id ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                            title={p.desc}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <span className="label">Workload Trace Pattern</span>
                <select
                    className="select"
                    value={workload}
                    onChange={e => setWorkload(e.target.value)}
                >
                    {workloads.map(w => (
                        <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)} Workload</option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="label">Cache Capacity (Blocks)</span>
                    <span className="label" style={{ color: 'white', fontWeight: 'bold' }}>{cacheSize}</span>
                </div>
                <input
                    type="range"
                    min="4" max="32" step="4"
                    className="input-range"
                    value={cacheSize}
                    onChange={e => setCacheSize(Number(e.target.value))}
                />
            </div>

            <button className="button-run" onClick={onRun} disabled={isRunning}>
                {isRunning ? 'Running Simulation...' : 'Run Simulation'}
            </button>

            {policy === 'adaptive' && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                        ⚡ Adaptive Engine Active
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        The engine will dynamically analyze memory access patterns (sequential, looping, hotspot) and thrashing rates to auto-switch policies in real time.
                    </p>
                </div>
            )}
        </div>
    );
}
