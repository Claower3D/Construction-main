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

    // Preload Panorama Image
    const bgImage = new Image();
    bgImage.src = '/assets/backgrounds/city_archviz_panorama.jpg';
    let isBgLoaded = false;
    bgImage.onload = () => {
      isBgLoaded = true;
    };

    let mouse = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      isHovered: false,
      shockwaves: []
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovered = true;
    };

    const handleMouseDown = (e) => {
      mouse.shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 8,
        maxRadius: Math.max(width, height) * 0.55,
        alpha: 0.85,
        speed: 7.0
      });
      if (window.sfx) window.sfx.playRadar();
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
    };

    let isMobile = width < 768;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      isMobile = width < 768;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    let tick = 0;

    // ── 1. FLOATING BUILDING DATA BADGES ──
    const buildingBadges = [
      { name: 'ЖК «LIGHTS A1»', sub: '16 эт. | 2023-2024', xR: 0.058, yR: 0.265, color: '#38bdf8' },
      { name: 'ЖК «GRAND TULPAN A2»', sub: '24 эт. | 2022-2025', xR: 0.155, yR: 0.138, color: '#38bdf8' },
      { name: 'ЖК «ARENA A3»', sub: '12 эт. | 2023-2025', xR: 0.232, yR: 0.335, color: '#38bdf8' },
      { name: 'ЖК «GREEN CITY B1»', sub: '16 эт. | 2021-2024', xR: 0.772, yR: 0.335, color: '#00ff88' },
      { name: 'ЖК «GRAND TOWER B2»', sub: '26 эт. | 2022-2025', xR: 0.858, yR: 0.115, color: '#fbbf24' },
      { name: 'ЖК «GRAND PALACE B3»', sub: '20 эт. | 2023-2025', xR: 0.942, yR: 0.220, color: '#38bdf8' }
    ];

    // ── 2. GLOWING TELEMETRY CONDUIT NETWORK (CYAN & GOLD TRACES) ──
    const conduitLines = [
      // Left Circuitry
      {
        id: 'L_PWR_1',
        label: 'ЖС-кабель-2х16',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        width: 2.2,
        points: [
          { xR: 0.058, yR: 0.58 },
          { xR: 0.058, yR: 0.68 },
          { xR: 0.125, yR: 0.68 },
          { xR: 0.125, yR: 0.62 },
          { xR: 0.185, yR: 0.62 },
          { xR: 0.185, yR: 0.74 },
          { xR: 0.280, yR: 0.74 }
        ],
        pulses: [0.15, 0.65],
        speed: 0.08
      },
      {
        id: 'L_NET_1',
        label: 'ВРП-85',
        color: '#00f0ff',
        glow: 'rgba(0, 240, 255, 0.45)',
        width: 2.2,
        points: [
          { xR: 0.155, yR: 0.61 },
          { xR: 0.155, yR: 0.78 },
          { xR: 0.210, yR: 0.78 },
          { xR: 0.210, yR: 0.88 },
          { xR: 0.330, yR: 0.88 },
          { xR: 0.380, yR: 0.93 },
          { xR: 0.500, yR: 0.93 }
        ],
        pulses: [0.25, 0.80],
        speed: 0.09
      },
      // Right Circuitry
      {
        id: 'R_PWR_1',
        label: 'ВРП-82',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.45)',
        width: 2.2,
        points: [
          { xR: 0.942, yR: 0.58 },
          { xR: 0.942, yR: 0.68 },
          { xR: 0.858, yR: 0.68 },
          { xR: 0.858, yR: 0.62 },
          { xR: 0.805, yR: 0.62 },
          { xR: 0.805, yR: 0.74 },
          { xR: 0.720, yR: 0.74 }
        ],
        pulses: [0.18, 0.72],
        speed: 0.08
      },
      {
        id: 'R_NET_1',
        label: 'ВРП-83',
        color: '#00f0ff',
        glow: 'rgba(0, 240, 255, 0.45)',
        width: 2.2,
        points: [
          { xR: 0.858, yR: 0.59 },
          { xR: 0.858, yR: 0.78 },
          { xR: 0.790, yR: 0.78 },
          { xR: 0.790, yR: 0.88 },
          { xR: 0.670, yR: 0.88 },
          { xR: 0.620, yR: 0.93 },
          { xR: 0.500, yR: 0.93 }
        ],
        pulses: [0.30, 0.85],
        speed: 0.09
      },
      // Central Backbone
      {
        id: 'C_BACKBONE',
        label: 'РАСЦЕНКИ • НСИ • СБЕР • САПР',
        color: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.4)',
        width: 2.0,
        points: [
          { xR: 0.35, yR: 0.88 },
          { xR: 0.50, yR: 0.88 },
          { xR: 0.65, yR: 0.88 }
        ],
        pulses: [0.5],
        speed: 0.05
      }
    ];

    // ── 3. PARTICLES & FLOATING GLOW NODES ──
    const particles = [];
    const count = isMobile ? 30 : 70;
    const colorPalette = ['#38bdf8', '#00f0ff', '#fbbf24', '#f59e0b', '#00ff88', '#ffffff'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        color: colorPalette[i % colorPalette.length],
        pulseVal: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02
      });
    }

    // ── DRAW CONDUIT PATH & PULSES ──
    const drawConduit = (c) => {
      ctx.save();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.width;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      c.points.forEach((p, idx) => {
        const px = p.xR * width;
        const py = p.yR * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Traveling glowing pulses
      c.pulses.forEach((_, pIdx) => {
        const t = (tick * c.speed + pIdx * 0.5) % 1.0;
        const totalSegments = c.points.length - 1;
        const exactIndex = t * totalSegments;
        const segIdx = Math.min(Math.floor(exactIndex), totalSegments - 1);
        const segT = exactIndex - segIdx;

        const p1 = c.points[segIdx];
        const p2 = c.points[segIdx + 1];
        const curX = (p1.xR + (p2.xR - p1.xR) * segT) * width;
        const curY = (p1.yR + (p2.yR - p1.yR) * segT) * height;

        ctx.beginPath();
        ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 14;
        ctx.fill();
      });

      // Label at start/mid
      if (c.label) {
        const midP = c.points[Math.floor(c.points.length / 2)];
        ctx.fillStyle = c.color;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.shadowBlur = 4;
        ctx.fillText(c.label, midP.xR * width + 4, midP.yR * height - 6);
      }

      ctx.restore();
    };

    // ── DRAW BUILDING BADGE ──
    const drawBadge = (b) => {
      const bx = b.xR * width;
      const by = b.yR * height;

      ctx.save();
      // Tag background
      ctx.fillStyle = 'rgba(8, 14, 26, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;

      const padX = 10;
      const padY = 6;
      ctx.font = 'bold 9px Inter, sans-serif';
      const textWidth = ctx.measureText(b.name).width;
      const tagW = Math.max(textWidth + 24, 110);
      const tagH = 30;

      ctx.beginPath();
      ctx.roundRect(bx - tagW * 0.5, by - tagH * 0.5, tagW, tagH, 6);
      ctx.fill();
      ctx.stroke();

      // Top title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, bx, by - 2);

      // Subtitle
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px "JetBrains Mono", monospace';
      ctx.fillText(b.sub, bx, by + 9);

      // Blinking Beacon Dot on Building Peak
      const blink = Math.sin(tick * 4 + bx) > 0.2;
      if (blink) {
        ctx.beginPath();
        ctx.arc(bx, by - 18, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // Red aviation warning light
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      ctx.restore();
    };

    // ── MAIN RENDER LOOP ──
    const render = () => {
      tick += 0.016;

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw High-Res Panorama or Deep Sky Fallback
      if (isBgLoaded && bgImage.width > 0) {
        // Draw image covering the entire canvas (cover mode)
        const imgRatio = bgImage.width / bgImage.height;
        const canvasRatio = width / height;
        let drawW, drawH, drawX, drawY;

        if (canvasRatio > imgRatio) {
          drawW = width;
          drawH = width / imgRatio;
          drawX = 0;
          drawY = (height - drawH) * 0.5;
        } else {
          drawH = height;
          drawW = height * imgRatio;
          drawX = (width - drawW) * 0.5;
          drawY = 0;
        }

        ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

        // Dark Atmospheric Vignette Overlay for UI Contrast & Readability
        const vignette = ctx.createLinearGradient(0, 0, 0, height);
        vignette.addColorStop(0.0, 'rgba(8, 12, 22, 0.72)');
        vignette.addColorStop(0.35, 'rgba(8, 12, 22, 0.45)');
        vignette.addColorStop(0.70, 'rgba(8, 12, 22, 0.65)');
        vignette.addColorStop(1.0, 'rgba(8, 12, 22, 0.92)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Center Horizontal Vignette to enhance center text legibility
        const centerVignette = ctx.createRadialGradient(
          width * 0.5, height * 0.45, width * 0.1,
          width * 0.5, height * 0.45, width * 0.65
        );
        centerVignette.addColorStop(0, 'rgba(8, 12, 22, 0.55)');
        centerVignette.addColorStop(1, 'transparent');
        ctx.fillStyle = centerVignette;
        ctx.fillRect(0, 0, width, height);

      } else {
        // High-end Twilight Sky Gradient Fallback
        const sky = ctx.createLinearGradient(0, 0, width, height);
        sky.addColorStop(0, '#0c1022');
        sky.addColorStop(0.5, '#080c16');
        sky.addColorStop(1, '#05070e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Telemetry Conduits (Desktop only)
      if (!isMobile) {
        conduitLines.forEach(c => drawConduit(c));
        buildingBadges.forEach(b => drawBadge(b));
      }

      // 3. Mouse Shockwaves
      mouse.shockwaves.forEach((sw, idx) => {
        sw.radius += sw.speed;
        sw.alpha -= 0.016;

        if (sw.alpha > 0 && sw.radius < sw.maxRadius) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha})`;
          ctx.lineWidth = 2.0;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        } else {
          mouse.shockwaves.splice(idx, 1);
        }
      });

      // 4. Subtle Floating Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulseVal += p.pulseSpeed;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (mDist < 180) {
          const force = (1 - mDist / 180) * 0.8;
          p.x += (mouse.x - p.x) * force * 0.03;
          p.y += (mouse.y - p.y) * force * 0.03;
        }

        const pRad = p.radius + Math.sin(p.pulseVal) * 0.5;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, pRad), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = pRad > 1.6 ? 8 : 0;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
