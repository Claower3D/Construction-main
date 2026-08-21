import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const BUILDING_CONFIGS = {
  foundation: { floors: 1, width: 12, depth: 10, floorH: 1.2, color: '#64748b', label: 'Фундамент М300', windows: false },
  masonry:    { floors: 5, width: 15, depth: 12, floorH: 3.0, color: '#f59e0b', label: 'Кладка газоблок D500', windows: true },
  roof:       { floors: 3, width: 14, depth: 10, floorH: 3.2, color: '#10b981', label: 'Кровля + фасад', windows: true, hasRoof: true },
  floor:      { floors: 1, width: 10, depth: 8, floorH: 0.06, color: '#38bdf8', label: 'Стяжка пола', windows: false },
};

export default function Building3DViewer({ sampleIndex = 0, isScanning = false }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const buildingRef = useRef(null);
  const frameRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const configKey = ['foundation', 'masonry', 'roof', 'floor'][sampleIndex] || 'masonry';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Cleanup prev
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (container.firstChild) container.removeChild(container.firstChild);
    }
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    camera.position.set(25, 20, 30);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f1628, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground grid
    const gridHelper = new THREE.GridHelper(60, 30, 0x1e3a5f, 0x0d1f3c);
    scene.add(gridHelper);

    // Build building
    const cfg = BUILDING_CONFIGS[configKey];
    const building = new THREE.Group();

    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.color),
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x224466, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const scanMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.5, transparent: true, opacity: 0.3 });

    for (let f = 0; f < cfg.floors; f++) {
      const y = f * cfg.floorH;
      
      // Floor slab
      const slabGeo = new THREE.BoxGeometry(cfg.width, 0.15, cfg.depth);
      const slab = new THREE.Mesh(slabGeo, frameMat.clone());
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      building.add(slab);

      // Walls (transparent box)
      const wallGeo = new THREE.BoxGeometry(cfg.width, cfg.floorH - 0.15, cfg.depth);
      const wallMesh = new THREE.Mesh(wallGeo, floorMat.clone());
      wallMesh.position.set(0, y + cfg.floorH / 2, 0);
      wallMesh.castShadow = true;
      building.add(wallMesh);

      // Wireframe edges
      const edgesGeo = new THREE.EdgesGeometry(wallGeo);
      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat.clone());
      edgeLines.position.copy(wallMesh.position);
      building.add(edgeLines);

      // Windows
      if (cfg.windows && cfg.floorH > 1) {
        const ww = 1.2, wh = 1.5, wd = 0.1;
        const windowGeo = new THREE.BoxGeometry(ww, wh, wd);
        const spacing = 2.5;
        const count = Math.floor((cfg.width - 2) / spacing);

        for (let wi = 0; wi < count; wi++) {
          const x = -cfg.width / 2 + 1.5 + wi * spacing;
          // Front
          const wf = new THREE.Mesh(windowGeo, windowMat.clone());
          wf.position.set(x, y + cfg.floorH * 0.5, cfg.depth / 2 + 0.01);
          building.add(wf);
          // Back
          const wb = new THREE.Mesh(windowGeo, windowMat.clone());
          wb.position.set(x, y + cfg.floorH * 0.5, -cfg.depth / 2 - 0.01);
          building.add(wb);
        }

        const countZ = Math.floor((cfg.depth - 2) / spacing);
        for (let wi = 0; wi < countZ; wi++) {
          const z = -cfg.depth / 2 + 1.5 + wi * spacing;
          const windowGeoZ = new THREE.BoxGeometry(wd, wh, ww);
          // Left
          const wl = new THREE.Mesh(windowGeoZ, windowMat.clone());
          wl.position.set(-cfg.width / 2 - 0.01, y + cfg.floorH * 0.5, z);
          building.add(wl);
          // Right
          const wr = new THREE.Mesh(windowGeoZ, windowMat.clone());
          wr.position.set(cfg.width / 2 + 0.01, y + cfg.floorH * 0.5, z);
          building.add(wr);
        }
      }
    }

    // Roof slab
    const topY = cfg.floors * cfg.floorH;
    const topSlab = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, 0.2, cfg.depth + 0.4), frameMat.clone());
    topSlab.position.set(0, topY, 0);
    topSlab.castShadow = true;
    building.add(topSlab);

    // Roof (pyramid) for roof type
    if (cfg.hasRoof) {
      const roofShape = new THREE.ConeGeometry(Math.max(cfg.width, cfg.depth) * 0.55, 4, 4);
      const roofMesh = new THREE.Mesh(roofShape, new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.6 }));
      roofMesh.position.set(0, topY + 2.2, 0);
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.castShadow = true;
      building.add(roofMesh);
    }

    // Scan plane (moves during scanning)
    const scanGeo = new THREE.PlaneGeometry(cfg.width + 2, cfg.depth + 2);
    const scanPlane = new THREE.Mesh(scanGeo, scanMat);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.position.set(0, 0, 0);
    scanPlane.visible = false;
    scanPlane.name = 'scanPlane';
    building.add(scanPlane);

    // Center building
    building.position.set(0, 0.08, 0);
    scene.add(building);
    buildingRef.current = building;

    // Particles (dust/sparks)
    const particlesGeo = new THREE.BufferGeometry();
    const pCount = 200;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.08, color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Mouse interaction
    let mouseX = 0, mouseY = 0, isDragging = false, prevX = 0, prevY = 0;
    let cameraAngle = 0.6, cameraElevation = 0.4, cameraDistance = 35;

    const updateCamera = () => {
      camera.position.x = Math.sin(cameraAngle) * Math.cos(cameraElevation) * cameraDistance;
      camera.position.y = Math.sin(cameraElevation) * cameraDistance + 5;
      camera.position.z = Math.cos(cameraAngle) * Math.cos(cameraElevation) * cameraDistance;
      camera.lookAt(0, topY * 0.4, 0);
    };
    updateCamera();

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      cameraAngle += dx * 0.005;
      cameraElevation = Math.max(0.1, Math.min(1.2, cameraElevation + dy * 0.005));
      prevX = e.clientX;
      prevY = e.clientY;
      updateCamera();
    };
    const onWheel = (e) => {
      cameraDistance = Math.max(15, Math.min(60, cameraDistance + e.deltaY * 0.03));
      updateCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation
    let clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Auto-rotate
      if (!isDragging) {
        cameraAngle += 0.003;
        updateCamera();
      }

      // Particles float
      const posArr = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        posArr[i * 3 + 1] += 0.01;
        if (posArr[i * 3 + 1] > 30) posArr[i * 3 + 1] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Pulsing glow on walls
      building.children.forEach(child => {
        if (child.material && child.material.opacity && child.name !== 'scanPlane') {
          // Subtle pulse
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [configKey]);

  // Scanning animation
  useEffect(() => {
    if (!buildingRef.current) return;
    const scanPlane = buildingRef.current.getObjectByName('scanPlane');
    if (!scanPlane) return;
    
    const cfg = BUILDING_CONFIGS[configKey];
    const maxH = cfg.floors * cfg.floorH + 1;
    
    if (isScanning) {
      scanPlane.visible = true;
      let scanY = 0;
      const scanInterval = setInterval(() => {
        scanY += 0.3;
        if (scanY > maxH) scanY = 0;
        scanPlane.position.y = scanY;
      }, 30);
      return () => { clearInterval(scanInterval); scanPlane.visible = false; };
    } else {
      scanPlane.visible = false;
    }
  }, [isScanning, configKey]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
}
