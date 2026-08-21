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

  // Building Presets: 0 = 'ЖК Небоскреб (Twin Tower)', 1 = 'Бизнес-Центр Стеклянный', 2 = 'Коттедж/Вилла Модерн'
  const [activeModel, setActiveModel] = useState(sampleIndex % 3);
  const [timeMode, setTimeMode] = useState('sunset'); // 'sunset' | 'night' | 'day'
  const [viewMode, setViewMode] = useState(isScanning ? 'scan' : 'arch'); // 'arch' | 'scan' | 'bim'
  const [cameraPreset, setCameraPreset] = useState('drone'); // 'drone' | 'ground' | 'crane' | 'roof'
  const [autoRotate, setAutoRotate] = useState(true);
  const [showMachinery, setShowMachinery] = useState(true);

  // Sync external scanning prop
  useEffect(() => {
    if (isScanning) setViewMode('scan');
  }, [isScanning]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    if (cleanupRef.current) cleanupRef.current();

    const W = el.clientWidth || 600;
    const H = el.clientHeight || 450;

    // ── 1. SCENE, RENDERER & POST-PROCESSING TONE MAPPING ──
    const scene = new THREE.Scene();
    
    // Dynamic Sky Fog & Background Color
    const fogColor = timeMode === 'night' ? 0x050a15 : timeMode === 'day' ? 0xcbe3f8 : 0x0d1527;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, timeMode === 'night' ? 0.009 : 0.008);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000);
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
    renderer.toneMappingExposure = timeMode === 'night' ? 1.35 : timeMode === 'day' ? 1.05 : 1.2;
    el.appendChild(renderer.domElement);

    // ── 2. CINEMATIC MULTI-TIER LIGHTING RIG ──
    const ambientLight = new THREE.AmbientLight(
      timeMode === 'night' ? 0x14223d : timeMode === 'day' ? 0x7393b3 : 0x2d4469,
      timeMode === 'night' ? 0.9 : 1.3
    );
    scene.add(ambientLight);

    // Sun / Moon Key Light
    const sunColor = timeMode === 'night' ? 0x99ccff : timeMode === 'day' ? 0xfff6e8 : 0xff9944;
    const sunIntensity = timeMode === 'night' ? 0.9 : timeMode === 'day' ? 2.4 : 2.0;
    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(55, 95, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -65;
    sun.shadow.camera.right = 65;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -40;
    sun.shadow.camera.near = 15;
    sun.shadow.camera.far = 250;
    sun.shadow.bias = -0.0003;
    scene.add(sun);

    // Architectural Sky Dome Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(
      timeMode === 'night' ? 0x1e3a5f : 0xb0d0f0,
      timeMode === 'night' ? 0x050d1a : 0x223344,
      0.65
    );
    scene.add(hemiLight);

    // Cyan/Gold Atmospheric Rim Light
    const rimLight = new THREE.DirectionalLight(
      timeMode === 'night' ? 0x38bdf8 : 0xf59e0b,
      timeMode === 'night' ? 1.4 : 0.8
    );
    rimLight.position.set(-60, 40, -50);
    scene.add(rimLight);

    // ── 3. HIGH-PERFORMANCE PROCEDURAL PBR MATERIALS ──
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x121a29,
      roughness: 0.35,
      metalness: 0.65,
      wireframe: viewMode === 'bim'
    });

    const brushedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: viewMode === 'bim'
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x8a99a8,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: viewMode === 'bim'
    });

    const glassCurtainWall = new THREE.MeshStandardMaterial({
      color: 0x13385e,
      roughness: 0.04,
      metalness: 0.95,
      transparent: true,
      opacity: viewMode === 'bim' ? 0.3 : 0.78,
      wireframe: viewMode === 'bim'
    });

    const warmWindowGlow = new THREE.MeshStandardMaterial({
      color: 0xffdf88,
      emissive: 0xffaa22,
      emissiveIntensity: timeMode === 'night' ? 1.6 : 0.8,
      roughness: 0.15,
      metalness: 0.1
    });

    const coolWindowGlow = new THREE.MeshStandardMaterial({
      color: 0xd6f0ff,
      emissive: 0x38bdf8,
      emissiveIntensity: timeMode === 'night' ? 1.3 : 0.65,
      roughness: 0.15,
      metalness: 0.1
    });

    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
      roughness: 0.05,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    const wetAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x0b111e,
      roughness: 0.45,
      metalness: 0.4
    });

    const plazaStoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.2
    });

    const neonLaserMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    // ── 4. CITY SKYLINE SILHOUETTES & HORIZON ──
    const cityGroup = new THREE.Group();
    const bgSkyscrapers = [
      { x: -110, z: -100, w: 24, h: 120, d: 24 },
      { x: -70, z: -130, w: 30, h: 160, d: 26 },
      { x: 0, z: -140, w: 36, h: 190, d: 32 },
      { x: 80, z: -120, w: 28, h: 140, d: 24 },
      { x: 130, z: -90, w: 22, h: 110, d: 22 },
      { x: -140, z: 0, w: 25, h: 90, d: 25 },
      { x: 140, z: 20, w: 26, h: 100, d: 26 }
    ];

    bgSkyscrapers.forEach((b) => {
      const bgMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        new THREE.MeshStandardMaterial({ color: 0x091222, roughness: 0.9 })
      );
      bgMesh.position.set(b.x, b.h / 2, b.z);
      cityGroup.add(bgMesh);

      // Random window clusters on background skyline
      for (let wy = 8; wy < b.h - 10; wy += 6) {
        if (Math.random() > 0.4) {
          const winLight = new THREE.Mesh(
            new THREE.BoxGeometry(b.w * 0.7, 1.2, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffd580,
              emissive: 0xffaa33,
              emissiveIntensity: timeMode === 'night' ? 0.6 : 0.2
            })
          );
          winLight.position.set(b.x, wy, b.z + b.d / 2 + 0.1);
          cityGroup.add(winLight);
        }
      }
    });
    scene.add(cityGroup);

    // ── 5. GROUND, ROADS, PLAZA & URBAN LANDSCAPING ──
    const groundGroup = new THREE.Group();

    // Main Ground
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(450, 450), wetAsphaltMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.05;
    groundPlane.receiveShadow = true;
    groundGroup.add(groundPlane);

    // Podium Plaza Platform
    const podiumPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(82, 0.6, 68),
      plazaStoneMat
    );
    podiumPlatform.position.set(0, 0.3, 0);
    podiumPlatform.receiveShadow = true;
    podiumPlatform.castShadow = true;
    groundGroup.add(podiumPlatform);

    // Reflective Plaza Water Fountain / Pool at Entrance
    const fountainBase = new THREE.Mesh(new THREE.BoxGeometry(16, 0.7, 8), darkTitaniumMat);
    fountainBase.position.set(0, 0.35, 26);
    groundGroup.add(fountainBase);

    const fountainWater = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.75, 7.2), poolWaterMat);
    fountainWater.position.set(0, 0.38, 26);
    groundGroup.add(fountainWater);

    // Modern Landscaped Trees & Illuminated Planters
    const treePositions = [
      { x: -34, z: 26 }, { x: -24, z: 26 }, { x: 24, z: 26 }, { x: 34, z: 26 },
      { x: -36, z: -24 }, { x: 36, z: -24 }, { x: -36, z: 0 }, { x: 36, z: 0 }
    ];

    treePositions.forEach((pos) => {
      // Planter
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.8, 16), darkTitaniumMat);
      planter.position.set(pos.x, 0.7, pos.z);
      planter.castShadow = true;
      groundGroup.add(planter);

      // Tree Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.0, 8), new THREE.MeshStandardMaterial({ color: 0x3d271d }));
      trunk.position.set(pos.x, 2.5, pos.z);
      trunk.castShadow = true;
      groundGroup.add(trunk);

      // Layered Architectural Foliage
      for (let l = 0; l < 3; l++) {
        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(1.6 - l * 0.35, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
        );
        foliage.position.set(pos.x, 4.2 + l * 1.1, pos.z);
        foliage.castShadow = true;
        groundGroup.add(foliage);
      }

      // Ground LED Up-light
      if (timeMode === 'night' || timeMode === 'sunset') {
        const treeLight = new THREE.PointLight(0x38bdf8, 0.8, 8);
        treeLight.position.set(pos.x, 1.2, pos.z);
        groundGroup.add(treeLight);
      }
    });

    // Plaza Perimeter Floodlight Masts
    const floodlightPositions = [
      { x: -38, z: 30 }, { x: 38, z: 30 },
      { x: -38, z: -30 }, { x: 38, z: -30 }
    ];

    floodlightPositions.forEach((fpos) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 12, 8), darkTitaniumMat);
      pole.position.set(fpos.x, 6, fpos.z);
      pole.castShadow = true;
      groundGroup.add(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.8), brushedGoldMat);
      lampHead.position.set(fpos.x, 12, fpos.z);
      groundGroup.add(lampHead);

      if (timeMode === 'night' || timeMode === 'sunset') {
        const spot = new THREE.SpotLight(0xffeedd, 2.5, 45, Math.PI / 4, 0.4);
        spot.position.set(fpos.x, 11.8, fpos.z);
        spot.target.position.set(0, 8, 0);
        groundGroup.add(spot);
        groundGroup.add(spot.target);
      }
    });

    scene.add(groundGroup);

    // ── 6. ARCHITECTURAL MODELS (DYNAMIC SELECTION) ──
    const buildingGroup = new THREE.Group();
    const animElements = [];

    if (activeModel === 0) {
      // ═══════════════════════════════════════════════════════
      // MODEL 0: PREMIER TWIN-TOWER HIGH-RISE (ЖК Скай Тауэр)
      // ═══════════════════════════════════════════════════════
      const towerFloors = 22;
      const floorHeight = 3.3;
      const towerW = 16;
      const towerD = 14;
      const towerGap = 18; // Distance between Tower A & Tower B

      // Double-Height Commercial Podium
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(towerW * 2 + towerGap + 8, floorHeight * 2, towerD + 8),
        darkTitaniumMat
      );
      podium.position.set(0, floorHeight + 0.6, 0);
      podium.castShadow = true;
      buildingGroup.add(podium);

      // Glass Panoramic Lobby Showroom
      const lobbyGlass = new THREE.Mesh(
        new THREE.BoxGeometry(towerW * 2 + towerGap + 6, floorHeight * 1.8, towerD + 6),
        glassCurtainWall
      );
      lobbyGlass.position.set(0, floorHeight + 0.6, 0);
      buildingGroup.add(lobbyGlass);

      // Build Two Connected High-Rise Towers (Tower A & Tower B)
      [-1, 1].forEach((side) => {
        const tx = side * (towerW / 2 + towerGap / 2);

        for (let f = 2; f < towerFloors; f++) {
          const ty = f * floorHeight + 0.6;
          const isTopFloor = f === towerFloors - 1;

          // Floor Cantilever Slab
          const slab = new THREE.Mesh(
            new THREE.BoxGeometry(towerW + 1.2, 0.3, towerD + 1.2),
            darkTitaniumMat
          );
          slab.position.set(tx, ty, 0);
          slab.castShadow = true;
          buildingGroup.add(slab);

          // Glass Curtain Core
          const glassCore = new THREE.Mesh(
            new THREE.BoxGeometry(towerW, floorHeight - 0.3, towerD),
            glassCurtainWall
          );
          glassCore.position.set(tx, ty + (floorHeight - 0.3) / 2 + 0.15, 0);
          buildingGroup.add(glassCore);

          // Alternating Warm & Cool Interior Window Lights
          const bayCount = 4;
          const bayW = towerW / bayCount;
          for (let b = 0; b < bayCount; b++) {
            const bx = tx - towerW / 2 + b * bayW + bayW / 2;
            const isLit = (f + b + (side > 0 ? 1 : 0)) % 3 === 0 || Math.random() > 0.45;
            const winMat = isLit ? (b % 2 === 0 ? warmWindowGlow : coolWindowGlow) : glassCurtainWall;

            const winPanel = new THREE.Mesh(
              new THREE.BoxGeometry(bayW * 0.7, floorHeight * 0.68, 0.12),
              winMat
            );
            winPanel.position.set(bx, ty + floorHeight * 0.5, towerD / 2 + 0.08);
            buildingGroup.add(winPanel);

            const winBack = winPanel.clone();
            winBack.position.z = -towerD / 2 - 0.08;
            buildingGroup.add(winBack);
          }

          // Gold Vertical Architectural Fins
          for (const sx of [-towerW / 2 - 0.1, towerW / 2 + 0.1]) {
            const fin = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, floorHeight, 1.2),
              brushedGoldMat
            );
            fin.position.set(tx + sx, ty + floorHeight / 2, 0);
            buildingGroup.add(fin);
          }
        }

        // Rooftop Crown & Pergola
        const roofY = towerFloors * floorHeight + 0.6;
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(towerW * 0.8, 3.5, towerD * 0.8),
          darkTitaniumMat
        );
        crown.position.set(tx, roofY + 1.75, 0);
        buildingGroup.add(crown);

        // Flashing Red Beacon
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff0033 })
        );
        beacon.position.set(tx, roofY + 6.0, 0);
        buildingGroup.add(beacon);

        const beaconPoint = new THREE.PointLight(0xff0033, 2.5, 30);
        beaconPoint.position.set(tx, roofY + 6.0, 0);
        buildingGroup.add(beaconPoint);
        animElements.push({ type: 'beacon', light: beaconPoint });
      });

      // Skybridge (Connecting Floors 12-14)
      const skybridgeY = 12 * floorHeight + 0.6;
      const skybridge = new THREE.Mesh(
        new THREE.BoxGeometry(towerGap + 2, floorHeight * 2, 6),
        darkTitaniumMat
      );
      skybridge.position.set(0, skybridgeY + floorHeight, 0);
      skybridge.castShadow = true;
      buildingGroup.add(skybridge);

      const skybridgeGlass = new THREE.Mesh(
        new THREE.BoxGeometry(towerGap, floorHeight * 1.6, 6.2),
        glassCurtainWall
      );
      skybridgeGlass.position.set(0, skybridgeY + floorHeight, 0);
      buildingGroup.add(skybridgeGlass);

    } else if (activeModel === 1) {
      // ═══════════════════════════════════════════════════════
      // MODEL 1: CURVED PARAMETRIC BUSINESS CENTER (БЦ Авангард)
      // ═══════════════════════════════════════════════════════
      const bcFloors = 15;
      const floorH = 3.6;
      const bcRadius = 20;

      for (let f = 0; f < bcFloors; f++) {
        const fy = f * floorH + 0.6;
        const scale = 1.0 - Math.sin((f / bcFloors) * Math.PI) * 0.18; // Elegant hourglass curve

        // Elliptical Floor Slab
        const slab = new THREE.Mesh(
          new THREE.CylinderGeometry(bcRadius * scale, bcRadius * scale, 0.35, 32),
          darkTitaniumMat
        );
        slab.position.set(0, fy, 0);
        slab.castShadow = true;
        buildingGroup.add(slab);

        // Glass Curtain Facade
        const glassCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(bcRadius * scale * 0.96, bcRadius * scale * 0.96, floorH - 0.35, 32),
          glassCurtainWall
        );
        glassCylinder.position.set(0, fy + floorH / 2, 0);
        buildingGroup.add(glassCylinder);

        // Diagrid Gold Mullions
        for (let a = 0; a < 16; a++) {
          const angle = (a / 16) * Math.PI * 2;
          const colX = Math.sin(angle) * bcRadius * scale;
          const colZ = Math.cos(angle) * bcRadius * scale;

          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, floorH, 8),
            brushedGoldMat
          );
          col.position.set(colX, fy + floorH / 2, colZ);
          col.rotation.z = Math.sin(a) * 0.15;
          buildingGroup.add(col);
        }
      }

      // Rooftop Helipad & Sky Lounge
      const helipadY = bcFloors * floorH + 0.6;
      const helipad = new THREE.Mesh(
        new THREE.CylinderGeometry(bcRadius * 0.7, bcRadius * 0.7, 0.8, 32),
        darkTitaniumMat
      );
      helipad.position.set(0, helipadY, 0);
      buildingGroup.add(helipad);

      const helipadMarking = new THREE.Mesh(
        new THREE.RingGeometry(4, 5.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
      );
      helipadMarking.rotation.x = -Math.PI / 2;
      helipadMarking.position.set(0, helipadY + 0.42, 0);
      buildingGroup.add(helipadMarking);

    } else {
      // ═══════════════════════════════════════════════════════
      // MODEL 2: LUXURY CONTEMPORARY VILLA (Вилла Модерн)
      // ═══════════════════════════════════════════════════════
      // Multi-tier cantilevered cubic modernist residence
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(24, 4.5, 18), darkTitaniumMat);
      box1.position.set(0, 2.85, 0);
      box1.castShadow = true;
      buildingGroup.add(box1);

      // Floor 2 Cantilevered Offset Box
      const box2 = new THREE.Mesh(new THREE.BoxGeometry(20, 4.2, 16), brushedGoldMat);
      box2.position.set(-4, 7.2, 2);
      box2.castShadow = true;
      buildingGroup.add(box2);

      // Panoramic Glazing
      const panoramicGlass = new THREE.Mesh(new THREE.BoxGeometry(18, 3.4, 0.2), glassCurtainWall);
      panoramicGlass.position.set(-4, 7.2, 10.1);
      buildingGroup.add(panoramicGlass);

      // Private Infinity Pool
      const pool = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 8), poolWaterMat);
      pool.position.set(8, 0.8, 14);
      buildingGroup.add(pool);

      const poolDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 12), darkTitaniumMat);
      poolDeck.position.set(8, 0.5, 14);
      buildingGroup.add(poolDeck);
    }

    scene.add(buildingGroup);

    // ── 7. CONSTRUCTION SITE EQUIPMENT (HEAVY MACHINERY) ──
    const machineryGroup = new THREE.Group();

    if (showMachinery) {
      // A. LIEBHERR TOWER CRANE (DETAILED LATTICE TRUSS)
      const craneHeight = 85;
      const craneX = 30;
      const craneZ = -15;

      const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.5 });
      const craneTruss = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, craneHeight, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
      );
      craneTruss.position.set(craneX, craneHeight / 2, craneZ);
      craneTruss.castShadow = true;
      machineryGroup.add(craneTruss);

      // Slewing Crane Arm Assembly
      const slewingUnit = new THREE.Group();
      slewingUnit.position.set(craneX, craneHeight, craneZ);

      const craneCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 1.8), darkTitaniumMat);
      craneCab.position.set(-1.2, 0.8, 0.8);
      slewingUnit.add(craneCab);

      // Downward Crane Spotlight
      if (timeMode === 'night' || timeMode === 'sunset') {
        const craneSpot = new THREE.SpotLight(0xfff4cc, 3.0, 90, Math.PI / 5, 0.3);
        craneSpot.position.set(-15, 0, 0);
        craneSpot.target.position.set(0, 15, 0);
        slewingUnit.add(craneSpot);
        slewingUnit.add(craneSpot.target);
      }

      const mainJib = new THREE.Mesh(
        new THREE.BoxGeometry(45, 1.6, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
      );
      mainJib.position.set(-20, 2.4, 0);
      slewingUnit.add(mainJib);

      const counterJib = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 1.4), craneMat);
      counterJib.position.set(8, 2.4, 0);
      slewingUnit.add(counterJib);

      const counterweight = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.5, 2.0), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      counterweight.position.set(14, 2.0, 0);
      slewingUnit.add(counterweight);

      // Trolley, Cable & Heavy Hook Block
      const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.2), darkTitaniumMat);
      trolley.position.set(-26, 1.6, 0);
      slewingUnit.add(trolley);

      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 26, 4), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
      cable.position.set(-26, -11.5, 0);
      slewingUnit.add(cable);

      const hook = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
      hook.position.set(-26, -24.5, 0);
      slewingUnit.add(hook);

      machineryGroup.add(slewingUnit);
      animElements.push({ type: 'crane', slewing: slewingUnit });

      // B. TRACKED HYDRAULIC EXCAVATOR (Гусеничный экскаватор)
      const excavator = new THREE.Group();
      excavator.position.set(-26, 0.6, 20);
      excavator.rotation.y = Math.PI / 3;

      // Heavy Tracks
      const trackL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.0, 1.2), darkTitaniumMat);
      trackL.position.set(0, 0.5, 1.6);
      excavator.add(trackL);
      const trackR = trackL.clone();
      trackR.position.z = -1.6;
      excavator.add(trackR);

      // Excavator Body & Cabin
      const exBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 2.8), craneMat);
      exBody.position.set(0, 2.0, 0);
      excavator.add(exBody);

      const exCab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.2), glassCurtainWall);
      exCab.position.set(-0.8, 2.4, 1.0);
      excavator.add(exCab);

      // Articulated Boom & Bucket
      const boom = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 0.6), craneMat);
      boom.rotation.z = Math.PI / 4;
      boom.position.set(-2.6, 3.5, 0);
      excavator.add(boom);

      machineryGroup.add(excavator);
    }
    scene.add(machineryGroup);

    // ── 8. BIM LASER SCANNER PLANE ──
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(75, 75), neonLaserMat);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.visible = viewMode === 'scan';
    scene.add(scanPlane);

    // ── 9. ATMOSPHERIC ARCHITECTURAL DUST & GLOW MOTES ──
    const pCount = 250;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 110;
      pPos[i * 3 + 1] = Math.random() * 85;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 110;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      color: timeMode === 'night' ? 0x38bdf8 : 0xfbbf24,
      transparent: true,
      opacity: 0.7
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── 10. SMOOTH CAMERA ORBIT & PRESET MODES ──
    let angle = cameraPreset === 'ground' ? 0.3 : cameraPreset === 'crane' ? 1.4 : 0.82;
    let elev = cameraPreset === 'ground' ? 0.08 : cameraPreset === 'crane' ? 0.95 : 0.36;
    let dist = cameraPreset === 'ground' ? 45 : cameraPreset === 'crane' ? 110 : 88;
    let isDragging = false;
    let prevX = 0, prevY = 0;
    const targetY = 24;

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

    // Touch handlers
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

    // ── 11. ANIMATION & RENDER LOOP ──
    let animId;
    let scanY = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();

      // Smooth Auto-Rotation
      if (autoRotate && !isDragging) {
        angle += 0.0016;
        setCamera();
      }

      // Animate Beacon & Crane
      animElements.forEach((item) => {
        if (item.type === 'beacon') {
          const pulse = (Math.sin(elapsed * 4.5) + 1) / 2;
          item.light.intensity = pulse > 0.6 ? 2.5 : 0.2;
        } else if (item.type === 'crane') {
          item.slewing.rotation.y = Math.sin(elapsed * 0.22) * 0.55;
        }
      });

      // Laser Scanner Animation
      if (viewMode === 'scan' || isScanning) {
        scanPlane.visible = true;
        scanY += 0.45;
        if (scanY > 75) scanY = 0;
        scanPlane.position.y = scanY;
      } else {
        scanPlane.visible = false;
      }

      // Ambient Particle Motes Floating
      const pArr = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pArr[i * 3 + 1] += 0.02 + Math.sin(elapsed + i) * 0.008;
        if (pArr[i * 3 + 1] > 80) pArr[i * 3 + 1] = 0;
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
  }, [activeModel, timeMode, viewMode, cameraPreset, autoRotate, showMachinery, isScanning]);

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
            background: 'rgba(8, 12, 22, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
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
            background: 'rgba(8, 12, 22, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
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
          <div style={{ background: 'rgba(8, 12, 22, 0.85)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            🖱️ Вращение мышью • Колесо: Зум • Башенный кран Liebherr
          </div>
          <div style={{ background: 'rgba(8, 12, 22, 0.85)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: '700' }}>
            ⚡ Real-time WebGL 2.0 ArchViz Engine
          </div>
        </div>
      )}
    </div>
  );
}
