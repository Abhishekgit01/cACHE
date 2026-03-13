import React from 'react';

export default function CacheVisualizer({ cacheSize, state = [], steps = [], currentStepIndex = -1 }) {
    // Pad the cache state up to cacheSize to show empty blocks
    const blocks = [...state];
    while (blocks.length < cacheSize) {
        blocks.push(null);
    }

    // Find out what just happened if we have steps
    let hitIndex = -1;
    let missEvictIndex = -1;
    let activeKey = null;

    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        activeKey = step.key;
        if (step.hit) {
            hitIndex = state.indexOf(step.key);
        } else if (step.evicted !== -1) {
            missEvictIndex = state.indexOf(step.key); // Where the new one went
        } else {
            missEvictIndex = state.indexOf(step.key); // Just an insert
        }
    }

    return (
        <div className="card">
            <div className="card-title">Real-Time Cache Blocks</div>
            <div style={{ fontSize: '0.85rem', color: '#8b8b99', marginBottom: '1rem' }}>
                {activeKey !== null ? (
                    <span>Accessing Memory Address: <strong style={{ color: 'white', fontSize: '1rem' }}>{activeKey}</strong></span>
                ) : "Waiting for simulation run..."}
            </div>

            <div className="visualizer-container">
                {blocks.map((val, idx) => {
                    let cName = "cache-block";
                    if (val === null) cName += " empty";
                    else cName += " filled";

                    if (idx === hitIndex) cName += " active-hit";
                    if (idx === missEvictIndex) cName += " active-miss";

                    return (
                        <div key={idx} className={cName}>
                            {val !== null ? val : "-"}
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#8b8b99' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--hit-color)', borderRadius: '2px' }}></div> Hit
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--miss-color)', borderRadius: '2px' }}></div> Miss/Evict
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59,130,246,0.5)', borderRadius: '2px' }}></div> Cached
                </div>
            </div>
        </div>
    );
}
