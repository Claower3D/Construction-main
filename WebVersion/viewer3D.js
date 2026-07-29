// ========== 3D ESTIMATE VIEWER ==========
// Three.js визуализация строительной сметы
// Отображает 3D модель объекта с цветовой кодировкой материалов

(function () {
    'use strict';

    // Цвета материалов/компонентов
    const MATERIAL_COLORS = {
        concrete: { color: 0x8B8B88, label: 'Бетон', hex: '#8B8B88' },
        rebar: { color: 0x4A90D9, label: 'Арматура', hex: '#4A90D9' },
        brick: { color: 0xC2522A, label: 'Кирпич', hex: '#C2522A' },
        block: { color: 0xADB5BD, label: 'Блоки', hex: '#ADB5BD' },
        insulation: { color: 0xF5C542, label: 'Утеплитель', hex: '#F5C542' },
        waterproof: { color: 0x2ECC71, label: 'Гидроизоляция', hex: '#2ECC71' },
        roofing: { color: 0xE74C3C, label: 'Кровля', hex: '#E74C3C' },
        wood: { color: 0xB8860B, label: 'Дерево', hex: '#B8860B' },
        glass: { color: 0x87CEEB, label: 'Стекло', hex: '#87CEEB' },
        metal: { color: 0x708090, label: 'Металл', hex: '#708090' },
        ground: { color: 0x5D4037, label: 'Грунт', hex: '#5D4037' },
        generic: { color: 0x95A5A6, label: 'Общее', hex: '#95A5A6' }
    };

    let three = null; // Three.js module reference
    let scene, camera, renderer, controls;
    let meshes = [];
    let tooltip = null;
    let raycaster, mouse;
    let animationId = null;
    let currentEstimate = null;

    // ========== LOAD THREE.JS ==========
    function loadThreeJS() {
        return new Promise((resolve, reject) => {
            if (window.THREE) { resolve(window.THREE); return; }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
            script.onload = () => {
                // Load OrbitControls
                const ctrlScript = document.createElement('script');
                ctrlScript.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js';
                ctrlScript.onload = () => resolve(window.THREE);
                ctrlScript.onerror = () => {
                    // Fallback: no orbit controls, still resolve
                    resolve(window.THREE);
                };
                document.head.appendChild(ctrlScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // ========== INIT SCENE ==========
    function initScene(container) {
        const THREE = window.THREE;
        const w = container.clientWidth;
        const h = container.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a1628);
        scene.fog = new THREE.FogExp2(0x0a1628, 0.015);

        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
        camera.position.set(10, 8, 12);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Try orbit controls
        if (THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.target.set(0, 2, 0);
        }

        // Lights
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.9);
        directional.position.set(10, 15, 8);
        directional.castShadow = true;
        directional.shadow.mapSize.set(1024, 1024);
        scene.add(directional);

        const rimLight = new THREE.PointLight(0x3b82f6, 0.4, 50);
        rimLight.position.set(-5, 10, -5);
        scene.add(rimLight);

        // Ground grid
        const grid = new THREE.GridHelper(40, 40, 0x1e3a5f, 0x132844);
        scene.add(grid);

        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c1e35, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        scene.add(ground);

        // Raycaster for hover
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // Resize handler
        const resizeObserver = new ResizeObserver(() => {
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();
            renderer.setSize(cw, ch);
        });
        resizeObserver.observe(container);
    }

    // ========== BUILD 3D MODEL ==========
    function buildModel(estimate) {
        const THREE = window.THREE;
        if (!THREE || !scene) return;

        // Clear existing
        meshes.forEach(m => scene.remove(m));
        meshes = [];

        const type = estimate.objectType || 'generic';
        const dims = estimate.dimensions || {};
        const w = dims.widthM || 6;
        const h = dims.heightM || 3;
        const d = (estimate.objectParams?.depth || estimate.objectParams?.thickness || 0.5);

        switch (type) {
            case 'foundation_strip':
                buildFoundationStrip(w, h, d);
                break;
            case 'foundation_slab':
                buildFoundationSlab(w, h, d);
                break;
            case 'wall_brick':
            case 'wall_block':
                buildWall(w, h, d, type);
                break;
            case 'roof_flat':
                buildRoofFlat(w, h);
                break;
            case 'roof_gable':
                buildRoofGable(w, h, estimate.objectParams);
                break;
            case 'opening_door':
            case 'opening_window':
                buildOpening(w, h, type);
                break;
            case 'slab':
                buildSlab(w, h, d);
                break;
            default:
                buildGeneric(w, h, d);
        }
    }

    function createMesh(geo, matType, name, position = { x: 0, y: 0, z: 0 }) {
        const THREE = window.THREE;
        const colData = MATERIAL_COLORS[matType] || MATERIAL_COLORS.generic;
        const mat = new THREE.MeshStandardMaterial({
            color: colData.color,
            roughness: 0.7,
            metalness: 0.1,
            transparent: matType === 'glass',
            opacity: matType === 'glass' ? 0.35 : 1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { name, matType, label: colData.label };
        scene.add(mesh);
        meshes.push(mesh);
        return mesh;
    }

    // --- Builders ---
    function buildFoundationStrip(w, h, depth) {
        const THREE = window.THREE;
        const thick = 0.5;

        // Ground cutaway
        createMesh(new THREE.BoxGeometry(w + 2, depth, h + 2), 'ground', 'Котлован', { x: 0, y: -depth / 2, z: 0 });

        // Foundation strip (U-shape)
        createMesh(new THREE.BoxGeometry(w, depth, thick), 'concrete', 'Фундамент (фронт)', { x: 0, y: depth / 2, z: h / 2 });
        createMesh(new THREE.BoxGeometry(w, depth, thick), 'concrete', 'Фундамент (тыл)', { x: 0, y: depth / 2, z: -h / 2 });
        createMesh(new THREE.BoxGeometry(thick, depth, h), 'concrete', 'Фундамент (лево)', { x: -w / 2, y: depth / 2, z: 0 });
        createMesh(new THREE.BoxGeometry(thick, depth, h), 'concrete', 'Фундамент (право)', { x: w / 2, y: depth / 2, z: 0 });

        // Rebar markers
        const rebarGeo = new THREE.CylinderGeometry(0.02, 0.02, depth, 8);
        for (let i = -w / 2 + 0.3; i < w / 2; i += 0.4) {
            createMesh(rebarGeo, 'rebar', 'Арматура', { x: i, y: depth / 2, z: h / 2 });
        }

        // Waterproofing layer
        createMesh(new THREE.BoxGeometry(w + 0.1, 0.02, h + 0.1), 'waterproof', 'Гидроизоляция', { x: 0, y: depth + 0.01, z: 0 });
    }

    function buildFoundationSlab(w, h, thickness) {
        const THREE = window.THREE;
        const t = thickness || 0.3;
        // Ground
        createMesh(new THREE.BoxGeometry(w + 2, 0.4, h + 2), 'ground', 'Подготовка основания', { x: 0, y: -0.2, z: 0 });
        // Gravel cushion
        createMesh(new THREE.BoxGeometry(w + 0.5, 0.15, h + 0.5), 'generic', 'Щебёночная подушка', { x: 0, y: 0.075, z: 0 });
        // Slab
        createMesh(new THREE.BoxGeometry(w, t, h), 'concrete', 'Плита фундамента', { x: 0, y: t / 2 + 0.15, z: 0 });
        // Insulation
        createMesh(new THREE.BoxGeometry(w + 0.3, 0.05, h + 0.3), 'insulation', 'Утеплитель', { x: 0, y: t + 0.15 + 0.025, z: 0 });
    }

    function buildWall(w, h, thickness, type) {
        const THREE = window.THREE;
        const matType = type === 'wall_brick' ? 'brick' : 'block';
        createMesh(new THREE.BoxGeometry(w, h, thickness), matType, type === 'wall_brick' ? 'Кирпичная кладка' : 'Блочная кладка', { x: 0, y: h / 2, z: 0 });

        // Window opening
        if (w > 3) {
            createMesh(new THREE.BoxGeometry(1.2, 1.5, thickness + 0.1), 'glass', 'Оконный проём', { x: w / 4, y: h / 2 + 0.3, z: 0 });
        }
    }

    function buildRoofFlat(w, h) {
        const THREE = window.THREE;
        // Slab
        createMesh(new THREE.BoxGeometry(w, 0.2, h), 'concrete', 'Перекрытие', { x: 0, y: 0.1, z: 0 });
        // Slope screed
        createMesh(new THREE.BoxGeometry(w, 0.08, h), 'concrete', 'Разуклонка', { x: 0, y: 0.24, z: 0 });
        // Waterproofing
        createMesh(new THREE.BoxGeometry(w + 0.1, 0.01, h + 0.1), 'waterproof', 'ПВХ мембрана', { x: 0, y: 0.29, z: 0 });
        // Insulation
        createMesh(new THREE.BoxGeometry(w - 0.1, 0.1, h - 0.1), 'insulation', 'Утеплитель кровли', { x: 0, y: 0.35, z: 0 });
    }

    function buildRoofGable(w, h, params) {
        const THREE = window.THREE;
        const pitchRad = ((params?.pitch_deg || 30) * Math.PI) / 180;
        const rise = (w / 2) * Math.tan(pitchRad);

        // Ridge shape using custom geometry
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, 0);
        shape.lineTo(0, rise);
        shape.lineTo(w / 2, 0);
        shape.lineTo(-w / 2, 0);

        const extrudeSettings = { steps: 1, depth: h, bevelEnabled: false };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0, h / 2);
        createMesh(geo, 'roofing', 'Скат кровли', { x: 0, y: 0.1, z: 0 });

        // Rafters
        const rafterGeo = new THREE.BoxGeometry(0.05, 0.2, Math.sqrt((w / 2) ** 2 + rise ** 2));
        for (let z = -h / 2 + 0.5; z < h / 2; z += 0.8) {
            createMesh(rafterGeo, 'wood', 'Стропила', { x: -w / 4, y: rise / 2, z });
            createMesh(rafterGeo, 'wood', 'Стропила', { x: w / 4, y: rise / 2, z });
        }
    }

    function buildOpening(w, h, type) {
        const THREE = window.THREE;
        // Wall surround
        createMesh(new THREE.BoxGeometry(w + 1, h + 0.5, 0.38), 'brick', 'Стена', { x: 0, y: (h + 0.5) / 2, z: 0 });
        // Opening cut
        const oMat = type === 'opening_window' ? 'glass' : 'metal';
        const oLabel = type === 'opening_window' ? 'Окно ПВХ' : 'Дверь';
        createMesh(new THREE.BoxGeometry(w, h, 0.1), oMat, oLabel, { x: 0, y: h / 2 + (type === 'opening_window' ? 0.5 : 0), z: 0 });

        // Lintel
        createMesh(new THREE.BoxGeometry(w + 0.3, 0.15, 0.38), 'concrete', 'Перемычка', { x: 0, y: h + (type === 'opening_window' ? 0.5 : 0) + 0.075, z: 0 });
    }

    function buildSlab(w, h, thickness) {
        const THREE = window.THREE;
        createMesh(new THREE.BoxGeometry(w, thickness, h), 'concrete', 'Плита перекрытия', { x: 0, y: thickness / 2, z: 0 });
        // Rebar mesh
        createMesh(new THREE.BoxGeometry(w - 0.2, 0.01, h - 0.2), 'rebar', 'Арматурная сетка', { x: 0, y: thickness * 0.2, z: 0 });
    }

    function buildGeneric(w, h, d) {
        const THREE = window.THREE;
        createMesh(new THREE.BoxGeometry(w, h, d || 2), 'concrete', 'Конструкция', { x: 0, y: h / 2, z: 0 });
    }

    // ========== HOVER ==========
    function onMouseMove(e) {
        if (!renderer || !camera) return;
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshes);

        if (tooltip) {
            if (intersects.length > 0) {
                const obj = intersects[0].object;
                tooltip.style.display = 'block';
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
                tooltip.textContent = `${obj.userData.name} (${obj.userData.label})`;
            } else {
                tooltip.style.display = 'none';
            }
        }
    }

    // ========== ANIMATION LOOP ==========
    function animate() {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    // ========== RENDER UI ==========
    function renderUI(estimate) {
        const overlay = document.createElement('div');
        overlay.className = 'viewer3d-overlay';

        const usedMats = new Set(meshes.map(m => m.userData.matType).filter(Boolean));

        overlay.innerHTML = `
            <div class="viewer3d-toolbar">
                <h3>🏗️ 3D-визуализация сметы</h3>
                <div class="viewer3d-actions">
                    <button class="v3d-btn" data-action="reset-cam">🎯 Сброс камеры</button>
                    <button class="v3d-btn" data-action="wireframe">🔲 Каркас</button>
                    <button class="v3d-btn" data-action="explode">💥 Разрез</button>
                    <button class="v3d-close" data-action="close">✕</button>
                </div>
            </div>
            <div class="viewer3d-canvas-wrap" id="v3dCanvasWrap">
                <div class="viewer3d-loading" id="v3dLoading">
                    <div class="spinner"></div>
                    <p>Загрузка Three.js...</p>
                </div>
            </div>
            <div class="v3d-tooltip" id="v3dTooltip"></div>
        `;

        document.body.appendChild(overlay);
        tooltip = overlay.querySelector('#v3dTooltip');

        // Bind actions
        overlay.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') close();
                else if (action === 'reset-cam') resetCamera();
                else if (action === 'wireframe') toggleWireframe(btn);
                else if (action === 'explode') toggleExplode(btn);
            });
        });

        return overlay;
    }

    function addInfoPanel(overlay, estimate) {
        const dims = estimate.dimensions || {};
        const type = estimate.objectType || 'generic';
        const accuracy = estimate.accuracy || 0;
        const totalMat = (estimate.results?.materials || []).reduce((s, m) => s + (m.quantity || 0) * (m.price || 0), 0);
        const totalWork = (estimate.results?.works || []).reduce((s, w) => s + (w.quantity || 0) * (w.price || 0), 0);

        const panel = document.createElement('div');
        panel.className = 'viewer3d-info';
        panel.innerHTML = `
            <h4>📐 Параметры объекта</h4>
            <div class="v3d-info-row"><span class="label">Тип</span><span class="value">${type}</span></div>
            <div class="v3d-info-row"><span class="label">Ширина</span><span class="value">${dims.widthM?.toFixed(1) || '?'} м</span></div>
            <div class="v3d-info-row"><span class="label">Высота</span><span class="value">${dims.heightM?.toFixed(1) || '?'} м</span></div>
            <div class="v3d-info-row"><span class="label">Площадь</span><span class="value">${dims.areaM2?.toFixed(1) || '?'} м²</span></div>
            <div class="v3d-info-row"><span class="label">Точность</span><span class="value">${accuracy}%</span></div>
            <div class="v3d-info-row" style="border:none;padding-top:8px">
                <span class="label" style="font-weight:700;color:#f1f5f9">Итого</span>
                <span class="value" style="color:#10b981">${(totalMat + totalWork).toLocaleString('ru-RU')} ₸</span>
            </div>
        `;
        const canvasWrap = overlay.querySelector('.viewer3d-canvas-wrap');
        canvasWrap.appendChild(panel);
    }

    function addLegendPanel(overlay) {
        const usedMats = [...new Set(meshes.map(m => m.userData.matType).filter(Boolean))];
        if (usedMats.length === 0) return;

        const legend = document.createElement('div');
        legend.className = 'viewer3d-legend';
        legend.innerHTML = usedMats.map(mt => {
            const c = MATERIAL_COLORS[mt] || MATERIAL_COLORS.generic;
            return `<div class="v3d-legend-item">
                <div class="v3d-legend-swatch" style="background:${c.hex}"></div>
                <span>${c.label}</span>
            </div>`;
        }).join('');
        const canvasWrap = overlay.querySelector('.viewer3d-canvas-wrap');
        canvasWrap.appendChild(legend);
    }

    // ========== CONTROLS ==========
    function resetCamera() {
        if (camera) {
            camera.position.set(10, 8, 12);
            if (controls) controls.target.set(0, 2, 0);
        }
    }

    let isWireframe = false;
    function toggleWireframe(btn) {
        isWireframe = !isWireframe;
        btn.classList.toggle('active', isWireframe);
        meshes.forEach(m => { if (m.material) m.material.wireframe = isWireframe; });
    }

    let isExploded = false;
    function toggleExplode(btn) {
        isExploded = !isExploded;
        btn.classList.toggle('active', isExploded);
        const factor = isExploded ? 1.5 : 1;
        meshes.forEach(m => {
            m.position.x = (m.userData._origX || m.position.x) * factor;
            m.position.y = (m.userData._origY || m.position.y) * factor;
            m.position.z = (m.userData._origZ || m.position.z) * factor;
            if (!m.userData._origX) {
                m.userData._origX = m.position.x;
                m.userData._origY = m.position.y;
                m.userData._origZ = m.position.z;
            }
        });
    }

    // ========== CLOSE ==========
    function close() {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        if (renderer) renderer.dispose();
        scene = camera = renderer = controls = null;
        meshes = [];
        document.querySelector('.viewer3d-overlay')?.remove();
    }

    // ========== SHOW ==========
    async function show(estimate) {
        if (!estimate) return;

        // WebGL support check
        if (!_isWebGLAvailable()) {
            const msg = '⚠️ Ваш браузер или устройство не поддерживает WebGL.\n3D-визуализация недоступна.\n\nПопробуйте обновить браузер или драйверы видеокарты.';
            if (window.QazUI && window.QazUI.alert) {
                window.QazUI.alert(msg);
            } else {
                alert(msg);
            }
            return;
        }

        currentEstimate = estimate;

        const overlay = renderUI(estimate);
        const container = overlay.querySelector('#v3dCanvasWrap');
        const loading = overlay.querySelector('#v3dLoading');

        try {
            await loadThreeJS();

            initScene(container);
            buildModel(estimate);

            // Save original positions for explode
            meshes.forEach(m => {
                m.userData._origX = m.position.x;
                m.userData._origY = m.position.y;
                m.userData._origZ = m.position.z;
            });

            addInfoPanel(overlay, estimate);
            addLegendPanel(overlay);

            if (loading) loading.remove();

            animate();
        } catch (err) {
            console.error('3D Viewer error:', err);
            if (loading) {
                loading.querySelector('p').textContent = '❌ Ошибка загрузки Three.js';
                loading.querySelector('.spinner')?.remove();
            }
        }
    }

    /**
     * Check WebGL availability
     */
    function _isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (
                canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            ));
        } catch (e) {
            return false;
        }
    }

    // ========== PUBLIC API ==========
    window.Viewer3D = {
        show,
        close,
        isOpen: () => !!document.querySelector('.viewer3d-overlay')
    };

    console.log('✅ Viewer3D module loaded');
})();
