import React from 'react';
import './AnimatedBackground.scss';

export default function AnimatedBackground() {
  return (
    <div className="mesh-gradient-bg">
      {/* Dynamic Colorful Mesh Blobs */}
      <div className="mesh-blob blob-1"></div>
      <div className="mesh-blob blob-2"></div>
      <div className="mesh-blob blob-3"></div>
      <div className="mesh-blob blob-4"></div>
      <div className="mesh-blob blob-5"></div>

      {/* Premium Glass & Noise Overlay */}
      <div className="glass-noise-overlay"></div>
      
      {/* Subtle Blueprint Grid (for construction theme) */}
      <div className="mesh-grid"></div>
    </div>
  );
}
