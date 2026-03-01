import React from 'react';

const nodes = [
    // Lung outline shape (left side)
    { x: 120, y: 100 }, { x: 90, y: 160 }, { x: 80, y: 230 },
    { x: 100, y: 300 }, { x: 140, y: 340 },
    // Lung outline shape (right side)
    { x: 280, y: 100 }, { x: 310, y: 160 }, { x: 320, y: 230 },
    { x: 300, y: 300 }, { x: 260, y: 340 },
    // Neural network nodes (center)
    { x: 200, y: 130 }, { x: 160, y: 200 }, { x: 240, y: 200 },
    { x: 180, y: 270 }, { x: 220, y: 270 }, { x: 200, y: 340 },
];

const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [5, 6], [6, 7], [7, 8], [8, 9],
    [10, 11], [10, 12], [11, 13], [12, 14],
    [13, 15], [14, 15], [11, 12], [13, 14],
    [0, 10], [5, 10], [4, 15], [9, 15],
];

const NeuralNetwork = () => (
    // Using inline styles/existing classes since Tailwind is not available
    <div style={{
        position: 'relative',
        width: '400px',
        height: '440px',
        /* animation: 'float 6s ease-in-out infinite'  -- Allow parent to control float if needed, or define here */
    }}>
        <svg viewBox="0 0 400 440" style={{ width: '100%', height: '100%' }}>
            {/* Connections */}
            {connections.map(([a, b], i) => (
                <line
                    key={`c-${i}`}
                    x1={nodes[a].x} y1={nodes[a].y}
                    x2={nodes[b].x} y2={nodes[b].y}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1.5}
                    className="animate-pulse-glow"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
            {/* Nodes */}
            {nodes.map((n, i) => (
                <g key={`n-${i}`}>
                    <circle cx={n.x} cy={n.y} r={12} fill="rgba(255,255,255,0.05)" />
                    <circle
                        cx={n.x} cy={n.y} r={5}
                        fill="hsl(180,70%,60%)"
                        className="animate-pulse-glow"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                </g>
            ))}
            {/* Center label */}
            <text x="200" y="220" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontWeight="600" letterSpacing="2">
                X-RAY
            </text>
        </svg>
    </div>
);

export default NeuralNetwork;
