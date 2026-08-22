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

    // Preload Realistic City Panorama Image
    const bgImage = new Image();
    bgImage.src = '/assets/backgrounds/city_archviz_panorama.png';
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

    // ── 1. FLOATING BUILDING DATA BADGES (NEAR ROOF TOPS) ──
    const buildingBadges = [
      { name: 'ЖК «LIGHTS A1»', sub: '16 эт. | 2023-2024', xR: 0.058, yR: 0.245, color: '#38bdf8' },
      { name: 'ЖК «GRAND TULPAN A2»', sub: '24 эт. | 2022-2025', xR: 0.155, yR: 0.125, color: '#38bdf8' },
      { name: 'ЖК «ARENA A3»', sub: '12 эт. | 2023-2025', xR: 0.232, yR: 0.320, color: '#38bdf8' },
      { name: 'ЖК «GREEN CITY B1»', sub: '16 эт. | 2021-2024', xR: 0.772, yR: 0.320, color: '#00ff88' },
      { name: 'ЖК «GRAND TOWER B2»', sub: '26 эт. | 2022-2025', xR: 0.858, yR: 0.110, color: '#fbbf24' },
      { name: 'ЖК «GRAND PALACE B3»', sub: '20 эт. | 2023-2025', xR: 0.942, yR: 0.210, color: '#38bdf8' }
    ];

    // ── 2. GLOWING TELEMETRY CONDUIT NETWORK (NEAT GROUND & FOUNDATION LEVEL LINES) ──
    const conduitLines = [
      // Main Water Line (Cyan) — Connects neatly at building foundations (yR: 0.54)
      {
        id: 'TOWER1_WATER_RISER',
        label: 'ВС-01 (110)',
        color: '#00f0ff',
        glow: 'rgba(0, 240, 255, 0.55)',
        width: 2.4,
        points: [
          { xR: 0.058, yR: 0.54 }, // Foundation base of Tower A1
          { xR: 0.058, yR: 0.72 },
          { xR: 0.125, yR: 0.72 },
          { xR: 0.125, yR: 0.81 },
          { xR: 0.220, yR: 0.81 },
          { xR: 0.280, yR: 0.88 }, // 45-degree angled dip
          { xR: 0.500, yR: 0.88 }, // Central Bridge
          { xR: 0.720, yR: 0.88 },
          { xR: 0.780, yR: 0.81 }, // 45-degree angled rise
          { xR: 0.875, yR: 0.81 },
          { xR: 0.875, yR: 0.72 },
          { xR: 0.942, yR: 0.72 },
          { xR: 0.942, yR: 0.54 }  // Foundation base of Tower B3
        ],
        pulses: [0.10, 0.45, 0.82],
        speed: 0.08
      },

      // Main Electrical Power Line (Golden Amber) — Connects neatly at building foundations (yR: 0.56)
      {
        id: 'TOWER2_PWR_RISER',
        label: 'ЖС-кабель-2х16',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.55)',
        width: 2.4,
        points: [
          { xR: 0.155, yR: 0.56 }, // Foundation base of Tower A2
          { xR: 0.155, yR: 0.65 },
          { xR: 0.080, yR: 0.65 },
          { xR: 0.080, yR: 0.84 },
          { xR: 0.240, yR: 0.84 },
          { xR: 0.300, yR: 0.91 }, // 45-degree angled dip
          { xR: 0.500, yR: 0.91 }, // Central Power Bridge
          { xR: 0.700, yR: 0.91 },
          { xR: 0.760, yR: 0.84 }, // 45-degree angled rise
          { xR: 0.858, yR: 0.84 },
          { xR: 0.858, yR: 0.56 }  // Foundation base of Tower B2
        ],
        pulses: [0.18, 0.62],
        speed: 0.07
      },

      // Left Tower 3 Base Feeder (Tower A3: ЖК «ARENA A3»)
      {
        id: 'TOWER3_FEEDER',
        label: 'ВРП-85 (A3)',
        color: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.45)',
        width: 2.0,
        points: [
          { xR: 0.232, yR: 0.58 }, // Foundation base of Tower A3
          { xR: 0.232, yR: 0.72 },
          { xR: 0.185, yR: 0.72 },
          { xR: 0.185, yR: 0.81 }
        ],
        pulses: [0.35, 0.85],
        speed: 0.1
      },

      // Right Tower 4 Base Feeder (Tower B1: ЖК «GREEN CITY B1»)
      {
        id: 'TOWER4_FEEDER',
        label: 'ВРП-83 (B1)',
        color: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.45)',
        width: 2.0,
        points: [
          { xR: 0.772, yR: 0.58 }, // Foundation base of Tower B1
          { xR: 0.772, yR: 0.72 },
          { xR: 0.820, yR: 0.72 },
          { xR: 0.820, yR: 0.81 }
        ],
        pulses: [0.25, 0.75],
        speed: 0.1
      }
    ];

    // ── 3. JUNCTION UTILITY TERMINAL NODES AT EACH BUILDING FOUNDATION ──
    const utilityNodes = [
      { xR: 0.058, yR: 0.54, label: 'Ввод A1', color: '#00f0ff' },
      { xR: 0.155, yR: 0.56, label: '⚡ ГРЩ A2', color: '#f59e0b' },
      { xR: 0.232, yR: 0.58, label: 'Ввод A3', color: '#38bdf8' },
      { xR: 0.772, yR: 0.58, label: 'Ввод B1', color: '#38bdf8' },
      { xR: 0.858, yR: 0.56, label: '⚡ ГРЩ B2', color: '#f59e0b' },
      { xR: 0.942, yR: 0.54, label: 'Ввод B3', color: '#00f0ff' },

      // Ground Junctions
      { xR: 0.125, yR: 0.72, label: 'КК-1 (L1)', color: '#00f0ff' },
      { xR: 0.080, yR: 0.84, label: '⚡ ТП-1', color: '#f59e0b' },
      { xR: 0.875, yR: 0.72, label: 'КК-11 (R3)', color: '#00f0ff' },
      { xR: 0.858, yR: 0.84, label: '⚡ ТП-2', color: '#f59e0b' }
    ];

    // ── 4. PARTICLES ──
    const particles = [];
    const count = isMobile ? 30 : 60;
    const colorPalette = ['#38bdf8', '#00f0ff', '#fbbf24', '#f59e0b', '#00ff88', '#ffffff'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.6 + 0.8,
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
      ctx.shadowBlur = 12;
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
        ctx.arc(curX, curY, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 16;
        ctx.fill();
      });

      // Label at start/mid
      if (c.label && c.id !== 'TOWER1_WATER_RISER' && c.id !== 'TOWER2_PWR_RISER') {
        const midP = c.points[Math.floor(c.points.length / 3)];
        ctx.fillStyle = c.color;
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.shadowBlur = 4;
        ctx.fillText(c.label, midP.xR * width + 5, midP.yR * height - 6);
      }

      ctx.restore();
    };

    // ── DRAW CENTRAL BACKBONE TAG (— РАСЦЕНКИ • НСИ • СБЕР • САПР —) ──
    const drawCentralBackboneTag = () => {
      const cx = width * 0.5;
      const cy = height * 0.88;

      ctx.save();
      const text = '— РАСЦЕНКИ • НСИ • СБЕР • САПР —';
      ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(text).width;

      const tagW = textWidth + 20;
      const tagH = 18;

      // Dark capsule background
      ctx.fillStyle = 'rgba(6, 10, 18, 0.92)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.roundRect(cx - tagW * 0.5, cy - tagH * 0.5, tagW, tagH, 9);
      ctx.fill();
      ctx.stroke();

      // Glowing text
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 6;
      ctx.fillText(text, cx, cy);

      ctx.restore();
    };

    // ── DRAW UTILITY NODES ──
    const drawUtilityNode = (node) => {
      const nx = node.xR * width;
      const ny = node.yR * height;

      ctx.save();
      const pulse = (Math.sin(tick * 3.5 + node.xR * 20) + 1) * 0.5;

      ctx.beginPath();
      ctx.arc(nx, ny, 4.5 + pulse * 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(node.label, nx + 8, ny + 3);

      ctx.restore();
    };

    // ── DRAW BUILDING BADGE ──
    const drawBadge = (b) => {
      const bx = b.xR * width;
      const by = b.yR * height;

      ctx.save();
      // Tag background
      ctx.fillStyle = 'rgba(8, 14, 26, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;

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

      // Blinking Beacon Dot
      const blink = Math.sin(tick * 4 + bx) > 0.2;
      if (blink) {
        ctx.beginPath();
        ctx.arc(bx, by - 16, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
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

        // Dark Atmospheric Vignette Overlay
        const vignette = ctx.createLinearGradient(0, 0, 0, height);
        vignette.addColorStop(0.0, 'rgba(6, 10, 18, 0.65)');
        vignette.addColorStop(0.35, 'rgba(6, 10, 18, 0.35)');
        vignette.addColorStop(0.70, 'rgba(6, 10, 18, 0.55)');
        vignette.addColorStop(1.0, 'rgba(6, 10, 18, 0.88)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Center Horizontal Vignette
        const centerVignette = ctx.createRadialGradient(
          width * 0.5, height * 0.45, width * 0.1,
          width * 0.5, height * 0.45, width * 0.65
        );
        centerVignette.addColorStop(0, 'rgba(6, 10, 18, 0.45)');
        centerVignette.addColorStop(1, 'transparent');
        ctx.fillStyle = centerVignette;
        ctx.fillRect(0, 0, width, height);

      } else {
        const sky = ctx.createLinearGradient(0, 0, width, height);
        sky.addColorStop(0, '#0c1022');
        sky.addColorStop(0.5, '#080c16');
        sky.addColorStop(1, '#05070e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Telemetry Conduits, Central Bridge & Nodes (Desktop only)
      if (!isMobile) {
        conduitLines.forEach(c => drawConduit(c));
        drawCentralBackboneTag();
        utilityNodes.forEach(n => drawUtilityNode(n));
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
