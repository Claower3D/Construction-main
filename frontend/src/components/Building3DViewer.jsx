import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function Building3DViewer({
  sampleIndex = 0,
  isScanning = false,
  interactive = true,
  height = '100%',
  showControls = true
}) {
  const mountRef = useRef(null);
  const cleanupRef = useRef(null);

  // Model Presets: 0 = 'ЖК Премиум (Twin Towers)', 1 = 'Бизнес-Центр Авангард', 2 = 'Вилла Модерн'
  const [activeModel, setActiveModel] = useState(sampleIndex % 3);
  const [timeMode, setTimeMode] = useState('sunset'); // 'sunset' | 'night' | 'day'
  const [viewMode, setViewMode] = useState(isScanning ? 'scan' : 'arch'); // 'arch' | 'scan' | 'bim' | 'xray'
  const [autoRotate, setAutoRotate] = useState(true);
  const [constructionStage, setConstructionStage] = useState(3); // 1: Нулевой цикл, 2: Монолит, 3: Фасад, 4: Сдан

  useEffect(() => {
    if (isScanning) setViewMode('scan');
  }, [isScanning]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    if (cleanupRef.current) cleanupRef.current();

    const W = el.clientWidth || 600;
    const H = el.clientHeight || 450;

    // ── 1. SCENE & PHOTOREALISTIC ARCHVIZ RENDERER ──
    const scene = new THREE.Scene();

    // Sky Background & Volumetric Fog
    const fogColor = timeMode === 'night' ? 0x060c18 : timeMode === 'day' ? 0xd0e4f8 : 0x0e172a;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, timeMode === 'night' ? 0.0075 : 0.0065);

    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 1200);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeMode === 'night' ? 1.4 : timeMode === 'day' ? 1.05 : 1.25;
    el.appendChild(renderer.domElement);

    // ── 2. ADVANCED LIGHTING RIG (GLOBAL ILLUMINATION SIMULATION) ──
    const ambientLight = new THREE.AmbientLight(
      timeMode === 'night' ? 0x182848 : timeMode === 'day' ? 0x88aacc : 0x334d73,
      timeMode === 'night' ? 0.95 : 1.4
    );
    scene.add(ambientLight);

    // Key Directional Sun/Moon Light with Sharp Soft Shadows
    const sunColor = timeMode === 'night' ? 0xaaccff : timeMode === 'day' ? 0xfff8ee : 0xff9944;
    const sunIntensity = timeMode === 'night' ? 1.0 : timeMode === 'day' ? 2.6 : 2.2;
    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(65, 110, 55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -75;
    sun.shadow.camera.right = 75;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -40;
    sun.shadow.camera.near = 20;
    sun.shadow.camera.far = 300;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    // Hemisphere Ambient Bounce Light
    const hemiLight = new THREE.HemisphereLight(
      timeMode === 'night' ? 0x224477 : 0xaad0f5,
      timeMode === 'night' ? 0x060e1c : 0x223344,
      0.7
    );
    scene.add(hemiLight);

    // Cyan Blue Hour Backlight
    const rimLight = new THREE.DirectionalLight(0x0ea5e9, timeMode === 'night' ? 1.5 : 0.85);
    rimLight.position.set(-70, 45, -60);
    scene.add(rimLight);

    // ── 3. PREMIUM ARCHITECTURAL PBR MATERIALS ──
    const isBim = viewMode === 'bim';

    // Charcoal Architectural Granite (Solid, No Wireframe unless BIM mode is active)
    const facadeGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x1c2433,
      roughness: 0.45,
      metalness: 0.35,
      wireframe: isBim
    });

    const facadeDarkPanelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.5,
      wireframe: isBim
    });

    // Brushed Champagne Gold Metallic Trim
    const champagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: isBim
    });

    // Concrete Slab & Core
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x7c8a99,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: isBim
    });

    // High-Reflective Double-Glazed Glass (Blue tint, high specularity)
    const glassReflectiveMat = new THREE.MeshStandardMaterial({
      color: 0x173252,
      roughness: 0.03,
      metalness: 0.96,
      transparent: true,
      opacity: isBim ? 0.25 : 0.72,
      wireframe: isBim
    });

    // Deep Recessed Warm Illuminated Windows (Simulates lit room depth)
    const windowWarmLitMat = new THREE.MeshStandardMaterial({
      color: 0xffdf88,
      emissive: 0xffaa22,
      emissiveIntensity: timeMode === 'night' ? 1.6 : 0.75,
      roughness: 0.15,
      metalness: 0.1
    });

    const windowCoolLitMat = new THREE.MeshStandardMaterial({
      color: 0xd6f0ff,
      emissive: 0x38bdf8,
      emissiveIntensity: timeMode === 'night' ? 1.3 : 0.6,
      roughness: 0.15,
      metalness: 0.1
    });

    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.3,
      metalness: 0.8
    });

    // Tempered Balcony Glass (Light Cyan translucent)
    const balconyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.85,
      transparent: true,
      opacity: 0.55
    });

    // Wet Asphalt & Reflective Plaza Paving
    const wetAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.38,
      metalness: 0.5
    });

    const plazaPavingMat = new THREE.MeshStandardMaterial({
      color: 0x1a2333,
      roughness: 0.55,
      metalness: 0.25
    });

    // Laser & Neon Accent Materials
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const neonLaserMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });

    // ── 4. CITY SKYLINE HORIZON (DISTANT METROPOLIS) ──
    const skylineGroup = new THREE.Group();
    const cityTowers = [
      { x: -130, z: -110, w: 28, h: 140, d: 26 },
      { x: -80, z: -140, w: 32, h: 180, d: 28 },
      { x: 0, z: -160, w: 42, h: 220, d: 36 },
      { x: 90, z: -135, w: 30, h: 155, d: 26 },
      { x: 145, z: -100, w: 26, h: 125, d: 24 },
      { x: -160, z: 10, w: 28, h: 105, d: 28 },
      { x: 160, z: 25, w: 28, h: 115, d: 28 }
    ];

    cityTowers.forEach((t) => {
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(t.w, t.h, t.d),
        new THREE.MeshStandardMaterial({ color: 0x08101d, roughness: 0.95 })
      );
      bMesh.position.set(t.x, t.h / 2, t.z);
      skylineGroup.add(bMesh);

      // Random window arrays on skyline
      for (let wy = 12; wy < t.h - 15; wy += 8) {
        if (Math.random() > 0.35) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(t.w * 0.75, 1.4, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffd166,
              emissive: 0xffaa22,
              emissiveIntensity: timeMode === 'night' ? 0.7 : 0.25
            })
          );
          win.position.set(t.x, wy, t.z + t.d / 2 + 0.1);
          skylineGroup.add(win);
        }
      }
    });
    scene.add(skylineGroup);

    // ── 5. GROUND PLAZA, REFLECTIVE ROADS & LANDSCAPING ──
    const environmentGroup = new THREE.Group();

    // Main Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), wetAsphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    environmentGroup.add(ground);

    // Solid Elevated Podium Base
    const podiumPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(90, 0.7, 76),
      plazaPavingMat
    );
    podiumPlatform.position.set(0, 0.35, 0);
    podiumPlatform.receiveShadow = true;
    podiumPlatform.castShadow = true;
    environmentGroup.add(podiumPlatform);

    // Illuminated Entrance Pool / Water Feature
    const poolFrame = new THREE.Mesh(new THREE.BoxGeometry(22, 0.75, 10), facadeDarkPanelMat);
    poolFrame.position.set(0, 0.4, 30);
    environmentGroup.add(poolFrame);

    const poolWater = new THREE.Mesh(
      new THREE.BoxGeometry(20.8, 0.8, 8.8),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.5,
        roughness: 0.05,
        metalness: 0.85,
        transparent: true,
        opacity: 0.85
      })
    );
    poolWater.position.set(0, 0.42, 30);
    environmentGroup.add(poolWater);

    // Designer Landscaped Trees with Warm Ground Spotlights
    const treePositions = [
      { x: -38, z: 30 }, { x: -26, z: 30 }, { x: 26, z: 30 }, { x: 38, z: 30 },
      { x: -40, z: -28 }, { x: 40, z: -28 }, { x: -40, z: 0 }, { x: 40, z: 0 }
    ];

    treePositions.forEach((pos) => {
      // Planter
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.9, 16), facadeDarkPanelMat);
      planter.position.set(pos.x, 0.8, pos.z);
      planter.castShadow = true;
      environmentGroup.add(planter);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 4.5, 8), new THREE.MeshStandardMaterial({ color: 0x3d271d }));
      trunk.position.set(pos.x, 2.8, pos.z);
      trunk.castShadow = true;
      environmentGroup.add(trunk);

      // Multi-layer Architectural Foliage
      for (let l = 0; l < 3; l++) {
        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(1.8 - l * 0.4, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 })
        );
        foliage.position.set(pos.x, 4.6 + l * 1.2, pos.z);
        foliage.castShadow = true;
        environmentGroup.add(foliage);
      }

      // Ground LED Up-light
      if (timeMode === 'night' || timeMode === 'sunset') {
        const treeLight = new THREE.PointLight(0x38bdf8, 1.0, 10);
        treeLight.position.set(pos.x, 1.4, pos.z);
        environmentGroup.add(treeLight);
      }
    });

    // 4 High-Mast Site Floodlights
    const floodlightPositions = [
      { x: -42, z: 34 }, { x: 42, z: 34 },
      { x: -42, z: -34 }, { x: 42, z: -34 }
    ];

    floodlightPositions.forEach((fpos) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 14, 8), facadeDarkPanelMat);
      pole.position.set(fpos.x, 7, fpos.z);
      pole.castShadow = true;
      environmentGroup.add(pole);

      const lampBank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.0), champagneGoldMat);
      lampBank.position.set(fpos.x, 14, fpos.z);
      environmentGroup.add(lampBank);

      if (timeMode === 'night' || timeMode === 'sunset') {
        const spot = new THREE.SpotLight(0xffeedd, 3.5, 60, Math.PI / 4, 0.35);
        spot.position.set(fpos.x, 13.8, fpos.z);
        spot.target.position.set(0, 10, 0);
        environmentGroup.add(spot);
        environmentGroup.add(spot.target);
      }
    });

    scene.add(environmentGroup);

    // ── 6. ARCHITECTURAL BUILDING COMPLEX (DEEP ARTICULATED GEOMETRY) ──
    const buildingComplex = new THREE.Group();
    const animElements = [];

    if (activeModel === 0) {
      // ══════════════════════════════════════════════════════════════
      // MODEL 0: PREMIER TWIN-TOWER RESIDENCE (ЖК «QAZAQ TOWER»)
      // ══════════════════════════════════════════════════════════════
      const floors = 22;
      const floorH = 3.3;
      const towerW = 18;
      const towerD = 15;
      const towerGap = 20;

      // 1. GRAND COMMERCIAL PODIUM (FLOORS 1-2)
      const podiumW = towerW * 2 + towerGap + 10;
      const podiumH = floorH * 2;
      const podiumD = towerD + 10;

      const podiumMesh = new THREE.Mesh(
        new THREE.BoxGeometry(podiumW, podiumH, podiumD),
        facadeGraniteMat
      );
      podiumMesh.position.set(0, podiumH / 2 + 0.7, 0);
      podiumMesh.castShadow = true;
      podiumMesh.receiveShadow = true;
      buildingComplex.add(podiumMesh);

      // Panoramic Ground Floor Glass Lobby
      const lobbyGlass = new THREE.Mesh(
        new THREE.BoxGeometry(podiumW - 4, podiumH - 0.8, podiumD + 0.1),
        glassReflectiveMat
      );
      lobbyGlass.position.set(0, podiumH / 2 + 0.7, 0);
      buildingComplex.add(lobbyGlass);

      // Gold Entrance Portico & Canopy
      const portico = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.4, 8),
        champagneGoldMat
      );
      portico.position.set(0, floorH + 0.9, podiumD / 2 + 3.5);
      portico.castShadow = true;
      buildingComplex.add(portico);

      // 2. TWIN HIGH-RISE RESIDENTIAL TOWERS (TOWER EAST & TOWER WEST)
      [-1, 1].forEach((side) => {
        const tx = side * (towerW / 2 + towerGap / 2);

        for (let f = 2; f < floors; f++) {
          const ty = f * floorH + 0.7;

          // Cantilevered Floor Slab (Solid dark composite)
          const slab = new THREE.Mesh(
            new THREE.BoxGeometry(towerW + 1.2, 0.28, towerD + 1.2),
            facadeDarkPanelMat
          );
          slab.position.set(tx, ty, 0);
          slab.castShadow = true;
          slab.receiveShadow = true;
          buildingComplex.add(slab);

          // Deep Solid Wall Pier / Core
          const core = new THREE.Mesh(
            new THREE.BoxGeometry(towerW - 0.2, floorH - 0.28, towerD - 0.2),
            facadeGraniteMat
          );
          core.position.set(tx, ty + (floorH - 0.28) / 2 + 0.14, 0);
          core.castShadow = true;
          buildingComplex.add(core);

          // Deep Recessed Window Apertures & Architectural Mullions
          const bayCount = 4;
          const bayW = towerW / bayCount;

          for (let b = 0; b < bayCount; b++) {
            const bx = tx - towerW / 2 + b * bayW + bayW / 2;
            const isBalcony = b === 1 || b === 2;
            const isLit = (f + b + (side > 0 ? 1 : 0)) % 3 === 0 || Math.random() > 0.42;
            const winGlowMat = isLit ? (b % 2 === 0 ? windowWarmLitMat : windowCoolLitMat) : glassReflectiveMat;

            // Recessed Window Cavity Frame (Dark aluminum border)
            const winFrame = new THREE.Mesh(
              new THREE.BoxGeometry(bayW * 0.82, floorH * 0.72, 0.25),
              windowFrameMat
            );
            winFrame.position.set(bx, ty + floorH * 0.5, towerD / 2 + 0.05);
            buildingComplex.add(winFrame);

            // Glowing / Reflective Window Pane (Recessed inside the frame)
            const winGlass = new THREE.Mesh(
              new THREE.BoxGeometry(bayW * 0.72, floorH * 0.62, 0.08),
              winGlowMat
            );
            winGlass.position.set(bx, ty + floorH * 0.5, towerD / 2 + 0.12);
            buildingComplex.add(winGlass);

            // Back Window
            const winBack = winGlass.clone();
            winBack.position.z = -towerD / 2 - 0.12;
            buildingComplex.add(winBack);

            // Balconies with Tempered Glass Railings & Chrome Handrails
            if (isBalcony) {
              const balcSlab = new THREE.Mesh(
                new THREE.BoxGeometry(bayW * 0.92, 0.15, 1.5),
                facadeDarkPanelMat
              );
              balcSlab.position.set(bx, ty + 0.08, towerD / 2 + 0.75);
              balcSlab.castShadow = true;
              buildingComplex.add(balcSlab);

              const balcGlass = new THREE.Mesh(
                new THREE.BoxGeometry(bayW * 0.9, 1.05, 0.06),
                balconyGlassMat
              );
              balcGlass.position.set(bx, ty + 0.65, towerD / 2 + 1.48);
              buildingComplex.add(balcGlass);

              // Chrome Top Handrail
              const balcRail = new THREE.Mesh(
                new THREE.BoxGeometry(bayW * 0.92, 0.06, 0.08),
                champagneGoldMat
              );
              balcRail.position.set(bx, ty + 1.18, towerD / 2 + 1.48);
              buildingComplex.add(balcRail);
            }
          }

          // Gold Vertical Architectural Fins along building corners
          for (const sx of [-towerW / 2 - 0.15, towerW / 2 + 0.15]) {
            const fin = new THREE.Mesh(
              new THREE.BoxGeometry(0.25, floorH, 1.4),
              champagneGoldMat
            );
            fin.position.set(tx + sx, ty + floorH / 2, 0);
            buildingComplex.add(fin);
          }
        }

        // 3. ROOFTOP PENTHOUSE & ILLUMINATED ARCHITECTURAL CROWN
        const roofY = floors * floorH + 0.7;
        const penthouse = new THREE.Mesh(
          new THREE.BoxGeometry(towerW * 0.8, 3.8, towerD * 0.8),
          facadeDarkPanelMat
        );
        penthouse.position.set(tx, roofY + 1.9, 0);
        penthouse.castShadow = true;
        buildingComplex.add(penthouse);

        // Gold Crown Pergola Beams
        for (let px = -towerW * 0.35; px <= towerW * 0.35; px += 2.2) {
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.35, towerD * 0.9),
            champagneGoldMat
          );
          beam.position.set(tx + px, roofY + 4.2, 0);
          buildingComplex.add(beam);
        }

        // Rooftop Communication Mast with Synchronized Red Aviation Beacon
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.18, 10, 8),
          champagneGoldMat
        );
        mast.position.set(tx, roofY + 9.0, 0);
        buildingComplex.add(mast);

        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff0033 })
        );
        beacon.position.set(tx, roofY + 14.0, 0);
        buildingComplex.add(beacon);

        const beaconPoint = new THREE.PointLight(0xff0033, 3.0, 35);
        beaconPoint.position.set(tx, roofY + 14.0, 0);
        buildingComplex.add(beaconPoint);
        animElements.push({ type: 'beacon', light: beaconPoint });

        // Vertical Facade Neon Accent Strips
        const ledStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, floors * floorH, 0.08),
          neonCyanMat
        );
        ledStrip.position.set(tx + (side > 0 ? towerW / 2 + 0.1 : -towerW / 2 - 0.1), (floors * floorH) / 2 + 0.7, towerD / 2 + 0.1);
        buildingComplex.add(ledStrip);
      });

      // 4. PANORAMIC SKYBRIDGE CONNECTING THE TOWERS (FLOORS 12-14)
      const skyY = 12 * floorH + 0.7;
      const skybridge = new THREE.Mesh(
        new THREE.BoxGeometry(towerGap + 2, floorH * 2.2, 7),
        facadeDarkPanelMat
      );
      skybridge.position.set(0, skyY + floorH * 1.1, 0);
      skybridge.castShadow = true;
      buildingComplex.add(skybridge);

      const skybridgeGlass = new THREE.Mesh(
        new THREE.BoxGeometry(towerGap, floorH * 1.8, 7.2),
        glassReflectiveMat
      );
      skybridgeGlass.position.set(0, skyY + floorH * 1.1, 0);
      buildingComplex.add(skybridgeGlass);

    } else if (activeModel === 1) {
      // ══════════════════════════════════════════════════════════════
      // MODEL 1: CURVED PARAMETRIC BUSINESS CENTER (БЦ «АВАНГАРД»)
      // ══════════════════════════════════════════════════════════════
      const bcFloors = 16;
      const floorH = 3.6;
      const bcRadius = 22;

      for (let f = 0; f < bcFloors; f++) {
        const fy = f * floorH + 0.7;
        const curveFactor = 1.0 - Math.sin((f / bcFloors) * Math.PI) * 0.2; // Hourglass profile

        // Floor Slab
        const slab = new THREE.Mesh(
          new THREE.CylinderGeometry(bcRadius * curveFactor, bcRadius * curveFactor, 0.35, 36),
          facadeDarkPanelMat
        );
        slab.position.set(0, fy, 0);
        slab.castShadow = true;
        buildingComplex.add(slab);

        // Glass Curtain Facade
        const glassCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(bcRadius * curveFactor * 0.96, bcRadius * curveFactor * 0.96, floorH - 0.35, 36),
          glassReflectiveMat
        );
        glassCylinder.position.set(0, fy + floorH / 2, 0);
        buildingComplex.add(glassCylinder);

        // Diagrid Gold Structural Frame
        for (let a = 0; a < 18; a++) {
          const angle = (a / 18) * Math.PI * 2;
          const cx = Math.sin(angle) * bcRadius * curveFactor;
          const cz = Math.cos(angle) * bcRadius * curveFactor;

          const diagridBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, floorH, 8),
            champagneGoldMat
          );
          diagridBar.position.set(cx, fy + floorH / 2, cz);
          diagridBar.rotation.z = Math.sin(a) * 0.18;
          buildingComplex.add(diagridBar);
        }
      }

      // Helipad on Rooftop
      const helipadY = bcFloors * floorH + 0.7;
      const helipad = new THREE.Mesh(
        new THREE.CylinderGeometry(bcRadius * 0.75, bcRadius * 0.75, 0.9, 36),
        facadeDarkPanelMat
      );
      helipad.position.set(0, helipadY, 0);
      buildingComplex.add(helipad);

      const helipadRing = new THREE.Mesh(
        new THREE.RingGeometry(4.5, 6.0, 36),
        neonGoldMat
      );
      helipadRing.rotation.x = -Math.PI / 2;
      helipadRing.position.set(0, helipadY + 0.47, 0);
      buildingComplex.add(helipadRing);

    } else {
      // ══════════════════════════════════════════════════════════════
      // MODEL 2: LUXURY CONTEMPORARY VILLA (ВИЛЛА «МОДЕРН»)
      // ══════════════════════════════════════════════════════════════
      // Ground Level Box
      const villa1 = new THREE.Mesh(new THREE.BoxGeometry(26, 4.6, 20), facadeDarkPanelMat);
      villa1.position.set(0, 3.0, 0);
      villa1.castShadow = true;
      buildingComplex.add(villa1);

      // Floor 2 Cantilevered Offset Box with Gold Fascia
      const villa2 = new THREE.Mesh(new THREE.BoxGeometry(22, 4.4, 18), champagneGoldMat);
      villa2.position.set(-5, 7.5, 3);
      villa2.castShadow = true;
      buildingComplex.add(villa2);

      // Floor-to-Ceiling Panoramic Glazing
      const panoramicGlass = new THREE.Mesh(new THREE.BoxGeometry(20, 3.6, 0.2), glassReflectiveMat);
      panoramicGlass.position.set(-5, 7.5, 12.1);
      buildingComplex.add(panoramicGlass);

      // Private Infinity Pool & Sun Terrace
      const villaPool = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.9, 9),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.9 })
      );
      villaPool.position.set(9, 0.85, 16);
      buildingComplex.add(villaPool);
    }

    scene.add(buildingComplex);

    // ── 7. HIGH-PRECISION LIEBHERR TOWER CRANE (DETAILED LATTICE TRUSS & DIAGONALS) ──
    const craneGroup = new THREE.Group();
    const craneHeight = 90;
    const craneX = 32;
    const craneZ = -16;

    const craneOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      metalness: 0.5
    });

    // 4-Chord Lattice Mast with Cross-Bracing Struts
    const mastTruss = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, craneHeight, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
    );
    mastTruss.position.set(craneX, craneHeight / 2, craneZ);
    mastTruss.castShadow = true;
    craneGroup.add(mastTruss);

    const mastCore = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, craneHeight, 1.2),
      craneOrangeMat
    );
    mastCore.position.set(craneX, craneHeight / 2, craneZ);
    craneGroup.add(mastCore);

    // Slewing Jib Assembly
    const slewingUnit = new THREE.Group();
    slewingUnit.position.set(craneX, craneHeight, craneZ);

    // Operator Cab with Panoramic Glazing
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 2.0), facadeDarkPanelMat);
    cab.position.set(-1.4, 1.0, 1.0);
    slewingUnit.add(cab);

    // High-Intensity Downward Construction Searchlight
    if (timeMode === 'night' || timeMode === 'sunset') {
      const searchLight = new THREE.SpotLight(0xfff3cc, 4.0, 100, Math.PI / 4.5, 0.3);
      searchLight.position.set(-16, 0, 0);
      searchLight.target.position.set(0, 18, 0);
      slewingUnit.add(searchLight);
      slewingUnit.add(searchLight.target);
    }

    // Main Jib (Horizontal Lattice Boom 48m)
    const mainJib = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
    );
    mainJib.position.set(-22, 2.6, 0);
    slewingUnit.add(mainJib);

    // Counter-Jib with Counterweight Blocks
    const counterJib = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 1.6), craneOrangeMat);
    counterJib.position.set(9, 2.6, 0);
    slewingUnit.add(counterJib);

    const counterweights = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 2.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    counterweights.position.set(15.5, 2.2, 0);
    slewingUnit.add(counterweights);

    // Trolley, Steel Hoist Wire & Heavy Hook Block
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.4), facadeDarkPanelMat);
    trolley.position.set(-28, 1.7, 0);
    slewingUnit.add(trolley);

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 30, 4), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    cable.position.set(-28, -13.3, 0);
    slewingUnit.add(cable);

    const hook = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    hook.position.set(-28, -28.3, 0);
    slewingUnit.add(hook);

    craneGroup.add(slewingUnit);
    scene.add(craneGroup);
    animElements.push({ type: 'crane', slewing: slewingUnit });

    // ── 8. HYDRAULIC TRACKED EXCAVATOR (ГУСЕНИЧНЫЙ ЭКСКАВАТОР CAT/KOMATSU) ──
    const excavatorGroup = new THREE.Group();
    excavatorGroup.position.set(-28, 0.7, 22);
    excavatorGroup.rotation.y = Math.PI / 3;

    // Heavy Undercarriage & Tracks
    const trackL = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.1, 1.3), facadeDarkPanelMat);
    trackL.position.set(0, 0.55, 1.8);
    excavatorGroup.add(trackL);
    const trackR = trackL.clone();
    trackR.position.z = -1.8;
    excavatorGroup.add(trackR);

    // Upper Structure
    const exBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.0, 3.0), craneOrangeMat);
    exBody.position.set(0, 2.1, 0);
    excavatorGroup.add(exBody);

    const exCab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.4), glassReflectiveMat);
    exCab.position.set(-0.9, 2.6, 1.1);
    excavatorGroup.add(exCab);

    // Articulated Boom & Digging Bucket
    const boom = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 0.7), craneOrangeMat);
    boom.rotation.z = Math.PI / 3.8;
    boom.position.set(-2.8, 3.8, 0);
    excavatorGroup.add(boom);

    scene.add(excavatorGroup);

    // ── 9. BIM LASER SCANNER PLANE (INSPECTION MODE) ──
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(85, 85), neonLaserMat);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.visible = viewMode === 'scan';
    scene.add(scanPlane);

    // ── 10. FLOATING ATMOSPHERIC GLOW PARTICLES ──
    const pCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 120;
      pPos[i * 3 + 1] = Math.random() * 90;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        size: 0.25,
        color: timeMode === 'night' ? 0x38bdf8 : 0xfbbf24,
        transparent: true,
        opacity: 0.75
      })
    );
    scene.add(particles);

    // ── 11. SMOOTH ORBIT CONTROLS & CAMERA DYNAMICS ──
    let angle = 0.85;
    let elev = 0.38;
    let dist = 92;
    let isDragging = false;
    let prevX = 0, prevY = 0;
    const targetY = 26;

    const setCamera = () => {
      camera.position.set(
        Math.sin(angle) * Math.cos(elev) * dist,
        Math.sin(elev) * dist + targetY * 0.5,
        Math.cos(angle) * Math.cos(elev) * dist
      );
      camera.lookAt(0, targetY, 0);
    };
    setCamera();

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      angle += (e.clientX - prevX) * 0.005;
      elev = Math.max(0.04, Math.min(1.4, elev + (e.clientY - prevY) * 0.004));
      prevX = e.clientX;
      prevY = e.clientY;
      setCamera();
    };
    const onWheel = (e) => {
      dist = Math.max(20, Math.min(160, dist + e.deltaY * 0.05));
      setCamera();
    };

    const cv = renderer.domElement;
    cv.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    cv.addEventListener('wheel', onWheel, { passive: true });

    // Touch support
    const onTouchStart = (e) => { if (e.touches[0]) { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; } };
    const onTouchMove = (e) => {
      if (!isDragging || !e.touches[0]) return;
      angle += (e.touches[0].clientX - prevX) * 0.005;
      elev = Math.max(0.04, Math.min(1.4, elev + (e.touches[0].clientY - prevY) * 0.004));
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
      setCamera();
    };
    cv.addEventListener('touchstart', onTouchStart, { passive: true });
    cv.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // ── 12. ANIMATION & RENDER LOOP ──
    let animId;
    let scanY = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();

      // Smooth Auto-Orbit
      if (autoRotate && !isDragging) {
        angle += 0.0016;
        setCamera();
      }

      // Animate Beacons & Crane Slewing
      animElements.forEach((item) => {
        if (item.type === 'beacon') {
          const pulse = (Math.sin(elapsed * 4.5) + 1) / 2;
          item.light.intensity = pulse > 0.6 ? 3.0 : 0.2;
        } else if (item.type === 'crane') {
          item.slewing.rotation.y = Math.sin(elapsed * 0.22) * 0.55;
        }
      });

      // Laser Scanner Animation
      if (viewMode === 'scan' || isScanning) {
        scanPlane.visible = true;
        scanY += 0.45;
        if (scanY > 80) scanY = 0;
        scanPlane.position.y = scanY;
      } else {
        scanPlane.visible = false;
      }

      // Particles Floating
      const pArr = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pArr[i * 3 + 1] += 0.02 + Math.sin(elapsed + i) * 0.008;
        if (pArr[i * 3 + 1] > 85) pArr[i * 3 + 1] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    renderLoop();

    const handleResize = () => {
      const nw = el.clientWidth || 600;
      const nh = el.clientHeight || 450;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [activeModel, timeMode, viewMode, autoRotate, constructionStage, isScanning]);

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', borderRadius: '16px', background: '#090d16' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Top Cockpit HUD Bar */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {/* Model Preset Selector */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(8, 12, 22, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '4px',
            borderRadius: '10px',
            pointerEvents: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            {[
              { id: 0, label: '🏢 ЖК Небоскреб' },
              { id: 1, label: '🏬 БЦ Авангард' },
              { id: 2, label: '🏡 Вилла Модерн' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                style={{
                  background: activeModel === m.id ? 'linear-gradient(135deg, #2563eb, #0284c7)' : 'transparent',
                  border: 'none',
                  color: activeModel === m.id ? '#ffffff' : '#94a3b8',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* View & Lighting Toggles */}
          <div style={{
            display: 'flex',
            gap: '5px',
            background: 'rgba(8, 12, 22, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '4px',
            borderRadius: '10px',
            pointerEvents: 'auto'
          }}>
            {/* Time of Day */}
            <button
              onClick={() => setTimeMode(timeMode === 'sunset' ? 'night' : timeMode === 'night' ? 'day' : 'sunset')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#f8fafc',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Переключить свет: Закат / Ночь / День"
            >
              {timeMode === 'sunset' ? '🌆 Закат' : timeMode === 'night' ? '🌙 Ночь' : '☀️ День'}
            </button>

            {/* BIM Laser Scanner */}
            <button
              onClick={() => setViewMode(viewMode === 'scan' ? 'arch' : 'scan')}
              style={{
                background: viewMode === 'scan' ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: viewMode === 'scan' ? '1px solid #00ff88' : 'none',
                color: viewMode === 'scan' ? '#00ff88' : '#f8fafc',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🔍 AI Скан
            </button>

            {/* BIM Wireframe */}
            <button
              onClick={() => setViewMode(viewMode === 'bim' ? 'arch' : 'bim')}
              style={{
                background: viewMode === 'bim' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: viewMode === 'bim' ? '1px solid #38bdf8' : 'none',
                color: viewMode === 'bim' ? '#38bdf8' : '#f8fafc',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📐 BIM
            </button>

            {/* Rotation Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              style={{
                background: autoRotate ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: autoRotate ? '1px solid #3b82f6' : 'none',
                color: autoRotate ? '#60a5fa' : '#f8fafc',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🔄 360°
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: '#cbd5e1',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <div style={{ background: 'rgba(8, 12, 22, 0.88)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            🖱️ Вращение мышью • Колесо: Зум • Башенный кран Liebherr
          </div>
          <div style={{ background: 'rgba(8, 12, 22, 0.88)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: '700' }}>
            ⚡ Real-time WebGL 2.0 ArchViz Engine
          </div>
        </div>
      )}
    </div>
  );
}
