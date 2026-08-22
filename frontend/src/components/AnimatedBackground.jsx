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
    let isMobile = width < 768;

    // ── 1. 3D STRUCTURAL PARTICLES ──
    const count = isMobile ? Math.min(Math.floor((width * height) / 18000), 40) : Math.min(Math.floor((width * height) / 12000), 100);
    const particles = [];
    const colorPalette = ['#38bdf8', '#60a5fa', '#34d399', '#fbbf24', '#f59e0b', '#a855f7', '#ffffff'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2.0 + 1.0,
        color: colorPalette[i % colorPalette.length],
        pulseVal: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02
      });
    }

    // ── 2. SHOOTING METEORS ──
    const comets = [];
    const spawnComet = () => {
      if (comets.length < 3 && Math.random() < 0.025) {
        comets.push({
          x: Math.random() * width * 0.8 + width * 0.1,
          y: -20,
          vx: (Math.random() - 0.3) * 6 - 2,
          vy: Math.random() * 7 + 5,
          length: Math.random() * 90 + 50,
          alpha: 0.9,
          color: Math.random() > 0.4 ? '#38bdf8' : '#fbbf24'
        });
      }
    };

    // ── 3. REALISTIC ARCHITECTURAL RESIDENTIAL BUILDINGS & SKYSCRAPERS ──
    // Deterministic random seed for consistent window lighting
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const cityBuildings = [
      // Left Cluster (L1, L2, L3) — SUBTLE VIOLET DAWN (МЯГКИЙ ФИОЛЕТОВЫЙ РАССВЕТ)
      { 
        id: 'L1', name: 'ЖК «ТАУЭР А1»', subName: '18 ЭТАЖЕЙ • ЖИЛОЙ КОМПЛЕКС', 
        xR: 0.025, yR: 0.58, w: 105, h: 260, floors: 18, cols: 5, 
        spire: 40, hasBalconies: true, hasPenthouse: true, accentColor: '#a855f7',
        wallColor: '#170b2b', sideWallColor: '#0e051c', roofColor: '#261245', seed: 101 
      },
      { 
        id: 'L2', name: 'ЖК «ПРЕМЬЕР ТАУЭР А2»', subName: '26 ЭТАЖЕЙ • БИЗНЕС-КЛАСС', 
        xR: 0.105, yR: 0.56, w: 135, h: 350, floors: 26, cols: 6, 
        spire: 65, hasBalconies: true, hasPenthouse: true, hasSkyLounge: true, accentColor: '#9333ea',
        wallColor: '#1d0c33', sideWallColor: '#110621', roofColor: '#2d1452', seed: 202 
      },
      { 
        id: 'L3', name: 'ЖК «КОМФОРТ А3»', subName: '12 ЭТАЖЕЙ • СЕМЕЙНЫЙ КВАРТАЛ', 
        xR: 0.20, yR: 0.60, w: 90, h: 200, floors: 12, cols: 4, 
        spire: 25, hasBalconies: true, hasPenthouse: false, accentColor: '#7e22ce',
        wallColor: '#150929', sideWallColor: '#0d0419', roofColor: '#240d42', seed: 303 
      },
      // Right Cluster (R1, R2, R3) — SUBTLE PLUM MAGENTA SUNSET (МЯГКИЙ МАЛИНОВЫЙ ЗАКАТ)
      { 
        id: 'R1', name: 'ЖК «GREEN CITY В1»', subName: '14 ЭТАЖЕЙ • ЭКО-КВАРТАЛ', 
        xR: 0.74, yR: 0.60, w: 95, h: 220, floors: 14, cols: 4, 
        spire: 30, hasBalconies: true, hasPenthouse: true, accentColor: '#d946ef',
        wallColor: '#1f081d', sideWallColor: '#120412', roofColor: '#300d2e', seed: 404 
      },
      { 
        id: 'R2', name: 'ЖК «GRAND TOWER В2»', subName: '28 ЭТАЖЕЙ • ПЕНТХАУСЫ', 
        xR: 0.815, yR: 0.55, w: 145, h: 380, floors: 28, cols: 7, 
        spire: 75, hasBalconies: true, hasPenthouse: true, hasSkyLounge: true, accentColor: '#c026d3',
        wallColor: '#240822', sideWallColor: '#140413', roofColor: '#380d35', seed: 505 
      },
      { 
        id: 'R3', name: 'ЖК «NOMAD PALACE В3»', subName: '20 ЭТАЖЕЙ • СТИЛОБАТ', 
        xR: 0.915, yR: 0.57, w: 110, h: 290, floors: 20, cols: 5, 
        spire: 45, hasBalconies: true, hasPenthouse: true, accentColor: '#a21caf',
        wallColor: '#1c0822', sideWallColor: '#100414', roofColor: '#2d0c36', seed: 606 
      }
    ];

    // Detailed Cranes
    const cranes = [
      { bxR: 0.105, byR: 0.56, bh: 350, armLen: 90, color: '#fbbf24', armAngle: 0.4 },
      { bxR: 0.815, byR: 0.55, bh: 380, armLen: 100, color: '#f59e0b', armAngle: -0.3 }
    ];

    // ── 4. WATER & SEWER LABYRINTH ──
    const waterLabyrinth = [
      {
        id: 'W_L1',
        name: 'ВЫПУСК L1 Ø200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        width: 3.2,
        points: [
          { xR: 0.05, yR: 0.58 },
          { xR: 0.05, yR: 0.69 },
          { xR: 0.09, yR: 0.69 },
          { xR: 0.09, yR: 0.79 }
        ],
        pulses: [0.15, 0.65],
        speed: 0.07
      },
      {
        id: 'W_L2',
        name: 'МАГИСТРАЛЬ К1 Ø1200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        width: 4.0,
        points: [
          { xR: 0.13, yR: 0.56 },
          { xR: 0.13, yR: 0.77 },
          { xR: 0.18, yR: 0.77 },
          { xR: 0.18, yR: 0.85 },
          { xR: 0.28, yR: 0.85 },
          { xR: 0.32, yR: 0.91 },
          { xR: 0.50, yR: 0.91 }
        ],
        pulses: [0.08, 0.38, 0.72],
        speed: 0.06
      },
      {
        id: 'W_L3',
        name: 'ВЫПУСК L3 Ø250',
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        width: 3.0,
        points: [
          { xR: 0.21, yR: 0.60 },
          { xR: 0.21, yR: 0.73 },
          { xR: 0.18, yR: 0.73 },
          { xR: 0.18, yR: 0.85 }
        ],
        pulses: [0.22, 0.78],
        speed: 0.08
      },
      {
        id: 'W_R3',
        name: 'ВЫПУСК R3 Ø250',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        width: 3.2,
        points: [
          { xR: 0.95, yR: 0.57 },
          { xR: 0.95, yR: 0.71 },
          { xR: 0.89, yR: 0.71 },
          { xR: 0.89, yR: 0.81 }
        ],
        pulses: [0.20, 0.70],
        speed: 0.07
      },
      {
        id: 'W_R2',
        name: 'КОЛЛЕКТОР К1 Ø1200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        width: 4.0,
        points: [
          { xR: 0.86, yR: 0.55 },
          { xR: 0.86, yR: 0.79 },
          { xR: 0.79, yR: 0.79 },
          { xR: 0.79, yR: 0.87 },
          { xR: 0.68, yR: 0.87 },
          { xR: 0.64, yR: 0.91 },
          { xR: 0.50, yR: 0.91 }
        ],
        pulses: [0.12, 0.45, 0.82],
        speed: 0.06
      },
      {
        id: 'W_R1',
        name: 'ВЫПУСК R1 Ø200',
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        width: 3.0,
        points: [
          { xR: 0.77, yR: 0.60 },
          { xR: 0.77, yR: 0.75 },
          { xR: 0.79, yR: 0.75 },
          { xR: 0.79, yR: 0.87 }
        ],
        pulses: [0.30, 0.85],
        speed: 0.08
      }
    ];

    // ── 5. ELECTRICAL GRID ──
    const electricGrid = [
      {
        id: 'E_LEFT_TP1',
        name: 'КЛ 10 кВ // ТП-1 → ВРУ',
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        width: 2.4,
        points: [
          { xR: 0.04, yR: 0.58 },
          { xR: 0.04, yR: 0.64 },
          { xR: 0.11, yR: 0.64 },
          { xR: 0.11, yR: 0.56 },
          { xR: 0.11, yR: 0.67 },
          { xR: 0.20, yR: 0.67 },
          { xR: 0.20, yR: 0.60 }
        ],
        pulses: [0.1, 0.45, 0.75],
        speed: 0.12
      },
      {
        id: 'E_VRU_L1',
        name: 'ВРУ-0.4 БЛОК А1 (3×185)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.04, yR: 0.58 },
          { xR: 0.06, yR: 0.58 },
          { xR: 0.06, yR: 0.52 },
          { xR: 0.05, yR: 0.52 }
        ],
        pulses: [0.25, 0.70],
        speed: 0.15
      },
      {
        id: 'E_VRU_L2',
        name: 'ВРУ-0.4 ТАУЭР А2 (3×240)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.11, yR: 0.56 },
          { xR: 0.14, yR: 0.56 },
          { xR: 0.14, yR: 0.49 },
          { xR: 0.12, yR: 0.49 }
        ],
        pulses: [0.30, 0.80],
        speed: 0.15
      },
      {
        id: 'E_VRU_L3',
        name: 'ВРУ-0.4 КОРПУС А3 (3×150)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.20, yR: 0.60 },
          { xR: 0.22, yR: 0.60 },
          { xR: 0.22, yR: 0.54 },
          { xR: 0.21, yR: 0.54 }
        ],
        pulses: [0.20, 0.75],
        speed: 0.15
      },
      {
        id: 'E_RIGHT_TP2',
        name: 'КЛ 35 кВ // ТП-2 → ВРУ',
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        width: 2.4,
        points: [
          { xR: 0.76, yR: 0.60 },
          { xR: 0.76, yR: 0.67 },
          { xR: 0.84, yR: 0.67 },
          { xR: 0.84, yR: 0.55 },
          { xR: 0.84, yR: 0.70 },
          { xR: 0.94, yR: 0.70 },
          { xR: 0.94, yR: 0.57 }
        ],
        pulses: [0.15, 0.50, 0.85],
        speed: 0.12
      },
      {
        id: 'E_VRU_R1',
        name: 'ВРУ-0.4 КОРПУС В1 (3×150)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.76, yR: 0.60 },
          { xR: 0.78, yR: 0.60 },
          { xR: 0.78, yR: 0.53 },
          { xR: 0.77, yR: 0.53 }
        ],
        pulses: [0.35, 0.85],
        speed: 0.15
      },
      {
        id: 'E_VRU_R2',
        name: 'ВРУ-0.4 ТАУЭР В2 (3×240)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.84, yR: 0.55 },
          { xR: 0.87, yR: 0.55 },
          { xR: 0.87, yR: 0.48 },
          { xR: 0.85, yR: 0.48 }
        ],
        pulses: [0.20, 0.70],
        speed: 0.15
      },
      {
        id: 'E_VRU_R3',
        name: 'ВРУ-0.4 БЛОК В3 (3×185)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.94, yR: 0.57 },
          { xR: 0.96, yR: 0.57 },
          { xR: 0.96, yR: 0.50 },
          { xR: 0.94, yR: 0.50 }
        ],
        pulses: [0.25, 0.80],
        speed: 0.15
      },
      {
        id: 'E_TP1_TO_TP2',
        name: 'МЕЖСИСТЕМНАЯ СВЯЗЬ 35 кВ (РЕЗЕРВ)',
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        width: 3.0,
        points: [
          { xR: 0.11, yR: 0.64 },
          { xR: 0.11, yR: 0.82 },
          { xR: 0.35, yR: 0.82 },
          { xR: 0.35, yR: 0.88 },
          { xR: 0.65, yR: 0.88 },
          { xR: 0.65, yR: 0.82 },
          { xR: 0.84, yR: 0.82 },
          { xR: 0.84, yR: 0.67 }
        ],
        pulses: [0.1, 0.35, 0.6, 0.85],
        speed: 0.08
      },
      {
        id: 'E_DGU',
        name: 'АВР // ДГУ-500 кВА (Резерв)',
        color: '#ef4444',
        glowColor: 'rgba(239, 68, 68, 0.4)',
        width: 2.0,
        points: [
          { xR: 0.50, yR: 0.84 },
          { xR: 0.50, yR: 0.78 },
          { xR: 0.42, yR: 0.78 },
          { xR: 0.42, yR: 0.73 },
          { xR: 0.58, yR: 0.73 },
          { xR: 0.58, yR: 0.78 },
          { xR: 0.50, yR: 0.78 }
        ],
        pulses: [0.22, 0.60],
        speed: 0.09
      }
    ];

    const utilityNodes = [
      { xR: 0.05, yR: 0.69, label: 'КК-1 (L1)', desc: 'h=-2.5m', color: '#06b6d4', type: 'water' },
      { xR: 0.13, yR: 0.77, label: 'КК-2 (L2)', desc: 'h=-4.2m', color: '#06b6d4', type: 'water' },
      { xR: 0.21, yR: 0.73, label: 'КК-3 (L3)', desc: 'h=-3.1m', color: '#06b6d4', type: 'water' },
      { xR: 0.11, yR: 0.64, label: '⚡ ТП-1 (10/0.4кВ)', desc: 'P=630 кВА', color: '#fbbf24', type: 'electric' },
      { xR: 0.06, yR: 0.52, label: '⚡ ВРУ А1', desc: 'Iн=400А', color: '#eab308', type: 'electric' },
      { xR: 0.14, yR: 0.49, label: '⚡ ВРУ А2', desc: 'Iн=630А', color: '#eab308', type: 'electric' },
      { xR: 0.22, yR: 0.54, label: '⚡ ВРУ А3', desc: 'Iн=250А', color: '#eab308', type: 'electric' },
      { xR: 0.95, yR: 0.71, label: 'КК-11 (R3)', desc: 'h=-2.8m', color: '#06b6d4', type: 'water' },
      { xR: 0.86, yR: 0.79, label: 'КК-12 (R2)', desc: 'h=-4.5m', color: '#06b6d4', type: 'water' },
      { xR: 0.77, yR: 0.75, label: 'КК-13 (R1)', desc: 'h=-3.4m', color: '#06b6d4', type: 'water' },
      { xR: 0.84, yR: 0.67, label: '⚡ ТП-2 (35/10кВ)', desc: 'P=1000 кВА', color: '#fbbf24', type: 'electric' },
      { xR: 0.78, yR: 0.53, label: '⚡ ВРУ В1', desc: 'Iн=250А', color: '#eab308', type: 'electric' },
      { xR: 0.87, yR: 0.48, label: '⚡ ВРУ В2', desc: 'Iн=630А', color: '#eab308', type: 'electric' },
      { xR: 0.96, yR: 0.50, label: '⚡ ВРУ В3', desc: 'Iн=400А', color: '#eab308', type: 'electric' },
      { xR: 0.50, yR: 0.91, label: 'КНС-ГЛАВНАЯ (ХПВ+К1)', desc: 'Q=320м³/ч // h=-8.5m', color: '#38bdf8', type: 'hub' },
      { xR: 0.50, yR: 0.84, label: '🔴 ДГУ-500 (Резерв)', desc: 'АВР // 500 кВА', color: '#ef4444', type: 'electric' }
    ];

    const getPointAlongPath = (points, progress) => {
      let totalLength = 0;
      const segLengths = [];

      for (let i = 0; i < points.length - 1; i++) {
        const pA = { x: points[i].xR * width, y: points[i].yR * height };
        const pB = { x: points[i + 1].xR * width, y: points[i + 1].yR * height };
        const len = Math.hypot(pB.x - pA.x, pB.y - pA.y);
        segLengths.push(len);
        totalLength += len;
      }

      const targetDist = (progress % 1.0) * totalLength;
      let accDist = 0;

      for (let i = 0; i < segLengths.length; i++) {
        if (accDist + segLengths[i] >= targetDist) {
          const segProgress = (targetDist - accDist) / segLengths[i];
          const pA = { x: points[i].xR * width, y: points[i].yR * height };
          const pB = { x: points[i + 1].xR * width, y: points[i + 1].yR * height };
          return {
            x: pA.x + (pB.x - pA.x) * segProgress,
            y: pA.y + (pB.y - pA.y) * segProgress
          };
        }
        accDist += segLengths[i];
      }

      const lastP = points[points.length - 1];
      return { x: lastP.xR * width, y: lastP.yR * height };
    };

    const isElectricLine = (color) => {
      return ['#fbbf24', '#eab308', '#f59e0b', '#d97706', '#ef4444', '#22c55e'].includes(color);
    };

    const drawConduitPath = (ch) => {
      ctx.save();
      const electric = isElectricLine(ch.color);

      ctx.beginPath();
      ch.points.forEach((pt, idx) => {
        const px = pt.xR * width;
        const py = pt.yR * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = ch.glowColor;
      ctx.lineWidth = ch.width + (electric ? 6 : 4);
      ctx.lineJoin = 'miter';
      ctx.stroke();

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = ch.width;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = electric ? 14 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flowing Pulse Packets
      ch.pulses.forEach((pVal) => {
        const prog = (pVal + tick * ch.speed) % 1.0;
        const pt = getPointAlongPath(ch.points, prog);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ch.width * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = electric ? 18 : 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const startP = ch.points[0];
      ctx.fillStyle = ch.color;
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillText(ch.name, startP.xR * width + 6, startP.yR * height + 10);

      ctx.restore();
    };

    const drawUtilityNode = (node) => {
      const nx = node.xR * width;
      const ny = node.yR * height;

      ctx.save();
      const pulse = (Math.sin(tick * 3.5 + node.xR * 20) + 1) * 0.5;

      if (node.type === 'electric') {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(nx - 7, ny - 7, 14, 14);
        ctx.fillRect(nx - 7, ny - 7, 14, 14);

        ctx.beginPath();
        ctx.arc(nx, ny, 2.5 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(nx, ny, 4.5 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(node.label, nx + 9, ny - 2);
      ctx.fillStyle = node.color;
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.fillText(node.desc, nx + 9, ny + 8);

      ctx.restore();
    };

    // ── 6. REALISTIC ARCHITECTURAL BUILDING RENDERER ──
    const drawRealisticBuilding = (b) => {
      const bx = b.xR * width;
      const by = b.yR * height;
      const bw = b.w;
      const bh = b.h;
      const isoX = bw * 0.40; // 3D depth X
      const isoY = bw * 0.20; // 3D depth Y

      ctx.save();

      // ── Ground Ambient Shadow ──
      const groundShadowGrad = ctx.createRadialGradient(
        bx + bw * 0.5, by + 10, 10,
        bx + bw * 0.5, by + 10, bw * 0.9
      );
      groundShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      groundShadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = groundShadowGrad;
      ctx.beginPath();
      ctx.ellipse(bx + bw * 0.5, by + 6, bw * 0.7, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Ground Plaza / Sidewalk Slab ──
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by + 4);
      ctx.lineTo(bx + bw + 12, by + 4);
      ctx.lineTo(bx + bw + isoX + 10, by - isoY + 4);
      ctx.lineTo(bx + isoX - 10, by - isoY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ── Building Base Volume: Front Facade ──
      const frontGrad = ctx.createLinearGradient(bx, by - bh, bx + bw, by);
      frontGrad.addColorStop(0, '#152033');
      frontGrad.addColorStop(0.5, b.wallColor);
      frontGrad.addColorStop(1, '#090e1a');
      ctx.fillStyle = frontGrad;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.rect(bx, by - bh, bw, bh);
      ctx.fill();
      ctx.stroke();

      // ── Building Side Facade (3D Depth with Shading) ──
      const sideGrad = ctx.createLinearGradient(bx + bw, by, bx + bw + isoX, by - bh - isoY);
      sideGrad.addColorStop(0, '#0a101d');
      sideGrad.addColorStop(1, b.sideWallColor);
      ctx.fillStyle = sideGrad;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';

      ctx.beginPath();
      ctx.moveTo(bx + bw, by);
      ctx.lineTo(bx + bw + isoX, by - isoY);
      ctx.lineTo(bx + bw + isoX, by - bh - isoY);
      ctx.lineTo(bx + bw, by - bh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ── Roof Slab (3D Top) ──
      const roofGrad = ctx.createLinearGradient(bx, by - bh, bx + bw + isoX, by - bh - isoY);
      roofGrad.addColorStop(0, b.roofColor);
      roofGrad.addColorStop(1, '#152238');
      ctx.fillStyle = roofGrad;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';

      ctx.beginPath();
      ctx.moveTo(bx, by - bh);
      ctx.lineTo(bx + bw, by - bh);
      ctx.lineTo(bx + bw + isoX, by - bh - isoY);
      ctx.lineTo(bx + isoX, by - bh - isoY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ── Architectural Vertical Mullions / Fins ──
      const colW = bw / b.cols;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let c = 1; c < b.cols; c++) {
        const cx = bx + c * colW;
        ctx.beginPath();
        ctx.moveTo(cx, by - bh);
        ctx.lineTo(cx, by);
        ctx.stroke();
      }

      // Side facade floor lines
      const floorH = bh / b.floors;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      for (let f = 1; f < b.floors; f++) {
        const fy = by - f * floorH;
        // Front floor line
        ctx.beginPath();
        ctx.moveTo(bx, fy);
        ctx.lineTo(bx + bw, fy);
        ctx.stroke();

        // Side floor line
        ctx.beginPath();
        ctx.moveTo(bx + bw, fy);
        ctx.lineTo(bx + bw + isoX, fy - isoY);
        ctx.stroke();
      }

      // ── CALM SEQUENTIAL DYNAMIC WINDOWS (ORGANIZED WAVES, RHYTHMIC STAIRWELLS & OCCASIONAL TOGGLES) ──
      const winPaddingX = colW * 0.18;
      const winW = colW * 0.64;
      const winH = floorH * 0.58;
      const winMarginY = floorH * 0.22;

      // Stairwell / Elevator column index for this building
      const stairCol = Math.floor(b.cols / 2);

      for (let f = 1; f < b.floors; f++) {
        const fy = by - f * floorH;

        for (let c = 0; c < b.cols; c++) {
          const wx = bx + c * colW + winPaddingX;
          const wy = fy + winMarginY;

          // Deterministic seed for this window
          const winSeed = b.seed + f * 43 + c * 17;
          const randVal = seededRandom(winSeed);

          let isLit = false;
          let winColor = '#ffd27d'; // Warm cozy apartment light
          let glowIntensity = 1.0;

          const isStaircase = (c === stairCol);
          const isTvRoom = (!isStaircase && winSeed % 11 === 0);
          const isWaveWindow = (!isStaircase && winSeed % 4 === 0);

          if (isStaircase) {
            // ── 1. SEQUENTIAL STAIRWELL / ELEVATOR SHAFT LIGHT WAVE ──
            // Light ascends smoothly floor-by-floor every 14 seconds in a calm sequence
            const stairCycle = (tick * 0.5 + b.seed * 0.2) % (b.floors + 4);
            const distFromElevator = Math.abs(stairCycle - f);
            isLit = distFromElevator < 1.6;

            winColor = '#e0f2fe'; // Cool bright stairwell LED
            glowIntensity = isLit ? Math.max(0.6, 1.0 - distFromElevator * 0.25) : 0.2;
          } else if (isTvRoom) {
            // ── 2. TV / HOME THEATER (GENTLE OCCASIONAL SCREEN TINT) ──
            isLit = true;
            const tvSlowFlicker = Math.sin(tick * 1.5 + winSeed) * Math.cos(tick * 2.2 + winSeed * 0.5);
            if (tvSlowFlicker > 0.4) {
              winColor = '#93c5fd'; // Cool movie scene
            } else if (tvSlowFlicker < -0.4) {
              winColor = '#a5b4fc'; // Violet cinema scene
            } else {
              winColor = '#fef08a'; // Warm amber scene
            }
            glowIntensity = 0.65 + Math.abs(tvSlowFlicker) * 0.35;
          } else if (isWaveWindow) {
            // ── 3. SEQUENTIAL EVENING ARRIVAL WAVE (ACROSS FLOORS & ROOMS) ──
            // Slow, structured rhythmic wave across building every 36 seconds
            const waveSpeed = 0.035;
            const spatialOffset = (f / b.floors) * 0.6 + (c / b.cols) * 0.4;
            const wavePhase = (tick * waveSpeed + spatialOffset + (b.seed % 5) * 0.2) % 1.0;

            // Window stays on for ~70% of the cycle, off for ~30%
            const threshold = 0.30;
            isLit = wavePhase > threshold;

            // Subtle, crisp switch flicker right at the moment of turning on/off
            const distToEdge = Math.abs(wavePhase - threshold);
            if (distToEdge < 0.006) {
              isLit = Math.sin(tick * 30 + winSeed) > 0;
            }

            if (winSeed % 3 === 0) winColor = '#fbbf24'; // Warm amber
            else if (winSeed % 5 === 0) winColor = '#fef08a'; // Soft gold
            else winColor = '#ffd27d'; // Warm white

            glowIntensity = 0.75 + Math.sin(tick * 1.2 + winSeed) * 0.10;
          } else {
            // ── 4. STEADY BASELINE RESIDENTS (65% LIT, 35% DARK) ──
            const baselineLit = randVal > 0.35;
            isLit = baselineLit;

            if (randVal > 0.85) {
              winColor = '#93c5fd'; // Modern workspace
            } else if (randVal > 0.60) {
              winColor = '#fbbf24'; // Amber chandelier
            } else {
              winColor = '#ffd27d'; // Cozy warm apartment
            }
            glowIntensity = 0.70 + Math.sin(tick * 0.8 + winSeed) * 0.06;
          }

          if (isLit) {
            // ── LIT WINDOW APERTURE ──
            ctx.fillStyle = winColor;
            ctx.shadowColor = winColor;
            ctx.shadowBlur = 8 * glowIntensity;
            ctx.fillRect(wx, wy, winW, winH);
            ctx.shadowBlur = 0;

            // Window division frame (Mullions)
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(wx, wy, winW, winH);
            ctx.beginPath();
            ctx.moveTo(wx + winW * 0.5, wy);
            ctx.lineTo(wx + winW * 0.5, wy + winH);
            ctx.stroke();

            // Light spill over facade below window
            ctx.fillStyle = winColor === '#93c5fd' ? 'rgba(147, 197, 253, 0.15)' : 'rgba(255, 210, 125, 0.18)';
            ctx.fillRect(wx - 1, wy + winH, winW + 2, 2);

            // Balcony for some floors
            if (b.hasBalconies && f % 2 === 0 && (c === 0 || c === b.cols - 1 || c === Math.floor(b.cols / 2))) {
              // Balcony slab
              ctx.fillStyle = '#334155';
              ctx.fillRect(wx - 2, wy + winH + 1, winW + 4, 3);

              // Glass balcony railing with warm reflection
              ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.lineWidth = 0.6;
              ctx.fillRect(wx - 2, wy + winH - 3, winW + 4, 4);
              ctx.strokeRect(wx - 2, wy + winH - 3, winW + 4, 4);
            }
          } else {
            // ── DARK / OFF WINDOW ──
            // Reflective dark glass
            ctx.fillStyle = 'rgba(11, 17, 32, 0.92)';
            ctx.fillRect(wx, wy, winW, winH);

            // Diagonal sky sheen reflection
            const sheenGrad = ctx.createLinearGradient(wx, wy, wx + winW, wy + winH);
            sheenGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
            sheenGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.2)');
            sheenGrad.addColorStop(1, 'rgba(56, 189, 248, 0.04)');
            ctx.fillStyle = sheenGrad;
            ctx.fillRect(wx, wy, winW, winH);

            // Window frame border
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(wx, wy, winW, winH);
          }
        }
      }

      // ── GROUND FLOOR: LUXURY RETAIL / LOBBY ENTRANCE ──
      const lobbyH = floorH * 1.3;
      const lobbyY = by - lobbyH;

      // Illuminated Lobby Storefront Glass
      const lobbyGrad = ctx.createLinearGradient(bx, lobbyY, bx + bw, by);
      lobbyGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      lobbyGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
      lobbyGrad.addColorStop(1, 'rgba(251, 191, 36, 0.40)');
      ctx.fillStyle = lobbyGrad;
      ctx.fillRect(bx + 4, lobbyY + 4, bw - 8, lobbyH - 4);

      // Entrance Portico Canopy
      const canopyW = bw * 0.45;
      const canopyX = bx + (bw - canopyW) * 0.5;
      ctx.fillStyle = b.accentColor;
      ctx.shadowColor = b.accentColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(canopyX, lobbyY + lobbyH * 0.4, canopyW, 3);
      ctx.shadowBlur = 0;

      // Canopy Downlight Spotlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(canopyX + canopyW * 0.25, lobbyY + lobbyH * 0.4 + 3, 1.5, 0, Math.PI * 2);
      ctx.arc(canopyX + canopyW * 0.75, lobbyY + lobbyH * 0.4 + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Downlight Light Cones
      const spotGrad = ctx.createLinearGradient(canopyX, lobbyY + lobbyH * 0.4, canopyX, by);
      spotGrad.addColorStop(0, 'rgba(255, 230, 150, 0.35)');
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(canopyX + 4, lobbyY + lobbyH * 0.4 + 3);
      ctx.lineTo(canopyX + canopyW - 4, lobbyY + lobbyH * 0.4 + 3);
      ctx.lineTo(canopyX + canopyW + 8, by);
      ctx.lineTo(canopyX - 8, by);
      ctx.closePath();
      ctx.fill();

      // Entrance Revolving Doors / Signage
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px Inter, sans-serif';
      ctx.fillText('RECEPTION // ВХОД', canopyX + 8, lobbyY + lobbyH * 0.32);

      // ── ROOFTOP PENTHOUSE & ARCHITECTURAL CROWN ──
      if (b.hasPenthouse) {
        const pentW = bw * 0.65;
        const pentH = 22;
        const pentX = bx + (bw - pentW) * 0.5;
        const pentY = by - bh - pentH;

        // Penthouse Front
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = b.accentColor;
        ctx.lineWidth = 1;
        ctx.fillRect(pentX, pentY, pentW, pentH);
        ctx.strokeRect(pentX, pentY, pentW, pentH);

        // Penthouse Floor-to-Ceiling Panoramic Windows (lit)
        const pWinGrad = ctx.createLinearGradient(pentX, pentY, pentX + pentW, pentY);
        pWinGrad.addColorStop(0, '#ffd27d');
        pWinGrad.addColorStop(0.5, '#fef08a');
        pWinGrad.addColorStop(1, '#93c5fd');
        ctx.fillStyle = pWinGrad;
        ctx.shadowColor = '#ffd27d';
        ctx.shadowBlur = 8;
        ctx.fillRect(pentX + 6, pentY + 4, pentW - 12, pentH - 8);
        ctx.shadowBlur = 0;

        // Rooftop HVAC machinery box
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#475569';
        ctx.fillRect(pentX + 10, pentY - 8, 20, 8);
        ctx.strokeRect(pentX + 10, pentY - 8, 20, 8);
      }

      // ── VERTICAL FACADE LED ACCENT LIGHT STRIP ──
      ctx.strokeStyle = b.accentColor;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = b.accentColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(bx + 2, by - bh);
      ctx.lineTo(bx + 2, by);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx + bw - 2, by - bh);
      ctx.lineTo(bx + bw - 2, by);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── ROOFTOP SPIRE & AVIATION WARNING BEACON ──
      if (b.spire > 0) {
        const topCenterX = bx + bw * 0.5;
        const topCenterY = b.hasPenthouse ? by - bh - 22 : by - bh;

        // Spire Mast
        ctx.beginPath();
        ctx.moveTo(topCenterX, topCenterY);
        ctx.lineTo(topCenterX, topCenterY - b.spire);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Pulsing Red / White FAA Warning Beacon Light
        const beaconPulse = Math.sin(tick * 5 + b.seed) > 0.2;
        const beaconColor = beaconPulse ? '#ef4444' : '#ffffff';
        ctx.beginPath();
        ctx.arc(topCenterX, topCenterY - b.spire, 3.0, 0, Math.PI * 2);
        ctx.fillStyle = beaconColor;
        ctx.shadowColor = beaconColor;
        ctx.shadowBlur = beaconPulse ? 14 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Beacon light flash flare
        if (beaconPulse) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(topCenterX - 12, topCenterY - b.spire);
          ctx.lineTo(topCenterX + 12, topCenterY - b.spire);
          ctx.moveTo(topCenterX, topCenterY - b.spire - 12);
          ctx.lineTo(topCenterX, topCenterY - b.spire + 12);
          ctx.stroke();
        }
      }

      // ── ARCHITECTURAL BADGE / BUILDING TITLE TAG ──
      const badgeY = by - bh - (b.hasPenthouse ? 36 : 14);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = b.accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx - 2, badgeY - 14, bw + 4, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Glowing dot
      ctx.beginPath();
      ctx.arc(bx + 8, badgeY - 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = b.accentColor;
      ctx.shadowColor = b.accentColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Title & Subtitle
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(b.name, bx + 16, badgeY - 5);

      ctx.fillStyle = b.accentColor;
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.fillText(b.subName, bx + 16, badgeY + 4);

      ctx.restore();
    };

    // ── 7. DETAILED CONSTRUCTION TOWER CRANE ──
    const drawRealisticCrane = (c) => {
      const cx = c.bxR * width + 50;
      const cy = c.byR * height - c.bh - 10;
      const mastH = 65;
      const armRot = Math.sin(tick * 0.4 + c.bxR * 10) * 0.35;

      ctx.save();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.4;

      // Crane Mast Truss (2 vertical poles with X braces)
      const mastW = 8;
      ctx.beginPath();
      ctx.moveTo(cx - mastW / 2, cy);
      ctx.lineTo(cx - mastW / 2, cy - mastH);
      ctx.moveTo(cx + mastW / 2, cy);
      ctx.lineTo(cx + mastW / 2, cy - mastH);
      ctx.stroke();

      // Cross lattices
      for (let y = cy; y > cy - mastH; y -= 10) {
        ctx.beginPath();
        ctx.moveTo(cx - mastW / 2, y);
        ctx.lineTo(cx + mastW / 2, y - 10);
        ctx.moveTo(cx + mastW / 2, y);
        ctx.lineTo(cx - mastW / 2, y - 10);
        ctx.stroke();
      }

      // Operator Cabin (Glass with warm light inside)
      ctx.fillStyle = '#ffd27d';
      ctx.shadowColor = '#ffd27d';
      ctx.shadowBlur = 8;
      ctx.fillRect(cx - 7, cy - mastH + 4, 6, 8);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(cx - 7, cy - mastH + 4, 6, 8);

      // Horizontal Jib & Counter-Jib
      const armEndX = cx + Math.cos(armRot) * c.armLen;
      const armEndY = cy - mastH + Math.sin(armRot) * (c.armLen * 0.15);
      const counterEndX = cx - Math.cos(armRot) * (c.armLen * 0.38);
      const counterEndY = cy - mastH - Math.sin(armRot) * (c.armLen * 0.08);

      // Main boom truss
      ctx.beginPath();
      ctx.moveTo(counterEndX, counterEndY);
      ctx.lineTo(armEndX, armEndY);
      ctx.moveTo(counterEndX, counterEndY + 4);
      ctx.lineTo(armEndX, armEndY + 4);
      ctx.stroke();

      // Counterweight blocks
      ctx.fillStyle = '#334155';
      ctx.fillRect(counterEndX - 4, counterEndY - 2, 12, 10);

      // Peak A-frame tower above mast
      const apexY = cy - mastH - 18;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - mastH);
      ctx.lineTo(cx, apexY);
      ctx.lineTo(cx + 4, cy - mastH);
      ctx.stroke();

      // Stay cables from apex
      ctx.beginPath();
      ctx.moveTo(cx, apexY);
      ctx.lineTo(armEndX * 0.6 + cx * 0.4, armEndY * 0.6 + (cy - mastH) * 0.4);
      ctx.moveTo(cx, apexY);
      ctx.lineTo(counterEndX, counterEndY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Flashing Crane Top Beacon
      const cranePulse = Math.sin(tick * 6 + cx) > 0;
      ctx.beginPath();
      ctx.arc(cx, apexY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = cranePulse ? '#ef4444' : '#fbbf24';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = cranePulse ? 12 : 2;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trolley, Cable & Hook
      const trolleyT = 0.45 + Math.sin(tick * 0.3) * 0.25;
      const trolleyX = cx + (armEndX - cx) * trolleyT;
      const trolleyY = cy - mastH + (armEndY - (cy - mastH)) * trolleyT + 4;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(trolleyX - 2, trolleyY, 4, 3);

      // Swaying cable and hook
      const cableLen = 45 + Math.sin(tick * 0.8) * 10;
      const swayAngle = Math.sin(tick * 1.2) * 0.08;
      const hookX = trolleyX + Math.sin(swayAngle) * cableLen;
      const hookY = trolleyY + Math.cos(swayAngle) * cableLen;

      ctx.beginPath();
      ctx.moveTo(trolleyX, trolleyY + 3);
      ctx.lineTo(hookX, hookY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Hook block & load
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(hookX, hookY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      tick += 0.016;

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // ── 1. MUTED COSMIC VIOLET & PLUM DUSK SKY GRADIENT (SUBTLE, ELEGANT & EYE-FRIENDLY) ──
      const skyGrad = ctx.createLinearGradient(0, 0, width, 0);
      skyGrad.addColorStop(0.00, '#1c0a32'); // Left: Muted deep violet horizon
      skyGrad.addColorStop(0.22, '#120722'); // Left-mid: Subdued purple atmosphere
      skyGrad.addColorStop(0.50, '#06030c'); // Center: Dark obsidian violet-black
      skyGrad.addColorStop(0.78, '#120517'); // Right-mid: Muted deep plum
      skyGrad.addColorStop(1.00, '#1c061c'); // Right: Subdued plum magenta horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. SUBTLE VOLUMETRIC LIGHT AURAS (SOFT, DULLED & NON-INTRUSIVE) ──
      const auras = [
        // Left Side: Muted Violet Dawn Glow
        { x: 0.12, y: 0.45, r: 0.85, color: 'rgba(147, 51, 234, 0.14)' },  // Soft Muted Violet
        { x: 0.22, y: 0.32, r: 0.70, color: 'rgba(124, 58, 237, 0.10)' },   // Subtle Purple sky glow
        { x: 0.05, y: 0.58, r: 0.75, color: 'rgba(168, 85, 247, 0.09)' },   // Gentle Lavender flare
        // Right Side: Muted Plum Magenta Sunset Glow
        { x: 0.88, y: 0.42, r: 0.80, color: 'rgba(219, 39, 119, 0.12)' },  // Soft Muted Plum Magenta
        { x: 0.94, y: 0.55, r: 0.65, color: 'rgba(236, 72, 153, 0.08)' }   // Gentle Rose dusk flare
      ];
      auras.forEach((a) => {
        const px = a.x * width;
        const py = a.y * height;
        const rad = a.r * Math.min(width, height);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
        grad.addColorStop(0, a.color);
        grad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── 3. REALISTIC ARCHITECTURAL BUILDINGS & CRANES (Desktop only) ──
      if (!isMobile) {
        cityBuildings.forEach(b => drawRealisticBuilding(b));
        cranes.forEach(c => drawRealisticCrane(c));
      }

      // ── 4. COMPLETE ALL-BUILDING WATER LABYRINTH & ELECTRIC GRID (Desktop only) ──
      if (!isMobile) {
        waterLabyrinth.forEach(ch => drawConduitPath(ch));
        electricGrid.forEach(eg => drawConduitPath(eg));
        utilityNodes.forEach(node => drawUtilityNode(node));
      }

      // ── 5. 3D TOPOGRAPHIC BLUEPRINT ELEVATION GRID (Desktop only) ──
      if (!isMobile) {
        ctx.save();
        ctx.lineWidth = 0.8;
        const rows = 16;
        const cols = 22;
        const gridStartX = -width * 0.1;
        const gridEndX = width * 1.1;
        const gridStartY = height * 0.52;
        const gridEndY = height * 1.12;

        for (let c = 0; c <= cols; c++) {
          const colPercent = c / cols;
          const x = gridStartX + (gridEndX - gridStartX) * colPercent;

          ctx.beginPath();
          for (let r = 0; r <= rows; r++) {
            const rowPercent = r / rows;
            const y = gridStartY + (gridEndY - gridStartY) * rowPercent;
            const wave = Math.sin(colPercent * 5 + tick * 0.8) * Math.cos(rowPercent * 4 - tick * 0.6) * 16;

            const perspectiveScale = 0.5 + rowPercent * 0.7;
            const projX = width * 0.5 + (x - width * 0.5) * perspectiveScale;
            const projY = y + wave * perspectiveScale;

            if (r === 0) ctx.moveTo(projX, projY);
            else ctx.lineTo(projX, projY);
          }

          const alpha = Math.max(0.02, (1 - Math.abs(colPercent - 0.5) * 1.2) * 0.10);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.stroke();
        }

        for (let r = 0; r <= rows; r++) {
          const rowPercent = r / rows;
          const y = gridStartY + (gridEndY - gridStartY) * rowPercent;
          const perspectiveScale = 0.5 + rowPercent * 0.7;

          ctx.beginPath();
          for (let c = 0; c <= cols; c++) {
            const colPercent = c / cols;
            const x = gridStartX + (gridEndX - gridStartX) * colPercent;
            const wave = Math.sin(colPercent * 5 + tick * 0.8) * Math.cos(rowPercent * 4 - tick * 0.6) * 16;

            const projX = width * 0.5 + (x - width * 0.5) * perspectiveScale;
            const projY = y + wave * perspectiveScale;

            if (c === 0) ctx.moveTo(projX, projY);
            else ctx.lineTo(projX, projY);
          }

          ctx.strokeStyle = `rgba(37, 99, 235, ${0.02 + rowPercent * 0.08})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── 6. SHOOTING METEORS ──
      spawnComet();
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.x += c.vx;
        c.y += c.vy;
        c.alpha *= 0.98;

        const tailX = c.x - c.vx * 8;
        const tailY = c.y - c.vy * 8;

        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        if (c.y > height + 50 || c.alpha < 0.05) {
          comets.splice(i, 1);
        }
      }

      // ── 7. SUPERNOVA SHOCKWAVES ──
      mouse.shockwaves.forEach((sw, idx) => {
        sw.radius += sw.speed;
        sw.alpha *= 0.96;

        if (sw.alpha > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha})`;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${sw.alpha * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        } else {
          mouse.shockwaves.splice(idx, 1);
        }
      });

      // ── 8. PARTICLES ──
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
        if (mDist < 200) {
          const force = (1 - mDist / 200) * 1.0;
          p.x += (mouse.x - p.x) * force * 0.04;
          p.y += (mouse.y - p.y) * force * 0.04;
        }

        const pRad = p.radius + Math.sin(p.pulseVal) * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, pRad), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = pRad > 1.8 ? 10 : 0;
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