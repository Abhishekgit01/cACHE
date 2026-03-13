import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Charts({ comparison }) {
    if (!comparison) return <div className="card">Run a simulation to see charts.</div>;

    const data = Object.keys(comparison).map(key => ({
        name: key.toUpperCase(),
        hitRate: comparison[key].hitRate * 100,
        missRate: comparison[key].missRate * 100,
        latency: comparison[key].latency,
        evictions: comparison[key].evictions,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(20,20,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, margin: 0, fontSize: '0.85rem' }}>
                            {entry.name}: {entry.value.toFixed(1)} {entry.name.includes('Rate') ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-title">Policy Performance Comparison</div>

            <div style={{ flex: 1, minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#8b8b99" tick={{ fill: '#8b8b99', fontSize: 12 }} />
                        <YAxis stroke="#8b8b99" tick={{ fill: '#8b8b99', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="hitRate" name="Hit Rate %" fill="var(--hit-color)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="missRate" name="Miss Rate %" fill="var(--miss-color)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, minHeight: '250px', marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#8b8b99" tick={{ fill: '#8b8b99', fontSize: 12 }} />
                        <YAxis stroke="#8b8b99" tick={{ fill: '#8b8b99', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="latency" name="Latency (cycles)" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="evictions" name="Evictions" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
