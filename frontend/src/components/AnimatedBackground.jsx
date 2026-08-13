import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Glowing Color Plasma Blobs
    let tick = 0;

    const blobs = [
      { x: 0.15, y: 0.25, r: 0.5, color: 'rgba(168, 85, 247, 0.75)', vx: 0.001, vy: 0.0007 },
      { x: 0.85, y: 0.2, r: 0.55, color: 'rgba(236, 72, 153, 0.75)', vx: -0.0009, vy: 0.0011 },
      { x: 0.5, y: 0.65, r: 0.45, color: 'rgba(6, 182, 212, 0.7)', vx: 0.0012, vy: -0.0008 },
      { x: 0.2, y: 0.85, r: 0.48, color: 'rgba(245, 158, 11, 0.65)', vx: 0.0008, vy: -0.001 },
      { x: 0.8, y: 0.8, r: 0.42, color: 'rgba(16, 185, 129, 0.65)', vx: -0.001, vy: -0.0007 },
      { x: 0.45, y: 0.1, r: 0.52, color: 'rgba(217, 70, 239, 0.7)', vx: -0.0007, vy: 0.0009 }
    ];

    // Star Dust Particles
    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 15), 65);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        radius: Math.random() * 3 + 1.5,
        color: i % 5 === 0 ? '#38bdf8' : (i % 5 === 1 ? '#f472b6' : (i % 5 === 2 ? '#c084fc' : (i % 5 === 3 ? '#fbbf24' : '#34d399'))),
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseVal: Math.random() * Math.PI
      });
    }

    const render = () => {
      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Royal Cyber Background Base
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#0c0724');
      baseGrad.addColorStop(0.4, '#150a36');
      baseGrad.addColorStop(0.7, '#1b072e');
      baseGrad.addColorStop(1, '#060314');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Moving Fluid Color Plasma Blobs
      blobs.forEach((b, idx) => {
        b.x += Math.sin(tick * 0.4 + idx) * b.vx;
        b.y += Math.cos(tick * 0.3 + idx) * b.vy;

        const px = b.x * width;
        const py = b.y * height;
        const rad = b.r * Math.min(width, height);

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Draw Dynamic Sine Waves (Ribbon Aurora Lines)
      ctx.save();
      ctx.lineWidth = 2;
      ctx.globalCompositeOperation = 'screen';

      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const waveColor = w === 0 ? 'rgba(236, 72, 153, 0.35)' : (w === 1 ? 'rgba(6, 182, 212, 0.35)' : 'rgba(168, 85, 247, 0.35)');
        ctx.strokeStyle = waveColor;
        
        for (let x = 0; x < width; x += 15) {
          const y = height * 0.5 + Math.sin(x * 0.004 + tick + w) * 120 + Math.cos(x * 0.002 - tick) * 60;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 4. Draw Connecting Constellation Web
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.45;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            const lineColor = i % 2 === 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // 5. Draw Glowing Star Dust Particles with Pulsing Glow
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulseVal += p.pulseSpeed;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const currentRadius = p.radius + Math.sin(p.pulseVal) * 1.2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 16;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="animated-bg-wrapper">
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* CSS Aurora Mesh Layer */}
      <div className="vibrant-aurora-mesh"></div>

      {/* Cyber Grid */}
      <div className="cyber-grid-overlay"></div>
      <div className="laser-sweep-line"></div>
    </div>
  );
}
