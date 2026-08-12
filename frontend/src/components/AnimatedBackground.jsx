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

    // Particle class for cyber constellation nodes & glowing stars
    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 14), 90);

    let mouse = { x: width / 2, y: height / 2, active: false };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const colors = [
      'rgba(246, 196, 83, ', // Gold
      'rgba(139, 92, 246, ', // Purple
      'rgba(6, 182, 212, ',  // Cyan
      'rgba(236, 72, 153, ', // Pink
      'rgba(16, 185, 129, ', // Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.5 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections (constellation lines)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            // Alternate between gold and purple connection lines
            if (i % 2 === 0) {
              ctx.strokeStyle = `rgba(246, 196, 83, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            }
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // Draw & update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse attraction effect
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const force = (200 - dist) / 200;
            p.x += (dx / dist) * force * 1.1;
            p.y += (dy / dist) * force * 1.1;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${p.baseAlpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.colorPrefix + '0.9)';
        ctx.fill();
      });

      // Draw subtle cursor spotlight aura when active
      if (mouse.active) {
        const radGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
        radGrad.addColorStop(0, 'rgba(246, 196, 83, 0.08)');
        radGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 220, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="animated-bg-wrapper">
      {/* Canvas for interactive cyber particle lines */}
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* 6 Floating Ambient Neon Glowing Orbs */}
      <div className="neon-orb orb-1"></div>
      <div className="neon-orb orb-2"></div>
      <div className="neon-orb orb-3"></div>
      <div className="neon-orb orb-4"></div>
      <div className="neon-orb orb-5"></div>
      <div className="neon-orb orb-6"></div>

      {/* Futuristic Blueprint Grid & Dual Sweep Laser Lines */}
      <div className="cyber-grid-overlay"></div>
      <div className="laser-sweep-line"></div>
      <div className="laser-sweep-vertical"></div>
    </div>
  );
}
