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

  // Interactive View Modes: 'arch' (ArchViz) | 'bim' (BIM Wireframe) | 'scan' (Laser Inspection) | 'stages' (SMR Phase)
  const [viewMode, setViewMode] = useState(isScanning ? 'scan' : 'arch');
  const [timeMode, setTimeMode] = useState('sunset'); // 'sunset' | 'night' | 'day'
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentStage, setCurrentStage] = useState(3); // 1: Foundation, 2: Monolith, 3: Facade, 4: Finished

  // Update view mode if isScanning prop changes
  useEffect(() => {
    if (isScanning) setViewMode('scan');
  }, [isScanning]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    if (cleanupRef.current) cleanupRef.current();

    const W = el.clientWidth || 400;
    const H = el.clientHeight || 300;

    // ── SCENE & CAMERA SETUP ──
    const scene = new THREE.Scene();
    
    // Atmospheric Fog
    const fogColor = timeMode === 'night' ? 0x050914 : timeMode === 'day' ? 0xd0e4f7 : 0x0c1322;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.012);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 800);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeMode === 'night' ? 1.2 : timeMode === 'day' ? 1.0 : 1.1;
    el.appendChild(renderer.domElement);

    // ── LIGHTING SETUP (ArchViz Cinematic) ──
    const ambientLight = new THREE.AmbientLight(
      timeMode === 'night' ? 0x111c33 : timeMode === 'day' ? 0x6688aa : 0x223855,
      timeMode === 'night' ? 0.8 : 1.2
    );
    scene.add(ambientLight);

    // Sun / Moon Directional Light
    const sunColor = timeMode === 'night' ? 0x88bbff : timeMode === 'day' ? 0xfff8ee : 0xffaa55;
    const sun = new THREE.DirectionalLight(sunColor, timeMode === 'night' ? 0.8 : timeMode === 'day' ? 2.2 : 1.8);
    sun.position.set(45, 75, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -30;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    // Sky Dome Fill Light
    const hemiLight = new THREE.HemisphereLight(
      timeMode === 'night' ? 0x1a2a4a : 0x90b0d0,
      timeMode === 'night' ? 0x050810 : 0x203040,
      0.6
    );
    scene.add(hemiLight);

    // Blue Hour Backlight
    const rimLight = new THREE.DirectionalLight(0x0ea5e9, timeMode === 'night' ? 1.2 : 0.6);
    rimLight.position.set(-40, 30, -40);
    scene.add(rimLight);

    // ── TEXTURE & MATERIAL DEFINITIONS ──
    // Concrete & Structural Elements
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x8c99a8,
      roughness: 0.75,
      metalness: 0.1
    });

    const darkGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x1e2736,
      roughness: 0.4,
      metalness: 0.3
    });

    // Glass Curtain Wall Materials
    const glassReflective = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.05,
      metalness: 0.92,
      transparent: true,
      opacity: 0.75
    });

    // Warm Interior Illuminated Windows (Procedural Variations)
    const glassLitWarm = new THREE.MeshStandardMaterial({
      color: 0xffe299,
      emissive: 0xffaa22,
      emissiveIntensity: timeMode === 'night' ? 1.2 : 0.65,
      roughness: 0.2,
      metalness: 0.1
    });

    const glassLitCool = new THREE.MeshStandardMaterial({
      color: 0xd6f0ff,
      emissive: 0x38bdf8,
      emissiveIntensity: timeMode === 'night' ? 1.0 : 0.5,
      roughness: 0.2,
      metalness: 0.1
    });

    const champagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.75
    });

    const metalFrameMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.4,
      metalness: 0.8
    });

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3
    });

    const pavingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.15
    });

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.9,
      metalness: 0.05
    });

    const safetyNetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });

    const laserMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    // ── ENVIRONMENT & GROUND PLAZA ──
    const plazaGroup = new THREE.Group();

    // Main Ground Plane
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(350, 350), asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    plazaGroup.add(ground);

    // Elevated Building Podium Island
    const podiumSlab = new THREE.Mesh(
      new THREE.BoxGeometry(64, 0.4, 52),
      pavingMat
    );
    podiumSlab.position.set(0, 0.2, 0);
    podiumSlab.receiveShadow = true;
    podiumSlab.castShadow = true;
    plazaGroup.add(podiumSlab);

    // Road Markings & Zebra Crossings
    for (let z = -20; z <= 20; z += 10) {
      const roadLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
      );
      roadLine.rotation.x = -Math.PI / 2;
      roadLine.position.set(38, 0.01, z);
      plazaGroup.add(roadLine);
    }

    // Landscaped Green Planters & Trees
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    const treePositions = [
      { x: -26, z: 20 }, { x: -20, z: 20 }, { x: -14, z: 20 },
      { x: 26, z: 20 }, { x: 20, z: 20 }, { x: 14, z: 20 },
      { x: -28, z: -18 }, { x: -28, z: 0 }, { x: -28, z: 12 }
    ];

    treePositions.forEach((pos) => {
      // Planter Box
      const planter = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 3.5), darkGraniteMat);
      planter.position.set(pos.x, 0.45, pos.z);
      planter.castShadow = true;
      plazaGroup.add(planter);

      const earth = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.55, 3.1), grassMat);
      earth.position.set(pos.x, 0.46, pos.z);
      plazaGroup.add(earth);

      // Tree Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 3.5, 8), treeTrunkMat);
      trunk.position.set(pos.x, 2.2, pos.z);
      trunk.castShadow = true;
      plazaGroup.add(trunk);

      // Tree Foliage (Sculpted Modern Cones / Spheres)
      const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), treeFoliageMat);
      foliage1.position.set(pos.x, 4.2, pos.z);
      foliage1.castShadow = true;
      plazaGroup.add(foliage1);

      const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), treeFoliageMat);
      foliage2.position.set(pos.x, 5.2, pos.z);
      foliage2.castShadow = true;
      plazaGroup.add(foliage2);
    });

    // Street Lamps with Warm Pointlights
    const lampPositions = [
      { x: -30, z: 24 }, { x: 0, z: 24 }, { x: 30, z: 24 },
      { x: -30, z: -24 }, { x: 30, z: -24 }
    ];

    lampPositions.forEach((lpos) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 8), metalFrameMat);
      pole.position.set(lpos.x, 3, lpos.z);
      pole.castShadow = true;
      plazaGroup.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.4), metalFrameMat);
      head.position.set(lpos.x, 6, lpos.z);
      plazaGroup.add(head);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe299 })
      );
      bulb.position.set(lpos.x, 5.85, lpos.z);
      plazaGroup.add(bulb);

      if (timeMode === 'night' || timeMode === 'sunset') {
        const pLight = new THREE.PointLight(0xffaa33, 0.8, 18, 2);
        pLight.position.set(lpos.x, 5.7, lpos.z);
        plazaGroup.add(pLight);
      }
    });

    scene.add(plazaGroup);

    // ── MAIN ARCHITECTURAL COMPLEX (MULTI-TIER RESIDENTIAL TOWER) ──
    const buildingComplex = new THREE.Group();

    // Building Specs
    const floorH = 3.2;
    const totalFloors = sampleIndex === 0 ? 18 : sampleIndex === 1 ? 14 : 10;
    const mainW = 26;
    const mainD = 18;

    // 1. COMMERCIAL PODIUM (Floors 1-2)
    const podiumH = floorH * 2;
    const podiumW = mainW + 12;
    const podiumD = mainD + 8;

    const podiumBlock = new THREE.Mesh(
      new THREE.BoxGeometry(podiumW, podiumH, podiumD),
      darkGraniteMat
    );
    podiumBlock.position.set(0, podiumH / 2 + 0.4, 0);
    podiumBlock.castShadow = true;
    podiumBlock.receiveShadow = true;
    buildingComplex.add(podiumBlock);

    // Double-Height Panoramic Glass Lobby & Showrooms
    for (let side = -1; side <= 1; side += 2) {
      const glassWall = new THREE.Mesh(
        new THREE.BoxGeometry(podiumW - 4, podiumH - 0.8, 0.2),
        glassReflective
      );
      glassWall.position.set(0, podiumH / 2 + 0.4, side * (podiumD / 2 + 0.05));
      buildingComplex.add(glassWall);

      // Architectural Lobby Columns
      for (let cx = -podiumW / 2 + 4; cx <= podiumW / 2 - 4; cx += 6) {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, podiumH, 12),
          champagneGoldMat
        );
        col.position.set(cx, podiumH / 2 + 0.4, side * (podiumD / 2 + 0.8));
        col.castShadow = true;
        buildingComplex.add(col);
      }
    }

    // Grand Entrance Canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.35, 6),
      darkGraniteMat
    );
    canopy.position.set(0, floorH + 0.6, podiumD / 2 + 3);
    canopy.castShadow = true;
    buildingComplex.add(canopy);

    // LED Entrance Spotlight
    const entranceSpot = new THREE.PointLight(0xffeedd, 2.0, 12);
    entranceSpot.position.set(0, floorH + 0.3, podiumD / 2 + 2.5);
    buildingComplex.add(entranceSpot);

    // 2. RESIDENTIAL TOWER SHAFTS (Floors 3 through totalFloors)
    const towerStartFloor = 2;
    const windowMeshes = [];

    for (let f = towerStartFloor; f < totalFloors; f++) {
      const y = f * floorH + 0.4;
      const isTopActiveFloor = f >= totalFloors - 2;

      // Floor Slab Cantilever
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(mainW + 0.8, 0.25, mainD + 0.8),
        concreteMat
      );
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      buildingComplex.add(slab);

      // Concrete Core & Columns (BIM structural grid)
      const coreBlock = new THREE.Mesh(
        new THREE.BoxGeometry(mainW - 0.4, floorH - 0.25, mainD - 0.4),
        isTopActiveFloor ? concreteMat : darkGraniteMat
      );
      coreBlock.position.set(0, y + (floorH - 0.25) / 2 + 0.12, 0);
      coreBlock.castShadow = true;
      buildingComplex.add(coreBlock);

      // Facade Cladding & Articulated Windows
      if (!isTopActiveFloor || currentStage >= 3) {
        // Front & Back Facade Modules
        const bayCount = 6;
        const bayW = mainW / bayCount;

        for (let b = 0; b < bayCount; b++) {
          const bx = -mainW / 2 + b * bayW + bayW / 2;
          const isBalcony = b === 1 || b === 4;

          // Window Apertures
          const isLit = (f + b) % 3 === 0 || Math.random() > 0.4;
          const winMat = isLit ? (b % 2 === 0 ? glassLitWarm : glassLitCool) : glassReflective;

          // Front Window
          const winFront = new THREE.Mesh(
            new THREE.BoxGeometry(bayW * 0.75, floorH * 0.65, 0.15),
            winMat
          );
          winFront.position.set(bx, y + floorH * 0.5, mainD / 2 + 0.08);
          buildingComplex.add(winFront);
          windowMeshes.push(winFront);

          // Back Window
          const winBack = winFront.clone();
          winBack.position.z = -mainD / 2 - 0.08;
          buildingComplex.add(winBack);
          windowMeshes.push(winBack);

          // Balconies with Glass Railings
          if (isBalcony) {
            const balcSlab = new THREE.Mesh(
              new THREE.BoxGeometry(bayW * 0.9, 0.15, 1.4),
              concreteMat
            );
            balcSlab.position.set(bx, y + 0.08, mainD / 2 + 0.7);
            balcSlab.castShadow = true;
            buildingComplex.add(balcSlab);

            const balcGlass = new THREE.Mesh(
              new THREE.BoxGeometry(bayW * 0.9, 1.0, 0.05),
              glassReflective
            );
            balcGlass.position.set(bx, y + 0.6, mainD / 2 + 1.4);
            buildingComplex.add(balcGlass);
          }
        }

        // Side Vertical Accent Fins (Champagne Gold)
        for (const sx of [-mainW / 2 - 0.1, mainW / 2 + 0.1]) {
          const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, floorH, 1.2),
            champagneGoldMat
          );
          fin.position.set(sx, y + floorH / 2, 0);
          buildingComplex.add(fin);
        }
      } else {
        // Under-Construction Floor: Exposed Columns + Rebar + Safety Netting
        for (let colX = -mainW / 2 + 2; colX <= mainW / 2 - 2; colX += 5) {
          for (let colZ = -mainD / 2 + 2; colZ <= mainD / 2 - 2; colZ += 5) {
            const col = new THREE.Mesh(
              new THREE.BoxGeometry(0.7, floorH, 0.7),
              concreteMat
            );
            col.position.set(colX, y + floorH / 2, colZ);
            col.castShadow = true;
            buildingComplex.add(col);

            // Rebar starter bars sticking out on top
            const rebar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4),
              champagneGoldMat
            );
            rebar.position.set(colX, y + floorH + 0.6, colZ);
            buildingComplex.add(rebar);
          }
        }

        // Blue Construction Safety Netting
        const net = new THREE.Mesh(
          new THREE.BoxGeometry(mainW + 0.6, floorH * 0.9, mainD + 0.6),
          safetyNetMat
        );
        net.position.set(0, y + floorH / 2, 0);
        buildingComplex.add(net);
      }
    }

    // 3. ROOFTOP PENTHOUSE & ARCHITECTURAL CROWN
    const roofY = totalFloors * floorH + 0.4;
    const roofTerrace = new THREE.Mesh(
      new THREE.BoxGeometry(mainW * 0.6, 3.0, mainD * 0.6),
      darkGraniteMat
    );
    roofTerrace.position.set(0, roofY + 1.5, 0);
    roofTerrace.castShadow = true;
    buildingComplex.add(roofTerrace);

    // Architectural Illuminated Crown Pergola
    for (let px = -mainW * 0.3; px <= mainW * 0.3; px += 2.5) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, mainD * 0.7),
        champagneGoldMat
      );
      beam.position.set(px, roofY + 3.4, 0);
      buildingComplex.add(beam);
    }

    // Communication Mast with Flashing Red Aviation Beacon
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.15, 9, 8),
      metalFrameMat
    );
    mast.position.set(0, roofY + 7.5, 0);
    buildingComplex.add(mast);

    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    beaconLight.position.set(0, roofY + 12, 0);
    buildingComplex.add(beaconLight);

    const beaconPoint = new THREE.PointLight(0xff0000, 2.0, 25);
    beaconPoint.position.set(0, roofY + 12, 0);
    buildingComplex.add(beaconPoint);

    // Facade Vertical LED Accent Strips (Architectural Night Glow)
    const ledStrip1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, totalFloors * floorH, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ledStrip1.position.set(-mainW / 2 - 0.05, (totalFloors * floorH) / 2 + 0.4, mainD / 2 + 0.05);
    buildingComplex.add(ledStrip1);

    const ledStrip2 = ledStrip1.clone();
    ledStrip2.position.x = mainW / 2 + 0.05;
    buildingComplex.add(ledStrip2);

    scene.add(buildingComplex);

    // ── DETAILED LIEBHERR TOWER CRANE (LATTICE TRUSS) ──
    const craneGroup = new THREE.Group();
    const craneMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.4
    });

    const craneH = totalFloors * floorH + 16;
    const craneX = mainW / 2 + 8;
    const craneZ = -4;

    // Crane Mast Truss Columns
    const mastTruss = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, craneH, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
    );
    mastTruss.position.set(craneX, craneH / 2, craneZ);
    mastTruss.castShadow = true;
    craneGroup.add(mastTruss);

    // Crane Inner Core Column
    const mastCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, craneH, 0.9),
      craneMat
    );
    mastCore.position.set(craneX, craneH / 2, craneZ);
    craneGroup.add(mastCore);

    // Rotating Jib & Counter-Jib Assembly
    const slewingUnit = new THREE.Group();
    slewingUnit.position.set(craneX, craneH, craneZ);

    // Operator Cab
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x222938, roughness: 0.3 })
    );
    cab.position.set(-0.9, 0.4, 0.6);
    slewingUnit.add(cab);

    // Main Jib (Horizontal Truss Arm, 34 meters long)
    const jib = new THREE.Mesh(
      new THREE.BoxGeometry(34, 1.2, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true })
    );
    jib.position.set(-14, 1.8, 0);
    jib.castShadow = true;
    slewingUnit.add(jib);

    // Counter-Jib with Counterweight Blocks
    const counterJib = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.2, 1.0),
      craneMat
    );
    counterJib.position.set(6, 1.8, 0);
    slewingUnit.add(counterJib);

    const counterweights = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    counterweights.position.set(10.5, 1.5, 0);
    slewingUnit.add(counterweights);

    // Crane Top Apex & Tension Cables
    const apex = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 4, 4),
      craneMat
    );
    apex.position.set(0, 3.8, 0);
    slewingUnit.add(apex);

    // Crane Trolley & Hoist Cable
    const trolley = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    trolley.position.set(-18, 1.2, 0);
    slewingUnit.add(trolley);

    const hoistCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 18, 4),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    hoistCable.position.set(-18, -8, 0);
    slewingUnit.add(hoistCable);

    const hookBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    hookBlock.position.set(-18, -17, 0);
    slewingUnit.add(hookBlock);

    craneGroup.add(slewingUnit);
    scene.add(craneGroup);

    // ── CONCRETE MIXER TRUCK & CONSTRUCTION SITE VEHICLES ──
    const truckGroup = new THREE.Group();
    truckGroup.position.set(22, 0.4, 18);
    truckGroup.rotation.y = -Math.PI / 4;

    // Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.8, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    chassis.position.y = 0.8;
    truckGroup.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    cabin.position.set(-2.6, 2.0, 0);
    truckGroup.add(cabin);

    // Rotating Mixer Drum
    const drum = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 5.0, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    drum.rotation.z = Math.PI / 2.3;
    drum.position.set(1.2, 2.2, 0);
    truckGroup.add(drum);

    scene.add(truckGroup);

    // ── LASER SCANNER PLANE (BIM INSPECTION) ──
    const scanPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(mainW + 10, mainD + 10),
      laserMat
    );
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.visible = viewMode === 'scan';
    scene.add(scanPlane);

    // ── AMBIENT ARCHITECTURAL PARTICLES (Golden Dust / Night Sparks) ──
    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 80;
      pPos[i * 3 + 1] = Math.random() * (totalFloors * floorH + 10);
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.18,
      color: timeMode === 'night' ? 0x38bdf8 : 0xfbbf24,
      transparent: true,
      opacity: 0.65
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── SMOOTH ORBIT CONTROLS & CAMERA INTERACTION ──
    let angle = 0.85;
    let elev = 0.38;
    let dist = totalFloors > 14 ? 82 : 68;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const targetY = (totalFloors * floorH) * 0.42;

    const updateCamera = () => {
      camera.position.set(
        Math.sin(angle) * Math.cos(elev) * dist,
        Math.sin(elev) * dist + targetY * 0.6,
        Math.cos(angle) * Math.cos(elev) * dist
      );
      camera.lookAt(0, targetY, 0);
    };
    updateCamera();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => { isDragging = false; };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      angle += (e.clientX - prevMouseX) * 0.005;
      elev = Math.max(0.08, Math.min(1.35, elev + (e.clientY - prevMouseY) * 0.004));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      updateCamera();
    };

    const onWheel = (e) => {
      dist = Math.max(25, Math.min(140, dist + e.deltaY * 0.05));
      updateCamera();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    // Touch Support
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      angle += (e.touches[0].clientX - prevMouseX) * 0.005;
      elev = Math.max(0.08, Math.min(1.35, elev + (e.touches[0].clientY - prevMouseY) * 0.004));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
      updateCamera();
    };
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // ── ANIMATION LOOP ──
    let animId;
    let scanHeight = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Auto-Orbit
      if (autoRotate && !isDragging) {
        angle += 0.0018;
        updateCamera();
      }

      // Gentle Crane Jib Wind Sway & Rotation
      slewingUnit.rotation.y = Math.sin(elapsedTime * 0.25) * 0.45;
      drum.rotation.x = elapsedTime * 2.0;

      // Aviation Red Beacon Flashing Pulse
      const beaconPulse = (Math.sin(elapsedTime * 5.0) + 1) / 2;
      beaconPoint.intensity = beaconPulse > 0.6 ? 2.5 : 0.2;

      // Particles Gentle Floating
      const pArray = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pArray[i * 3 + 1] += 0.02 + Math.sin(elapsedTime + i) * 0.008;
        if (pArray[i * 3 + 1] > totalFloors * floorH + 12) {
          pArray[i * 3 + 1] = 0;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Laser Scanner Wave Animation
      if (viewMode === 'scan' || isScanning) {
        scanPlane.visible = true;
        scanHeight += 0.35;
        if (scanHeight > totalFloors * floorH + 2) scanHeight = 0;
        scanPlane.position.y = scanHeight;
      } else {
        scanPlane.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      const nw = el.clientWidth || 400;
      const nh = el.clientHeight || 300;
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
  }, [sampleIndex, isScanning, viewMode, timeMode, autoRotate, currentStage]);

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', borderRadius: '14px' }}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Futuristic HUD Overlay Controls */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {/* Left HUD: BIM Telemetry Badge */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '6px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00ff88',
              boxShadow: '0 0 8px #00ff88',
              display: 'inline-block'
            }}></span>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
              3D BIM ARCHVIZ • СНиП РК
            </span>
          </div>

          {/* Right HUD: Interactive View Toggles */}
          <div style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(8, 12, 22, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '4px',
            borderRadius: '8px',
            pointerEvents: 'auto'
          }}>
            <button
              onClick={() => setTimeMode(timeMode === 'sunset' ? 'night' : timeMode === 'night' ? 'day' : 'sunset')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Переключить освещение: Закат / Ночь / День"
            >
              {timeMode === 'sunset' ? '🌆 Закат' : timeMode === 'night' ? '🌙 Ночь' : '☀️ День'}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'scan' ? 'arch' : 'scan')}
              style={{
                background: viewMode === 'scan' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: viewMode === 'scan' ? '1px solid #00ff88' : 'none',
                color: viewMode === 'scan' ? '#00ff88' : '#cbd5e1',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Лазерный скан дефектов монолита"
            >
              🔍 AI Скан
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              style={{
                background: autoRotate ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: autoRotate ? '1px solid #3b82f6' : 'none',
                color: autoRotate ? '#60a5fa' : '#cbd5e1',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Вращение 360°"
            >
              🔄 Вращение
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
          color: '#94a3b8',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <span style={{ background: 'rgba(8, 12, 22, 0.8)', padding: '2px 8px', borderRadius: '4px' }}>
            🖱️ Удерживайте мышь для вращения • Колесо: Зум
          </span>
          <span style={{ background: 'rgba(8, 12, 22, 0.8)', padding: '2px 8px', borderRadius: '4px', color: '#38bdf8' }}>
            Монолит: Бетон B25 / Арматура A500C
          </span>
        </div>
      )}
    </div>
  );
}
