import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── 1. THREE.JS SCENE & TRANSPARENT RENDERER (NO CHEAP 2D BG) ──
    const scene = new THREE.Scene();
    const fogColor = 0x090d16;
    scene.fog = new THREE.FogExp2(fogColor, 0.0065);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000);
    camera.position.set(0, 32, 105);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x000000, 0); // Transparent canvas background!

    el.appendChild(renderer.domElement);

    // ── 2. LUXURY ARCHITECTURAL LIGHTING RIG ──
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.8);
    sunLight.position.set(60, 110, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.85);
    scene.add(hemiLight);

    const cyanRim = new THREE.DirectionalLight(0x00e5ff, 1.8);
    cyanRim.position.set(-70, 40, -50);
    scene.add(cyanRim);

    const goldRim = new THREE.DirectionalLight(0xd4af37, 1.4);
    goldRim.position.set(40, 30, -70);
    scene.add(goldRim);

    // ── 3. LUXURY PBR MATERIALS ──
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x3d2b00,
      emissiveIntensity: 0.2
    });

    const facadeDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.6
    });

    const glassReflectiveMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.92,
      transparent: true,
      opacity: 0.72
    });

    const windowWarmLitMat = new THREE.MeshStandardMaterial({
      color: 0xffe899,
      emissive: 0xffaa22,
      emissiveIntensity: 1.8,
      roughness: 0.2
    });

    const windowCoolLitMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.5
    });

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.5,
      metalness: 0.3
    });

    // ── 4. GROUND GRID & REFLECTIVE PLAZA ──
    const groundGroup = new THREE.Group();
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.1;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    // Cyber Grid lines
    const gridHelper = new THREE.GridHelper(300, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.02;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach(m => { m.transparent = true; m.opacity = 0.25; });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.25;
    }
    groundGroup.add(gridHelper);
    scene.add(groundGroup);

    // ── 5. ULTRA-LUXURY TWIN SKYSCRAPERS ──
    const mainCityGroup = new THREE.Group();
    const animables = [];

    const buildTower = (xPos, zPos, scaleY = 1.0, isMain = true) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(xPos, 0, zPos);

      const floors = Math.round(24 * scaleY);
      const floorH = 2.4;
      const towerW = 16;
      const towerD = 14;

      // Podium Base
      const podium = new THREE.Mesh(new THREE.BoxGeometry(towerW + 4, 3, towerD + 4), facadeDarkMat);
      podium.position.y = 1.5;
      podium.castShadow = true;
      podium.receiveShadow = true;
      towerGroup.add(podium);

      // Gold Entrance Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(towerW + 6, 0.4, 6), goldMat);
      canopy.position.set(0, 3.2, towerD / 2 + 1);
      canopy.castShadow = true;
      towerGroup.add(canopy);

      // Main Floors
      for (let f = 0; f < floors; f++) {
        const y = 3 + f * floorH + floorH / 2;
        const isPenthouse = f >= floors - 3;
        const widthT = isPenthouse ? towerW * 0.9 : towerW;
        const depthT = isPenthouse ? towerD * 0.9 : towerD;

        // Core slab
        const slab = new THREE.Mesh(new THREE.BoxGeometry(widthT, floorH, depthT), glassReflectiveMat);
        slab.position.y = y;
        slab.castShadow = true;
        towerGroup.add(slab);

        // Vertical Gold Metallic Fins on Facade
        for (let side = -1; side <= 1; side += 2) {
          const finLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, floorH, 0.4), goldMat);
          finLeft.position.set(side * (widthT / 2 + 0.15), y, depthT / 2);
          towerGroup.add(finLeft);

          const finRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, floorH, 0.4), goldMat);
          finRight.position.set(side * (widthT / 2 + 0.15), y, -depthT / 2);
          towerGroup.add(finRight);
        }

        // Illuminated Windows
        for (let wx = -widthT / 2 + 2; wx <= widthT / 2 - 2; wx += 3.2) {
          const litProb = Math.random();
          if (litProb > 0.35) {
            const winMat = litProb > 0.7 ? windowWarmLitMat : windowCoolLitMat;
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.1), winMat);
            win.position.set(wx, y, depthT / 2 + 0.08);
            towerGroup.add(win);

            const winBack = win.clone();
            winBack.position.set(wx, y, -depthT / 2 - 0.08);
            towerGroup.add(winBack);
          }
        }
      }

      // Crown & Spire / Helipad
      const totalH = 3 + floors * floorH;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(towerW * 0.7, 4, towerD * 0.7), goldMat);
      crown.position.y = totalH + 2;
      crown.castShadow = true;
      towerGroup.add(crown);

      // Neon LED Spire
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 12, 8), neonCyanMat);
      spire.position.y = totalH + 10;
      towerGroup.add(spire);

      // Rotating Beacon Light
      const beacon = new THREE.PointLight(0x00e5ff, 2.5, 45);
      beacon.position.y = totalH + 16;
      towerGroup.add(beacon);
      animables.push({ type: 'beacon', light: beacon });

      return towerGroup;
    };

    // Left Tower
    const towerA = buildTower(-15, 0, 1.1, true);
    mainCityGroup.add(towerA);

    // Right Tower
    const towerB = buildTower(15, 0, 0.95, true);
    mainCityGroup.add(towerB);

    // Sky-Bridge connecting the towers at height Y=35
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 8), glassReflectiveMat);
    bridge.position.set(0, 36, 0);
    mainCityGroup.add(bridge);

    const bridgeGoldFrame = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.4, 8.2), goldMat);
    bridgeGoldFrame.position.set(0, 34.4, 0);
    mainCityGroup.add(bridgeGoldFrame);

    const bridgeGoldTop = bridgeGoldFrame.clone();
    bridgeGoldTop.position.set(0, 37.6, 0);
    mainCityGroup.add(bridgeGoldTop);

    // Background Skyline Silhouette Towers
    const bgTowers = [
      { x: -55, z: -45, w: 18, h: 48 },
      { x: -35, z: -60, w: 22, h: 65 },
      { x: 35, z: -55, w: 20, h: 58 },
      { x: 55, z: -40, w: 16, h: 42 }
    ];

    bgTowers.forEach(bt => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bt.w, bt.h, bt.w), facadeDarkMat);
      bMesh.position.set(bt.x, bt.h / 2, bt.z);
      mainCityGroup.add(bMesh);

      // Lit windows
      for (let wy = 8; wy < bt.h - 6; wy += 5) {
        if (Math.random() > 0.4) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(bt.w * 0.7, 1.2, 0.1), windowCoolLitMat);
          win.position.set(bt.x, wy, bt.z + bt.w / 2 + 0.1);
          mainCityGroup.add(win);
        }
      }
    });

    scene.add(mainCityGroup);

    // ── 6. FLOATING PARTICLES (GLOWING DUST) ──
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 160;
      particlePositions[i + 1] = Math.random() * 80;
      particlePositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.85,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── 7. INTERACTIVE MOUSE PARALLAX ──
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('resize', handleResize);

    // ── 8. ANIMATION LOOP ──
    let animationFrameId;
    let clock = new THREE.Clock();

    const render = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 12 - targetX) * 0.05;
      targetY += (-mouseY * 8 - targetY) * 0.05;

      camera.position.x = targetX;
      camera.position.y = 32 + targetY;
      camera.lookAt(0, 25, 0);

      // Slow 3D Auto-Rotation of main complex
      mainCityGroup.rotation.y = elapsed * 0.05;

      // Pulse beacon lights
      animables.forEach(a => {
        if (a.type === 'beacon') {
          a.light.intensity = 2.0 + Math.sin(elapsed * 4) * 1.0;
        }
      });

      // Float particles
      const positions = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.04;
        if (positions[i] > 80) positions[i] = 0;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
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
