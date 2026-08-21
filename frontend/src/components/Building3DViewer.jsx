import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Building3DViewer({ sampleIndex = 0, isScanning = false }) {
  const mountRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    if (cleanupRef.current) cleanupRef.current();

    const W = el.clientWidth, H = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    el.appendChild(renderer.domElement);

    // Colors
    const CONCRETE = 0x8899aa;
    const DARK_CONCRETE = 0x556677;
    const GLASS_BLUE = 0x5588cc;
    const GLASS_WARM = 0xffcc66;
    const BALCONY_RAIL = 0x99aabb;
    const ACCENT = [0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6][sampleIndex] || 0x3b82f6;

    // Lights
    scene.add(new THREE.AmbientLight(0x223344, 0.8));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(30, 50, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
    fill.position.set(-20, 15, -15);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(ACCENT, 0.4);
    rim.position.set(-10, 5, 30);
    scene.add(rim);

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.85, metalness: 0.05 });
    const darkMat = new THREE.MeshStandardMaterial({ color: DARK_CONCRETE, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: GLASS_BLUE, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.5 });
    const glassLit = new THREE.MeshStandardMaterial({ color: GLASS_WARM, emissive: GLASS_WARM, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 });
    const railMat = new THREE.MeshStandardMaterial({ color: BALCONY_RAIL, roughness: 0.3, metalness: 0.7 });
    const accentMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.4, metalness: 0.2 });
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.9 });

    // ── GROUND ──
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalk
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.12, 22),
      new THREE.MeshStandardMaterial({ color: 0x2a3444, roughness: 0.85 })
    );
    sidewalk.position.set(0, 0.06, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    // ── CONFIG per sample ──
    const configs = [
      { floors: 9, sections: 3, bW: 5, bD: 4, floorH: 2.8, label: 'ЖК Фундамент' },
      { floors: 16, sections: 4, bW: 5, bD: 4, floorH: 2.8, label: 'ЖК Газоблок' },
      { floors: 12, sections: 3, bW: 5, bD: 4.5, floorH: 3.0, label: 'ЖК Кровля' },
      { floors: 5, sections: 2, bW: 5, bD: 4, floorH: 2.8, label: 'ЖК Стяжка' },
    ];
    const cfg = configs[sampleIndex] || configs[1];
    const totalW = cfg.sections * cfg.bW;
    const totalH = cfg.floors * cfg.floorH;

    const building = new THREE.Group();

    // ── BUILD FLOORS ──
    for (let f = 0; f < cfg.floors; f++) {
      const y = f * cfg.floorH;
      const isGround = f === 0;

      // Floor slab
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(totalW + 0.6, 0.2, cfg.bD + 0.6),
        darkMat.clone()
      );
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      building.add(slab);

      for (let s = 0; s < cfg.sections; s++) {
        const sx = -totalW / 2 + s * cfg.bW + cfg.bW / 2;

        // Wall panel (front)
        const panelH = cfg.floorH - 0.2;
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(cfg.bW - 0.05, panelH, 0.15),
          (f % 3 === 0) ? accentMat.clone() : concreteMat.clone()
        );
        wall.position.set(sx, y + panelH / 2 + 0.1, cfg.bD / 2);
        wall.castShadow = true;
        building.add(wall);

        // Wall panel (back)
        const wallB = wall.clone();
        wallB.position.z = -cfg.bD / 2;
        building.add(wallB);

        // Side walls (only edges)
        if (s === 0 || s === cfg.sections - 1) {
          const sideX = s === 0 ? -totalW / 2 : totalW / 2;
          const sideWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, panelH, cfg.bD),
            concreteMat.clone()
          );
          sideWall.position.set(sideX, y + panelH / 2 + 0.1, 0);
          sideWall.castShadow = true;
          building.add(sideWall);
        }

        // Windows (front)
        if (!isGround) {
          const winW = cfg.bW * 0.55;
          const winH = panelH * 0.6;
          const isLit = Math.random() > 0.35;
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(winW, winH, 0.05),
            isLit ? glassLit.clone() : glassMat.clone()
          );
          win.position.set(sx, y + cfg.floorH * 0.5, cfg.bD / 2 + 0.08);
          building.add(win);

          // Window on back
          const winB = win.clone();
          winB.position.z = -cfg.bD / 2 - 0.08;
          building.add(winB);

          // ── BALCONY (front only) ──
          if (Math.random() > 0.3) {
            // Balcony floor
            const balcF = new THREE.Mesh(
              new THREE.BoxGeometry(winW + 0.6, 0.08, 1.0),
              darkMat.clone()
            );
            balcF.position.set(sx, y + 0.04, cfg.bD / 2 + 0.6);
            balcF.castShadow = true;
            building.add(balcF);

            // Railing front
            const railF = new THREE.Mesh(
              new THREE.BoxGeometry(winW + 0.6, 0.9, 0.04),
              railMat.clone()
            );
            railF.position.set(sx, y + 0.5, cfg.bD / 2 + 1.08);
            building.add(railF);

            // Railing sides
            for (const side of [-1, 1]) {
              const railS = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.9, 1.0),
                railMat.clone()
              );
              railS.position.set(sx + side * (winW / 2 + 0.28), y + 0.5, cfg.bD / 2 + 0.6);
              building.add(railS);
            }
          }
        }

        // Ground floor: entrance doors
        if (isGround) {
          if (s === Math.floor(cfg.sections / 2)) {
            // Door
            const door = new THREE.Mesh(
              new THREE.BoxGeometry(1.6, 2.2, 0.08),
              new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.5, metalness: 0.3 })
            );
            door.position.set(sx, 1.2, cfg.bD / 2 + 0.08);
            building.add(door);

            // Canopy
            const canopy = new THREE.Mesh(
              new THREE.BoxGeometry(3.0, 0.1, 1.5),
              accentMat.clone()
            );
            canopy.position.set(sx, 2.5, cfg.bD / 2 + 0.7);
            canopy.castShadow = true;
            building.add(canopy);

            // Pillars
            for (const px of [-1.2, 1.2]) {
              const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8),
                railMat.clone()
              );
              pillar.position.set(sx + px, 1.25, cfg.bD / 2 + 1.4);
              building.add(pillar);
            }
          } else {
            // Shop windows
            const shopWin = new THREE.Mesh(
              new THREE.BoxGeometry(cfg.bW * 0.7, 2.0, 0.06),
              glassMat.clone()
            );
            shopWin.position.set(sx, 1.2, cfg.bD / 2 + 0.08);
            building.add(shopWin);
          }
        }
      }
    }

    // Roof slab
    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(totalW + 1.0, 0.25, cfg.bD + 1.0),
      darkMat.clone()
    );
    roofSlab.position.set(0, totalH, 0);
    roofSlab.castShadow = true;
    building.add(roofSlab);

    // Roof structures
    // Elevator shaft
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 3, 2.5),
      concreteMat.clone()
    );
    shaft.position.set(-totalW / 4, totalH + 1.5, 0);
    shaft.castShadow = true;
    building.add(shaft);

    // Antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 4, 6),
      railMat.clone()
    );
    antenna.position.set(totalW / 4, totalH + 2, 0);
    building.add(antenna);

    // Accent stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(totalW + 1.2, 0.3, 0.08),
      accentMat.clone()
    );
    stripe.position.set(0, totalH - 0.15, cfg.bD / 2 + 0.5);
    building.add(stripe);

    const stripe2 = stripe.clone();
    stripe2.position.y = cfg.floorH * 3;
    building.add(stripe2);

    building.position.set(0, 0.12, 0);
    scene.add(building);

    // ── CONSTRUCTION CRANE ──
    const crane = new THREE.Group();
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.3 });
    
    // Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, totalH + 10, 0.8), craneMat);
    tower.position.set(totalW / 2 + 6, (totalH + 10) / 2, -2);
    tower.castShadow = true;
    crane.add(tower);

    // Jib (horizontal arm)
    const jib = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 0.5), craneMat);
    jib.position.set(totalW / 2 + 6 - 5, totalH + 10, -2);
    jib.castShadow = true;
    crane.add(jib);

    // Counter-jib
    const cjib = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 0.5), craneMat);
    cjib.position.set(totalW / 2 + 6 + 5, totalH + 10, -2);
    crane.add(cjib);

    // Counterweight
    const cw = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.0, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
    );
    cw.position.set(totalW / 2 + 6 + 7.5, totalH + 9.5, -2);
    crane.add(cw);

    // Cable
    const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, totalH * 0.6, 4);
    const cable = new THREE.Mesh(cableGeo, new THREE.MeshStandardMaterial({ color: 0x444444 }));
    cable.position.set(totalW / 2 + 6 - 12, totalH + 10 - totalH * 0.3, -2);
    crane.add(cable);

    // Hook
    const hook = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      railMat.clone()
    );
    hook.position.set(totalW / 2 + 6 - 12, totalH + 10 - totalH * 0.6 - 0.3, -2);
    crane.add(hook);

    scene.add(crane);

    // ── NEIGHBORING BUILDINGS (silhouettes) ──
    for (const nb of [
      { x: -totalW - 8, z: 5, w: 8, h: totalH * 0.6, d: 6 },
      { x: totalW + 14, z: -4, w: 6, h: totalH * 0.4, d: 5 },
      { x: -5, z: -cfg.bD - 12, w: 10, h: totalH * 0.7, d: 7 },
    ]) {
      const nbMat = new THREE.MeshStandardMaterial({ color: 0x1a2536, roughness: 0.9 });
      const nbMesh = new THREE.Mesh(new THREE.BoxGeometry(nb.w, nb.h, nb.d), nbMat);
      nbMesh.position.set(nb.x, nb.h / 2, nb.z);
      nbMesh.castShadow = true;
      nbMesh.receiveShadow = true;
      scene.add(nbMesh);

      // Tiny window lights on neighbors
      for (let fy = 1; fy < nb.h / 3; fy++) {
        for (let fx = 0; fx < 3; fx++) {
          if (Math.random() > 0.5) {
            const nwMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffcc66, emissiveIntensity: 0.3 });
            const nw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), nwMat);
            nw.position.set(nb.x - nb.w / 2 + 1.5 + fx * 2.2, fy * 3 + 1, nb.z + nb.d / 2 + 0.03);
            scene.add(nw);
          }
        }
      }
    }

    // ── SCAN PLANE ──
    const scanMat2 = new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(totalW + 4, cfg.bD + 4), scanMat2);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.visible = false;
    building.add(scanPlane);

    // ── PARTICLES ──
    const pCount = 150;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 60;
      pPos[i * 3 + 1] = Math.random() * (totalH + 15);
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.12, color: ACCENT, transparent: true, opacity: 0.5
    }));
    scene.add(particles);

    // ── CAMERA ORBIT ──
    let angle = 0.7, elev = 0.35, dist = 55;
    let drag = false, px = 0, py = 0;
    const lookY = totalH * 0.4;

    const setCamera = () => {
      camera.position.set(
        Math.sin(angle) * Math.cos(elev) * dist,
        Math.sin(elev) * dist + lookY * 0.5,
        Math.cos(angle) * Math.cos(elev) * dist
      );
      camera.lookAt(0, lookY, 0);
    };
    setCamera();

    const onDown = (e) => { drag = true; px = e.clientX; py = e.clientY; };
    const onUp = () => { drag = false; };
    const onMove = (e) => {
      if (!drag) return;
      angle += (e.clientX - px) * 0.006;
      elev = Math.max(0.05, Math.min(1.3, elev + (e.clientY - py) * 0.005));
      px = e.clientX; py = e.clientY;
      setCamera();
    };
    const onWheel = (e) => {
      dist = Math.max(20, Math.min(100, dist + e.deltaY * 0.05));
      setCamera();
    };

    const cv = renderer.domElement;
    cv.addEventListener('mousedown', onDown);
    cv.addEventListener('mouseup', onUp);
    cv.addEventListener('mousemove', onMove);
    cv.addEventListener('wheel', onWheel);

    // Touch
    cv.addEventListener('touchstart', (e) => { if (e.touches[0]) { drag = true; px = e.touches[0].clientX; py = e.touches[0].clientY; } });
    cv.addEventListener('touchend', () => { drag = false; });
    cv.addEventListener('touchmove', (e) => {
      if (!drag || !e.touches[0]) return;
      angle += (e.touches[0].clientX - px) * 0.006;
      elev = Math.max(0.05, Math.min(1.3, elev + (e.touches[0].clientY - py) * 0.005));
      px = e.touches[0].clientX; py = e.touches[0].clientY;
      setCamera();
    });

    // ── ANIMATE ──
    let raf;
    let scanY = 0;
    const clock = new THREE.Clock();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      // Auto rotate
      if (!drag) { angle += 0.002; setCamera(); }

      // Particles
      const pa = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pa[i * 3 + 1] += 0.015 + Math.sin(t + i) * 0.005;
        if (pa[i * 3 + 1] > totalH + 15) pa[i * 3 + 1] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Scan plane
      if (isScanning) {
        scanPlane.visible = true;
        scanY += 0.25;
        if (scanY > totalH + 2) scanY = 0;
        scanPlane.position.y = scanY;
      } else {
        scanPlane.visible = false;
        scanY = 0;
      }

      // Crane cable sway
      cable.rotation.z = Math.sin(t * 0.5) * 0.03;
      hook.position.x = totalW / 2 + 6 - 12 + Math.sin(t * 0.5) * 0.3;

      renderer.render(scene, camera);
    };
    loop();

    // Resize
    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      cv.removeEventListener('mousedown', onDown);
      cv.removeEventListener('mouseup', onUp);
      cv.removeEventListener('mousemove', onMove);
      cv.removeEventListener('wheel', onWheel);
      renderer.dispose();
      while (el.firstChild) el.removeChild(el.firstChild);
    };

    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [sampleIndex, isScanning]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab', borderRadius: '12px', overflow: 'hidden' }} />;
}
