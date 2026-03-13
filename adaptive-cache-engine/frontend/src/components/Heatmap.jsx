import React from 'react';

export default function Heatmap({ frequencyMap = {} }) {
    // Find max frequency for color scaling
    const maxFreq = Math.max(1, ...Object.values(frequencyMap));

    // Determine standard address range (1 to 100 for our workloads)
    const cells = Array.from({ length: 100 }, (_, i) => i + 1);

    const getHeatColor = (freq) => {
        if (!freq || freq === 0) return 'rgba(255, 255, 255, 0.05)';
        // Scale 0.0 to 1.0
        const ratio = freq / maxFreq;

        // HSL: 240 (blue) down to 0 (red)
        const hue = (1.0 - ratio) * 240;
        return `hsl(${hue}, 80%, 50%)`;
    };

    return (
        <div className="card">
            <div className="heatmap-header">
                <div className="card-title" style={{ margin: 0 }}>Memory Block Heatmap</div>
                <div className="heatmap-legend">
                    <span>Cold</span>
                    <div className="gradient-bar"></div>
                    <span>Hot</span>
                </div>
            </div>
            <div className="label">Frequency of address combinations accessed</div>

            <div className="heatmap-grid" style={{ marginTop: '1rem' }}>
                {cells.map(addr => {
                    const freq = frequencyMap[addr] || 0;
                    return (
                        <div
                            key={addr}
                            className="heat-cell"
                            style={{ backgroundColor: getHeatColor(freq) }}
                            title={`Address: ${addr} | Accesses: ${freq}`}
                        >
                            {freq > maxFreq * 0.5 ? addr : ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
