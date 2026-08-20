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

    // ── 1. 3D STRUCTURAL PARTICLES & TRUSS NODES ──
    const count = isMobile ? Math.min(Math.floor((width * height) / 18000), 40) : Math.min(Math.floor((width * height) / 12000), 120);
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

    // ── 3. 3D HOLOGRAPHIC BIM MEGACITY SKYLINE (All 6 Buildings clearly defined) ──
    const cityBuildings = [
      // Left Cluster (L1, L2, L3)
      { id: 'L1', name: 'БЛОК А1', xR: 0.03, yR: 0.52, w: 90, h: 220, floors: 8, spire: 35, color: 'rgba(56, 189, 248, 0.14)' },
      { id: 'L2', name: 'ТАУЭР А2', xR: 0.10, yR: 0.56, w: 115, h: 280, floors: 11, spire: 55, color: 'rgba(37, 99, 235, 0.16)' },
      { id: 'L3', name: 'КОРПУС А3', xR: 0.19, yR: 0.59, w: 80, h: 180, floors: 6, spire: 20, color: 'rgba(14, 165, 233, 0.12)' },
      // Right Cluster (R1, R2, R3)
      { id: 'R1', name: 'КОРПУС В1', xR: 0.75, yR: 0.57, w: 85, h: 190, floors: 7, spire: 25, color: 'rgba(16, 185, 129, 0.12)' },
      { id: 'R2', name: 'ТАУЭР В2', xR: 0.82, yR: 0.53, w: 130, h: 310, floors: 12, spire: 70, color: 'rgba(56, 189, 248, 0.16)' },
      { id: 'R3', name: 'БЛОК В3', xR: 0.92, yR: 0.55, w: 95, h: 240, floors: 9, spire: 40, color: 'rgba(245, 158, 11, 0.14)' }
    ];

    // Cranes
    const cranes = [
      { bxR: 0.10, byR: 0.56, bh: 280, armLen: 70, color: '#fbbf24' },
      { bxR: 0.82, byR: 0.53, bh: 310, armLen: 85, color: '#38bdf8' }
    ];

    // ── 4. COMPLETE ALL-BUILDING WATER & SEWER LABYRINTH ──
    const waterLabyrinth = [
      // L1 Drop & Connection
      {
        id: 'W_L1',
        name: 'ВЫПУСК L1 Ø200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        width: 3.2,
        points: [
          { xR: 0.05, yR: 0.52 }, // Base of L1
          { xR: 0.05, yR: 0.67 }, // Down vertical
          { xR: 0.09, yR: 0.67 }, // Horizontal branch
          { xR: 0.09, yR: 0.77 }  // Into L2 Main Collector
        ],
        pulses: [0.15, 0.65],
        speed: 0.07
      },
      // L2 Drop & Main Trunk
      {
        id: 'W_L2',
        name: 'МАГИСТРАЛЬ К1 Ø1200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        width: 4.0,
        points: [
          { xR: 0.13, yR: 0.56 }, // Base of L2
          { xR: 0.13, yR: 0.77 },
          { xR: 0.18, yR: 0.77 },
          { xR: 0.18, yR: 0.85 },
          { xR: 0.28, yR: 0.85 },
          { xR: 0.32, yR: 0.91 },
          { xR: 0.50, yR: 0.91 } // Central KNS Nexus
        ],
        pulses: [0.08, 0.38, 0.72],
        speed: 0.06
      },
      // L3 Drop & Interconnect
      {
        id: 'W_L3',
        name: 'ВЫПУСК L3 Ø250',
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        width: 3.0,
        points: [
          { xR: 0.21, yR: 0.59 }, // Base of L3
          { xR: 0.21, yR: 0.71 },
          { xR: 0.18, yR: 0.71 }, // Joins L2 stack
          { xR: 0.18, yR: 0.85 }
        ],
        pulses: [0.22, 0.78],
        speed: 0.08
      },
      // R3 Drop & Main Trunk
      {
        id: 'W_R3',
        name: 'ВЫПУСК R3 Ø250',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        width: 3.2,
        points: [
          { xR: 0.95, yR: 0.55 }, // Base of R3
          { xR: 0.95, yR: 0.69 },
          { xR: 0.89, yR: 0.69 },
          { xR: 0.89, yR: 0.79 } // Into R2 Trunk
        ],
        pulses: [0.20, 0.70],
        speed: 0.07
      },
      // R2 Drop & Main Trunk
      {
        id: 'W_R2',
        name: 'КОЛЛЕКТОР К1 Ø1200',
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        width: 4.0,
        points: [
          { xR: 0.86, yR: 0.53 }, // Base of R2
          { xR: 0.86, yR: 0.79 },
          { xR: 0.79, yR: 0.79 },
          { xR: 0.79, yR: 0.87 },
          { xR: 0.68, yR: 0.87 },
          { xR: 0.64, yR: 0.91 },
          { xR: 0.50, yR: 0.91 } // Central KNS Nexus
        ],
        pulses: [0.12, 0.45, 0.82],
        speed: 0.06
      },
      // R1 Drop & Interconnect
      {
        id: 'W_R1',
        name: 'ВЫПУСК R1 Ø200',
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.4)',
        width: 3.0,
        points: [
          { xR: 0.77, yR: 0.57 }, // Base of R1
          { xR: 0.77, yR: 0.73 },
          { xR: 0.79, yR: 0.73 },
          { xR: 0.79, yR: 0.87 }
        ],
        pulses: [0.30, 0.85],
        speed: 0.08
      }
    ];

    // ── 5. EXPANDED HIGH-VOLTAGE ELECTRICAL GRID, SUBSTATIONS & DISTRIBUTION ──
    const electricGrid = [
      // Left Cluster Transformer Substation (ТП-1) Main Bus to L1, L2, L3
      {
        id: 'E_LEFT_TP1',
        name: 'КЛ 10 кВ // ТП-1 → ВРУ',
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        width: 2.4,
        points: [
          { xR: 0.04, yR: 0.52 },
          { xR: 0.04, yR: 0.62 },
          { xR: 0.11, yR: 0.62 },
          { xR: 0.11, yR: 0.56 },
          { xR: 0.11, yR: 0.65 },
          { xR: 0.20, yR: 0.65 },
          { xR: 0.20, yR: 0.59 }
        ],
        pulses: [0.1, 0.45, 0.75],
        speed: 0.12
      },
      // Individual ВРУ Feed Cable L1
      {
        id: 'E_VRU_L1',
        name: 'ВРУ-0.4 БЛОК А1 (3×185)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.04, yR: 0.52 },
          { xR: 0.06, yR: 0.52 },
          { xR: 0.06, yR: 0.46 },
          { xR: 0.05, yR: 0.46 }
        ],
        pulses: [0.25, 0.70],
        speed: 0.15
      },
      // Individual ВРУ Feed Cable L2
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
      // Individual ВРУ Feed Cable L3
      {
        id: 'E_VRU_L3',
        name: 'ВРУ-0.4 КОРПУС А3 (3×150)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.20, yR: 0.59 },
          { xR: 0.22, yR: 0.59 },
          { xR: 0.22, yR: 0.53 },
          { xR: 0.21, yR: 0.53 }
        ],
        pulses: [0.20, 0.75],
        speed: 0.15
      },
      // Right Cluster Transformer Substation (ТП-2) to R1, R2, R3
      {
        id: 'E_RIGHT_TP2',
        name: 'КЛ 35 кВ // ТП-2 → ВРУ',
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        width: 2.4,
        points: [
          { xR: 0.76, yR: 0.57 },
          { xR: 0.76, yR: 0.65 },
          { xR: 0.84, yR: 0.65 },
          { xR: 0.84, yR: 0.53 },
          { xR: 0.84, yR: 0.68 },
          { xR: 0.94, yR: 0.68 },
          { xR: 0.94, yR: 0.55 }
        ],
        pulses: [0.15, 0.50, 0.85],
        speed: 0.12
      },
      // Individual ВРУ Feed Cable R1
      {
        id: 'E_VRU_R1',
        name: 'ВРУ-0.4 КОРПУС В1 (3×150)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.76, yR: 0.57 },
          { xR: 0.78, yR: 0.57 },
          { xR: 0.78, yR: 0.51 },
          { xR: 0.77, yR: 0.51 }
        ],
        pulses: [0.35, 0.85],
        speed: 0.15
      },
      // Individual ВРУ Feed Cable R2
      {
        id: 'E_VRU_R2',
        name: 'ВРУ-0.4 ТАУЭР В2 (3×240)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.84, yR: 0.53 },
          { xR: 0.87, yR: 0.53 },
          { xR: 0.87, yR: 0.46 },
          { xR: 0.85, yR: 0.46 }
        ],
        pulses: [0.20, 0.70],
        speed: 0.15
      },
      // Individual ВРУ Feed Cable R3
      {
        id: 'E_VRU_R3',
        name: 'ВРУ-0.4 БЛОК В3 (3×185)',
        color: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.35)',
        width: 1.8,
        points: [
          { xR: 0.94, yR: 0.55 },
          { xR: 0.96, yR: 0.55 },
          { xR: 0.96, yR: 0.49 },
          { xR: 0.94, yR: 0.49 }
        ],
        pulses: [0.15, 0.65],
        speed: 0.15
      },
      // Inter-City High-Voltage Trunk Line (ТП-1 ⟷ ТП-2)
      {
        id: 'E_INTER_TRUNK',
        name: 'МАГИСТРАЛЬНЫЙ КАБЕЛЬ 35 кВ ТП-1 ⟷ ТП-2',
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        width: 2.8,
        points: [
          { xR: 0.11, yR: 0.65 },
          { xR: 0.11, yR: 0.73 },
          { xR: 0.26, yR: 0.73 },
          { xR: 0.30, yR: 0.78 },
          { xR: 0.70, yR: 0.78 },
          { xR: 0.74, yR: 0.73 },
          { xR: 0.84, yR: 0.73 },
          { xR: 0.84, yR: 0.68 }
        ],
        pulses: [0.10, 0.40, 0.70],
        speed: 0.14
      },
      // Street Lighting Circuit Left
      {
        id: 'E_STREET_LEFT',
        name: 'НАРУЖНОЕ ОСВЕЩЕНИЕ НО-1 (IP65)',
        color: '#d97706',
        glowColor: 'rgba(217, 119, 6, 0.35)',
        width: 1.5,
        points: [
          { xR: 0.11, yR: 0.62 },
          { xR: 0.06, yR: 0.62 },
          { xR: 0.06, yR: 0.58 },
          { xR: 0.14, yR: 0.58 },
          { xR: 0.14, yR: 0.62 },
          { xR: 0.22, yR: 0.62 }
        ],
        pulses: [0.18, 0.55, 0.88],
        speed: 0.10
      },
      // Street Lighting Circuit Right
      {
        id: 'E_STREET_RIGHT',
        name: 'НАРУЖНОЕ ОСВЕЩЕНИЕ НО-2 (IP65)',
        color: '#d97706',
        glowColor: 'rgba(217, 119, 6, 0.35)',
        width: 1.5,
        points: [
          { xR: 0.84, yR: 0.65 },
          { xR: 0.79, yR: 0.65 },
          { xR: 0.79, yR: 0.60 },
          { xR: 0.88, yR: 0.60 },
          { xR: 0.88, yR: 0.65 },
          { xR: 0.96, yR: 0.65 }
        ],
        pulses: [0.12, 0.48, 0.82],
        speed: 0.10
      },
      // Emergency Generator Feed (ДГУ)
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
      },
      // Grounding Contour Loop
      {
        id: 'E_GROUND',
        name: 'КОНТУР ЗАЗЕМЛЕНИЯ RE (R<4 Ом)',
        color: '#22c55e',
        glowColor: 'rgba(34, 197, 94, 0.3)',
        width: 1.4,
        points: [
          { xR: 0.04, yR: 0.68 },
          { xR: 0.04, yR: 0.72 },
          { xR: 0.20, yR: 0.72 },
          { xR: 0.20, yR: 0.68 },
          { xR: 0.04, yR: 0.68 }
        ],
        pulses: [0.35],
        speed: 0.04
      },
      // Grounding Contour Loop Right
      {
        id: 'E_GROUND_R',
        name: 'КОНТУР ЗАЗЕМЛЕНИЯ RE (R<4 Ом)',
        color: '#22c55e',
        glowColor: 'rgba(34, 197, 94, 0.3)',
        width: 1.4,
        points: [
          { xR: 0.76, yR: 0.70 },
          { xR: 0.76, yR: 0.74 },
          { xR: 0.94, yR: 0.74 },
          { xR: 0.94, yR: 0.70 },
          { xR: 0.76, yR: 0.70 }
        ],
        pulses: [0.60],
        speed: 0.04
      }
    ];

    // Infrastructure Node Vaults & Substations
    const utilityNodes = [
      // Left Cluster Water Nodes
      { xR: 0.05, yR: 0.67, label: 'КК-1 (L1)', desc: 'h=-2.5m', color: '#06b6d4', type: 'water' },
      { xR: 0.13, yR: 0.77, label: 'КК-2 (L2)', desc: 'h=-4.2m', color: '#06b6d4', type: 'water' },
      { xR: 0.21, yR: 0.71, label: 'КК-3 (L3)', desc: 'h=-3.1m', color: '#06b6d4', type: 'water' },

      // Left Cluster Electric Nodes
      { xR: 0.11, yR: 0.62, label: '⚡ ТП-1 (10/0.4кВ)', desc: 'P=630 кВА', color: '#fbbf24', type: 'electric' },
      { xR: 0.06, yR: 0.52, label: '⚡ ВРУ А1', desc: 'Iн=400А', color: '#eab308', type: 'electric' },
      { xR: 0.14, yR: 0.49, label: '⚡ ВРУ А2', desc: 'Iн=630А', color: '#eab308', type: 'electric' },
      { xR: 0.22, yR: 0.53, label: '⚡ ВРУ А3', desc: 'Iн=250А', color: '#eab308', type: 'electric' },
      { xR: 0.06, yR: 0.58, label: '💡 НО-1', desc: '32 опоры', color: '#d97706', type: 'electric' },

      // Right Cluster Water Nodes
      { xR: 0.95, yR: 0.69, label: 'КК-11 (R3)', desc: 'h=-2.8m', color: '#06b6d4', type: 'water' },
      { xR: 0.86, yR: 0.79, label: 'КК-12 (R2)', desc: 'h=-4.5m', color: '#06b6d4', type: 'water' },
      { xR: 0.77, yR: 0.73, label: 'КК-13 (R1)', desc: 'h=-3.4m', color: '#06b6d4', type: 'water' },

      // Right Cluster Electric Nodes
      { xR: 0.84, yR: 0.65, label: '⚡ ТП-2 (35/10кВ)', desc: 'P=1000 кВА', color: '#fbbf24', type: 'electric' },
      { xR: 0.78, yR: 0.51, label: '⚡ ВРУ В1', desc: 'Iн=250А', color: '#eab308', type: 'electric' },
      { xR: 0.87, yR: 0.46, label: '⚡ ВРУ В2', desc: 'Iн=630А', color: '#eab308', type: 'electric' },
      { xR: 0.96, yR: 0.49, label: '⚡ ВРУ В3', desc: 'Iн=400А', color: '#eab308', type: 'electric' },
      { xR: 0.79, yR: 0.60, label: '💡 НО-2', desc: '28 опор', color: '#d97706', type: 'electric' },

      // Central Hubs
      { xR: 0.50, yR: 0.91, label: 'КНС-ГЛАВНАЯ (ХПВ+К1)', desc: 'Q=320м³/ч // h=-8.5m', color: '#38bdf8', type: 'hub' },
      { xR: 0.50, yR: 0.84, label: '🔴 ДГУ-500 (Резерв)', desc: 'АВР // 500 кВА', color: '#ef4444', type: 'electric' }
    ];

    // Helper: Interpolate distance along polygonal path
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

    // Helper: Draw Conduit Line with enhanced electric effects
    const isElectricLine = (color) => {
      return ['#fbbf24', '#eab308', '#f59e0b', '#d97706', '#ef4444', '#22c55e'].includes(color);
    };

    const drawConduitPath = (ch) => {
      ctx.save();
      const electric = isElectricLine(ch.color);

      // Outer glow (stronger for electric)
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

      // Core line
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = ch.width;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = electric ? 14 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Random micro-lightning along electric cables
      if (electric && Math.random() < 0.35) {
        const segIdx = Math.floor(Math.random() * (ch.points.length - 1));
        const t = Math.random();
        const pA = ch.points[segIdx];
        const pB = ch.points[segIdx + 1];
        const sx = (pA.xR + (pB.xR - pA.xR) * t) * width;
        const sy = (pA.yR + (pB.yR - pA.yR) * t) * height;

        // Draw jagged lightning bolt
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        let lx = sx, ly = sy;
        const branches = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branches; b++) {
          lx += (Math.random() - 0.5) * 14;
          ly += (Math.random() - 0.5) * 14;
          ctx.lineTo(lx, ly);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Flowing Pulse Packets
      ch.pulses.forEach((pVal) => {
        const prog = (pVal + tick * ch.speed) % 1.0;
        const pt = getPointAlongPath(ch.points, prog);

        // Main pulse glow
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ch.width * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = electric ? 18 : 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (electric) {
          // Electric corona discharge halo
          const coronaRadius = ch.width * 2.5 + Math.sin(tick * 12 + pVal * 30) * 3;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, coronaRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.1})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Multi-branch spark arcs radiating from pulse
          const sparkCount = 2 + Math.floor(Math.random() * 3);
          for (let s = 0; s < sparkCount; s++) {
            const angle = Math.random() * Math.PI * 2;
            const len = 6 + Math.random() * 10;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            let sx2 = pt.x + Math.cos(angle) * len * 0.5;
            let sy2 = pt.y + Math.sin(angle) * len * 0.5;
            ctx.lineTo(sx2, sy2);
            sx2 += (Math.random() - 0.5) * 8;
            sy2 += (Math.random() - 0.5) * 8;
            ctx.lineTo(sx2, sy2);
            ctx.strokeStyle = ch.color === '#ef4444' ? '#ff6b6b' : '#fffbe6';
            ctx.lineWidth = 0.7;
            ctx.shadowColor = ch.color;
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      });

      // Label at start
      const startP = ch.points[0];
      ctx.fillStyle = ch.color;
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.fillText(ch.name, startP.xR * width + 6, startP.yR * height + 10);

      ctx.restore();
    };

    // Helper: Draw Node Chamber / Substation
    const drawUtilityNode = (node) => {
      const nx = node.xR * width;
      const ny = node.yR * height;

      ctx.save();
      const pulse = (Math.sin(tick * 3.5 + node.xR * 20) + 1) * 0.5;

      if (node.type === 'electric') {
        // Substation Box
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
        // Round Manhole Chamber
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

      // Micro Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(node.label, nx + 9, ny - 2);
      ctx.fillStyle = node.color;
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.fillText(node.desc, nx + 9, ny + 8);

      ctx.restore();
    };

    // Helper: Draw 3D Holographic Building
    const drawHoloBuilding = (b) => {
      const bx = b.xR * width;
      const by = b.yR * height;
      const bw = b.w;
      const bh = b.h;
      const isoX = bw * 0.5;
      const isoY = bw * 0.25;

      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(8, 14, 28, 0.4)';

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by - bh);
      ctx.lineTo(bx, by - bh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx, by - bh);
      ctx.lineTo(bx + bw, by - bh);
      ctx.lineTo(bx + bw + isoX, by - bh - isoY);
      ctx.lineTo(bx + isoX, by - bh - isoY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx + bw, by);
      ctx.lineTo(bx + bw + isoX, by - isoY);
      ctx.lineTo(bx + bw + isoX, by - bh - isoY);
      ctx.lineTo(bx + bw, by - bh);
      ctx.closePath();
      ctx.fillStyle = 'rgba(37, 99, 235, 0.03)';
      ctx.fill();
      ctx.stroke();

      const floorH = bh / b.floors;
      for (let f = 1; f < b.floors; f++) {
        const fy = by - f * floorH;
        ctx.beginPath();
        ctx.moveTo(bx, fy);
        ctx.lineTo(bx + bw, fy);
        ctx.lineTo(bx + bw + isoX, fy - isoY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.stroke();

        if (f % 2 === 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(bx + bw * 0.5 - 2, fy - 1, 4, 2);
        }
      }

      // Foundation Slab Basement Drop Line
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by + 16);
      ctx.lineTo(bx + bw, by + 16);
      ctx.lineTo(bx + bw, by);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.stroke();

      // Building Label Tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillText(b.name, bx + 6, by - bh + 14);

      if (b.spire > 0) {
        const topCenterX = bx + bw * 0.5 + isoX * 0.5;
        const topCenterY = by - bh - isoY * 0.5;

        ctx.beginPath();
        ctx.moveTo(topCenterX, topCenterY);
        ctx.lineTo(topCenterX, topCenterY - b.spire);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const pulse = (Math.sin(tick * 4 + b.xR * 20) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(topCenterX, topCenterY - b.spire, 1.8 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = pulse > 0.4 ? '#38bdf8' : '#fbbf24';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    // Helper: Draw Tower Crane
    const drawCrane = (c) => {
      const cx = c.bxR * width + 40;
      const cy = c.byR * height - c.bh - 15;
      const mastH = 45;
      const armRot = Math.sin(tick * 0.5 + c.bxR * 10) * 0.4;

      ctx.save();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx - 3, cy - mastH);
      ctx.lineTo(cx + 3, cy - mastH);
      ctx.lineTo(cx + 3, cy);
      ctx.stroke();

      for (let y = cy; y > cy - mastH; y -= 8) {
        ctx.beginPath();
        ctx.moveTo(cx - 3, y);
        ctx.lineTo(cx + 3, y - 8);
        ctx.stroke();
      }

      const armEndX = cx + Math.cos(armRot) * c.armLen;
      const armEndY = cy - mastH + Math.sin(armRot) * (c.armLen * 0.2);
      const counterEndX = cx - Math.cos(armRot) * (c.armLen * 0.35);
      const counterEndY = cy - mastH - Math.sin(armRot) * (c.armLen * 0.1);

      ctx.beginPath();
      ctx.moveTo(counterEndX, counterEndY);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();

      const apexY = cy - mastH - 12;
      ctx.beginPath();
      ctx.arc(cx, apexY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      tick += 0.016;

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // ── 1. DEEP SAPPHIRE OBSIDIAN GRADIENT ──
      const baseGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.42, 60,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.95
      );
      baseGrad.addColorStop(0, '#0c142c');
      baseGrad.addColorStop(0.35, '#080d1e');
      baseGrad.addColorStop(0.75, '#040712');
      baseGrad.addColorStop(1, '#020308');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. VOLUMETRIC AURA LIGHT POOLS ──
      const auras = [
        { x: 0.20, y: 0.30, r: 0.55, color: 'rgba(37, 99, 235, 0.22)' },
        { x: 0.80, y: 0.35, r: 0.50, color: 'rgba(2, 132, 199, 0.20)' },
        { x: 0.50, y: 0.85, r: 0.52, color: 'rgba(6, 182, 212, 0.18)' }
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

      // ── 3. 3D HOLOGRAPHIC BUILDINGS & CRANES (Desktop only) ──
      if (!isMobile) {
        cityBuildings.forEach(b => drawHoloBuilding(b));
        cranes.forEach(c => drawCrane(c));
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
      } // end !isMobile

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

      // ── 8. STRUCTURAL QUANTUM TRUSS CONSTELLATION ──
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

          if (mDist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - mDist / 120) * 0.45})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
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

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 80) {
            const lineAlpha = (1 - dist / 80) * 0.20;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
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
