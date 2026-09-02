import React, { useState, useEffect } from 'react';
import './LiveAIScannerDemo.scss';

export default function OrganicBlueprintVisualizer({ activeSample, isScanning }) {
  const [nodes, setNodes] = useState([]);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    // Generate organic/architectural nodes and connections based on the active sample
    const seed = activeSample * 10;
    const newNodes = [];
    const newPaths = [];
    
    // Abstract architectural shapes
    const count = 12 + (activeSample % 3) * 4;
    for (let i = 0; i < count; i++) {
      newNodes.push({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 2 + Math.random() * 6,
        pulse: Math.random() > 0.5,
        type: ['sensor', 'structural', 'node'][Math.floor(Math.random() * 3)]
      });
    }

    for (let i = 0; i < count - 1; i++) {
      for(let j = i + 1; j < count; j++) {
        if(Math.random() > 0.75) {
          newPaths.push({
            id: `${i}-${j}`,
            from: newNodes[i],
            to: newNodes[j],
            active: Math.random() > 0.6
          });
        }
      }
    }
    
    setNodes(newNodes);
    setPaths(newPaths);
  }, [activeSample]);

  return (
    <div className="organic-blueprint-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 50%, #0a1324 0%, #030712 100%)' }}>
      {/* Background organic grid */}
      <div className="organic-grid" style={{ 
        position: 'absolute', inset: 0, 
        backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.07) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: 'center center',
        opacity: 0.8
      }}></div>

      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.2)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.8)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw connections */}
        {paths.map(p => (
          <path 
            key={p.id}
            d={`M ${p.from.x}% ${p.from.y}% L ${p.to.x}% ${p.to.y}%`}
            stroke={p.active || isScanning ? "url(#pathGradient)" : "rgba(255,255,255,0.05)"}
            strokeWidth={p.active && isScanning ? "2" : "1"}
            fill="none"
            className={isScanning ? "scanning-path" : ""}
            style={{
              strokeDasharray: p.active ? "5,5" : "none",
              animation: p.active && isScanning ? "dash 2s linear infinite" : "none"
            }}
          />
        ))}

        {/* Draw organic nodes */}
        {nodes.map(n => (
          <g key={n.id}>
            {n.pulse && (
               <circle 
                 cx={`${n.x}%`} 
                 cy={`${n.y}%`} 
                 r={n.size * 2.5} 
                 fill="rgba(56, 189, 248, 0.15)"
                 className={isScanning ? "pulse-circle-fast" : "pulse-circle-slow"}
               />
            )}
            <circle 
              cx={`${n.x}%`} 
              cy={`${n.y}%`} 
              r={n.size} 
              fill={n.type === 'structural' ? "#0ea5e9" : n.type === 'sensor' ? "#10b981" : "#f59e0b"}
              filter="url(#glow)"
            />
            {n.size > 4 && (
              <text x={`${n.x + 2}%`} y={`${n.y - 2}%`} fill="rgba(255,255,255,0.4)" fontSize="10px" fontFamily="monospace">
                N-{n.id}:{Math.round(n.x)}
              </text>
            )}
          </g>
        ))}
        
        {/* Scanning laser overlay */}
        {isScanning && (
          <rect 
            x="0" y="0" width="100%" height="100%" 
            fill="rgba(56, 189, 248, 0.05)"
            className="scanner-flash"
          />
        )}
      </svg>
      
      {/* HUD Overlays */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 20, display: 'flex', gap: '15px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
           <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</div>
           <div style={{ color: isScanning ? '#10b981' : '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}>
             {isScanning ? 'ANALYZING TOPOLOGY...' : 'IDLE / READY'}
           </div>
        </div>
      </div>
    </div>
  );
}
