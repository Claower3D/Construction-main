import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── 1. SCENE & CAMERA ──
    const scene = new THREE.Scene();
    const fogColor = 0x090d16;
    scene.fog = new THREE.FogExp2(fogColor, 0.0045);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    // Camera positioned to view the central open space framed by side skyscrapers
    camera.position.set(0, 36, 125);

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
    renderer.toneMappingExposure = 1.45;
    renderer.setClearColor(0x000000, 0); // Completely transparent canvas background!

    el.appendChild(renderer.domElement);

    // ── 2. HIGH-END ARCHITECTURAL LIGHTING ──
    const ambientLight = new THREE.AmbientLight(0x334155, 2.2); // Bright, clear fill light
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff5e6, 3.2);
    mainSun.position.set(80, 130, 70);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.set(2048, 2048);
    mainSun.shadow.bias = -0.0001;
    scene.add(mainSun);

    const skyHemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    scene.add(skyHemi);

    const leftCyanLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    leftCyanLight.position.set(-100, 50, 20);
    scene.add(leftCyanLight);

    const rightGoldLight = new THREE.DirectionalLight(0xf59e0b, 2.0);
    rightGoldLight.position.set(100, 50, 20);
    scene.add(rightGoldLight);

    // ── 3. LUXURY PBR MATERIALS ──
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.18,
      metalness: 0.92,
      emissive: 0x4a3500,
      emissiveIntensity: 0.35
    });

    const facadeNavyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65
    });

    const facadeSlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.8
    });

    const glassBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.04,
      metalness: 0.94,
      transparent: true,
      opacity: 0.78
    });

    const windowWarmLitMat = new THREE.MeshStandardMaterial({
      color: 0xffe899,
      emissive: 0xffaa22,
      emissiveIntensity: 2.2,
      roughness: 0.15
    });

    const windowCyanLitMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.0,
      roughness: 0.15
    });

    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 3.0
    });

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.6,
      metalness: 0.4
    });

    // ── 4. GROUND PLAZA & REFLECTIVE GRID ──
    const groundGroup = new THREE.Group();
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.1;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    const gridHelper = new THREE.GridHelper(500, 80, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.02;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach(m => { m.transparent = true; m.opacity = 0.22; });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.22;
    }
    groundGroup.add(gridHelper);
    scene.add(groundGroup);

    // ── 5. SKYSCRAPER BUILDER FUNCTION ──
    const cityGroup = new THREE.Group();
    const beacons = [];

    const createLuxurySkyscraper = (x, z, floors, width, depth, style = 0) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      const floorH = 2.6;
      const totalH = floors * floorH;

      // Solid Podium Base
      const podium = new THREE.Mesh(new THREE.BoxGeometry(width + 4, 4, depth + 4), facadeSlateMat);
      podium.position.y = 2;
      podium.castShadow = true;
      podium.receiveShadow = true;
      bGroup.add(podium);

      // Gold Entrance Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(width + 6, 0.5, 6), goldMat);
      canopy.position.set(0, 4.25, depth / 2 + 1);
      canopy.castShadow = true;
      bGroup.add(canopy);

      // Floors Loop
      for (let f = 0; f < floors; f++) {
        const y = 4 + f * floorH + floorH / 2;
        const isUpper = f >= floors - 4;
        const currentW = isUpper ? width * 0.88 : width;
        const currentD = isUpper ? depth * 0.88 : depth;

        // Core Slab / Glass Facade
        const slab = new THREE.Mesh(new THREE.BoxGeometry(currentW, floorH * 0.95, currentD), glassBlueMat);
        slab.position.y = y;
        slab.castShadow = true;
        bGroup.add(slab);

        // Gold Structural Pillars at corners
        const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, floorH, 0.5), goldMat);
        pLeft.position.set(-currentW / 2 - 0.1, y, currentD / 2 + 0.1);
        bGroup.add(pLeft);

        const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, floorH, 0.5), goldMat);
        pRight.position.set(currentW / 2 + 0.1, y, currentD / 2 + 0.1);
        bGroup.add(pRight);

        // Illuminated Windows
        for (let wx = -currentW / 2 + 2; wx <= currentW / 2 - 2; wx += 3.2) {
          const rand = Math.random();
          if (rand > 0.3) {
            const winMat = rand > 0.65 ? windowWarmLitMat : windowCyanLitMat;
            const winFront = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.6, 0.1), winMat);
            winFront.position.set(wx, y, currentD / 2 + 0.08);
            bGroup.add(winFront);

            const winBack = winFront.clone();
            winBack.position.set(wx, y, -currentD / 2 - 0.08);
            bGroup.add(winBack);
          }
        }
      }

      // Roof Crown & Spire
      const crown = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, 4.5, depth * 0.75), goldMat);
      crown.position.y = totalH + 6.25;
      crown.castShadow = true;
      bGroup.add(crown);

      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 14, 8), neonCyanMat);
      spire.position.y = totalH + 15.5;
      bGroup.add(spire);

      // Rotating Beacon Light on Roof
      const beaconLight = new THREE.PointLight(0x00e5ff, 3.0, 50);
      beaconLight.position.y = totalH + 22;
      bGroup.add(beaconLight);
      beacons.push(beaconLight);

      return bGroup;
    };

    // ── 6. EXACT ARRANGEMENT: 3 BUILDINGS ON LEFT, 3 BUILDINGS ON RIGHT ──
    // Center area (X between -50 and +50) is 100% CLEAR for screen cards & menus!

    // === LEFT SIDE (3 BUILDINGS) ===
    // Building L1 (Front Left)
    const buildingL1 = createLuxurySkyscraper(-68, 10, 24, 18, 16, 0);
    cityGroup.add(buildingL1);

    // Building L2 (Mid Left)
    const buildingL2 = createLuxurySkyscraper(-102, -15, 30, 22, 18, 1);
    cityGroup.add(buildingL2);

    // Building L3 (Back Left)
    const buildingL3 = createLuxurySkyscraper(-138, -42, 22, 20, 16, 2);
    cityGroup.add(buildingL3);

    // === RIGHT SIDE (3 BUILDINGS) ===
    // Building R1 (Front Right)
    const buildingR1 = createLuxurySkyscraper(68, 10, 26, 18, 16, 0);
    cityGroup.add(buildingR1);

    // Building R2 (Mid Right)
    const buildingR2 = createLuxurySkyscraper(102, -15, 32, 22, 18, 1);
    cityGroup.add(buildingR2);

    // Building R3 (Back Right)
    const buildingR3 = createLuxurySkyscraper(138, -42, 23, 20, 16, 2);
    cityGroup.add(buildingR3);

    scene.add(cityGroup);

    // ── 7. GLOWING FLOATING PARTICLES ──
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 220;
      particlePositions[i + 1] = Math.random() * 90;
      particlePositions[i + 2] = (Math.random() - 0.5) * 220;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.9,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── 8. MOUSE PARALLAX & EVENT LISTENERS ──
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

    // ── 9. ANIMATION LOOP ──
    let animationFrameId;
    let clock = new THREE.Clock();

    const render = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth mouse parallax camera tilt
      targetX += (mouseX * 16 - targetX) * 0.04;
      targetY += (-mouseY * 10 - targetY) * 0.04;

      camera.position.x = targetX;
      camera.position.y = 36 + targetY;
      camera.lookAt(0, 25, 0);

      // Pulse beacon lights
      beacons.forEach((b, i) => {
        b.intensity = 2.5 + Math.sin(elapsed * 4 + i) * 1.2;
      });

      // Float particles
      const positions = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.05;
        if (positions[i] > 90) positions[i] = 0;
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
