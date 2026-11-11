"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ThreeBodyModelProps {
  selectedPart: string;
  onSelectPart: (part: string) => void;
  rotationAngle: number;
  onAngleChange?: (angle: number) => void;
  isSpinning: boolean;
}

export function ThreeBodyModel({
  selectedPart,
  onSelectPart,
  rotationAngle,
  onAngleChange,
  isSpinning
}: ThreeBodyModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hotspotsRef = useRef<Record<string, THREE.Mesh>>({});

  // Dynamic prop refs for animation loop
  const isSpinningRef = useRef(isSpinning);
  const rotationAngleRef = useRef(rotationAngle);

  useEffect(() => {
    isSpinningRef.current = isSpinning;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isSpinning;
    }
  }, [isSpinning]);

  useEffect(() => {
    rotationAngleRef.current = rotationAngle;
    if (bodyGroupRef.current) {
      const targetRad = (rotationAngle * Math.PI) / 180;
      bodyGroupRef.current.rotation.y = targetRad;
    }
  }, [rotationAngle]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene & Dark Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 6.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls for Native Smooth 360° Drag & Zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.autoRotate = isSpinningRef.current;
    controls.autoRotateSpeed = 2.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.minPolarAngle = Math.PI / 4;
    controlsRef.current = controls;

    // Listen for OrbitControls change to sync angle
    controls.addEventListener('change', () => {
      if (bodyGroupRef.current && onAngleChange) {
        const deg = Math.round(((bodyGroupRef.current.rotation.y % (Math.PI * 2)) * 180) / Math.PI);
        onAngleChange(deg < 0 ? deg + 360 : deg);
      }
    });

    // 3D Grid Floor Helper
    const gridHelper = new THREE.GridHelper(18, 30, 0x666677, 0x22222e);
    gridHelper.position.y = -2.15;
    scene.add(gridHelper);

    // Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 3.0);
    keyLight.position.set(2, 6, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa0c0ff, 1.8);
    fillLight.position.set(-6, 4, 4);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 2.0);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);

    const ambientLight = new THREE.AmbientLight(0xdcdce5, 0.7);
    scene.add(ambientLight);

    // 3D Human Body Group
    const bodyGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    // Materials
    const muscleMat = new THREE.MeshStandardMaterial({
      color: 0xC87055,
      metalness: 0.82,
      roughness: 0.18
    });

    const muscleHighlightMat = new THREE.MeshStandardMaterial({
      color: 0xD87E62,
      metalness: 0.88,
      roughness: 0.12
    });

    const tendonMat = new THREE.MeshStandardMaterial({
      color: 0xEBE8E1,
      metalness: 0.6,
      roughness: 0.25
    });

    // --- ANATOMICAL T-POSE MUSCLE MODEL ---
    // Cranium & Face
    const craniumGeo = new THREE.SphereGeometry(0.32, 32, 32);
    craniumGeo.scale(0.88, 1.15, 0.95);
    const craniumMesh = new THREE.Mesh(craniumGeo, tendonMat);
    craniumMesh.position.set(0, 2.32, 0);
    bodyGroup.add(craniumMesh);

    const faceGeo = new THREE.SphereGeometry(0.24, 20, 20);
    faceGeo.scale(0.9, 0.95, 0.7);
    const faceMesh = new THREE.Mesh(faceGeo, muscleMat);
    faceMesh.position.set(0, 2.22, 0.18);
    bodyGroup.add(faceMesh);

    // Neck & Clavicle
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.35, 20);
    const neckMesh = new THREE.Mesh(neckGeo, muscleMat);
    neckMesh.position.set(0, 1.85, 0);
    bodyGroup.add(neckMesh);

    const clavicleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16);
    clavicleGeo.rotateZ(Math.PI / 2);
    const clavicleMesh = new THREE.Mesh(clavicleGeo, tendonMat);
    clavicleMesh.position.set(0, 1.68, 0.12);
    bodyGroup.add(clavicleMesh);

    // Chest & Pecs
    const chestGeo = new THREE.CylinderGeometry(0.72, 0.54, 0.85, 32);
    chestGeo.scale(1.25, 1, 0.85);
    const chestMesh = new THREE.Mesh(chestGeo, muscleMat);
    chestMesh.position.set(0, 1.3, 0);
    chestMesh.userData = { partName: 'chest' };
    bodyGroup.add(chestMesh);

    [-0.28, 0.28].forEach(x => {
      const pecGeo = new THREE.SphereGeometry(0.28, 24, 24);
      pecGeo.scale(1.1, 0.75, 0.5);
      const pecMesh = new THREE.Mesh(pecGeo, muscleHighlightMat);
      pecMesh.position.set(x, 1.42, 0.28);
      pecMesh.userData = { partName: 'chest' };
      bodyGroup.add(pecMesh);
    });

    // Abdominals (6-Pack)
    [-0.13, 0.13].forEach(x => {
      [0.94, 0.74, 0.54].forEach(y => {
        const abGeo = new THREE.SphereGeometry(0.13, 16, 16);
        abGeo.scale(0.9, 0.65, 0.45);
        const abMesh = new THREE.Mesh(abGeo, muscleHighlightMat);
        abMesh.position.set(x, y, 0.28);
        abMesh.userData = { partName: 'waist' };
        bodyGroup.add(abMesh);
      });
    });

    const albaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12);
    const albaMesh = new THREE.Mesh(albaGeo, tendonMat);
    albaMesh.position.set(0, 0.74, 0.32);
    bodyGroup.add(albaMesh);

    // Waist & Pelvis
    const waistGeo = new THREE.CylinderGeometry(0.52, 0.46, 0.65, 32);
    waistGeo.scale(1.12, 1, 0.88);
    const waistMesh = new THREE.Mesh(waistGeo, muscleMat);
    waistMesh.position.set(0, 0.62, 0);
    waistMesh.userData = { partName: 'waist' };
    bodyGroup.add(waistMesh);

    const pelvisGeo = new THREE.CylinderGeometry(0.46, 0.5, 0.42, 32);
    pelvisGeo.scale(1.18, 1, 0.88);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, muscleMat);
    pelvisMesh.position.set(0, 0.12, 0);
    pelvisMesh.userData = { partName: 'glutes' };
    bodyGroup.add(pelvisMesh);

    [-0.45, 0.45].forEach(x => {
      const hipJointGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const hipJointMesh = new THREE.Mesh(hipJointGeo, tendonMat);
      hipJointMesh.position.set(x, 0.05, 0);
      bodyGroup.add(hipJointMesh);
    });

    // Shoulders
    [-0.82, 0.82].forEach(x => {
      const shoulderGeo = new THREE.SphereGeometry(0.26, 24, 24);
      shoulderGeo.scale(1.1, 0.85, 0.95);
      const shoulderMesh = new THREE.Mesh(shoulderGeo, muscleHighlightMat);
      shoulderMesh.position.set(x, 1.58, 0);
      shoulderMesh.userData = { partName: 'shoulders' };
      bodyGroup.add(shoulderMesh);
    });

    // Extended T-Pose Arms
    [-1, 1].forEach(side => {
      const armGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.75, 24);
      armGeo.rotateZ(side * (Math.PI / 2));
      const armMesh = new THREE.Mesh(armGeo, muscleMat);
      armMesh.position.set(side * 1.25, 1.58, 0);
      armMesh.userData = { partName: 'arms' };
      bodyGroup.add(armMesh);

      const elbowGeo = new THREE.SphereGeometry(0.13, 16, 16);
      const elbowMesh = new THREE.Mesh(elbowGeo, tendonMat);
      elbowMesh.position.set(side * 1.68, 1.58, 0);
      bodyGroup.add(elbowMesh);

      const forearmGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.75, 24);
      forearmGeo.rotateZ(side * (Math.PI / 2));
      const forearmMesh = new THREE.Mesh(forearmGeo, muscleMat);
      forearmMesh.position.set(side * 2.1, 1.58, 0);
      forearmMesh.userData = { partName: 'arms' };
      bodyGroup.add(forearmMesh);

      const wristGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const wristMesh = new THREE.Mesh(wristGeo, tendonMat);
      wristMesh.position.set(side * 2.5, 1.58, 0);
      bodyGroup.add(wristMesh);

      const handGeo = new THREE.BoxGeometry(0.35, 0.08, 0.22);
      const handMesh = new THREE.Mesh(handGeo, muscleHighlightMat);
      handMesh.position.set(side * 2.7, 1.58, 0);
      bodyGroup.add(handMesh);
    });

    // Legs
    [-0.32, 0.32].forEach(x => {
      const thighGeo = new THREE.CylinderGeometry(0.28, 0.19, 0.95, 24);
      const thighMesh = new THREE.Mesh(thighGeo, muscleMat);
      thighMesh.position.set(x, -0.55, 0);
      thighMesh.userData = { partName: 'thighs' };
      bodyGroup.add(thighMesh);

      const quadGeo = new THREE.SphereGeometry(0.23, 20, 20);
      quadGeo.scale(0.85, 1.35, 0.6);
      const quadMesh = new THREE.Mesh(quadGeo, muscleHighlightMat);
      quadMesh.position.set(x, -0.52, 0.13);
      quadMesh.userData = { partName: 'thighs' };
      bodyGroup.add(quadMesh);

      const kneeGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const kneeMesh = new THREE.Mesh(kneeGeo, tendonMat);
      kneeMesh.position.set(x, -1.06, 0.04);
      bodyGroup.add(kneeMesh);

      const calfGeo = new THREE.CylinderGeometry(0.19, 0.11, 0.92, 24);
      const calfMesh = new THREE.Mesh(calfGeo, muscleMat);
      calfMesh.position.set(x, -1.55, 0);
      calfMesh.userData = { partName: 'thighs' };
      bodyGroup.add(calfMesh);

      const ankleGeo = new THREE.SphereGeometry(0.1, 14, 14);
      const ankleMesh = new THREE.Mesh(ankleGeo, tendonMat);
      ankleMesh.position.set(x, -2.02, 0);
      bodyGroup.add(ankleMesh);

      const footGeo = new THREE.BoxGeometry(0.16, 0.1, 0.4);
      const footMesh = new THREE.Mesh(footGeo, muscleHighlightMat);
      footMesh.position.set(x, -2.08, 0.14);
      bodyGroup.add(footMesh);
    });

    // Hotspots
    const hotspotConfigs: { name: string; pos: [number, number, number] }[] = [
      { name: 'chest', pos: [0, 1.4, 0.45] },
      { name: 'waist', pos: [0, 0.65, 0.4] },
      { name: 'arms', pos: [-1.8, 1.58, 0.1] },
      { name: 'shoulders', pos: [0, 1.62, 0.32] },
      { name: 'thighs', pos: [0.32, -0.55, 0.3] },
      { name: 'lats', pos: [0, 1.35, -0.42] },
      { name: 'glutes', pos: [0, 0.12, -0.42] }
    ];

    const hotspots: Record<string, THREE.Mesh> = {};

    hotspotConfigs.forEach(cfg => {
      const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: cfg.name === selectedPart ? 0x10B981 : 0x4F46E5
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(...cfg.pos);
      nodeMesh.userData = { partName: cfg.name };
      bodyGroup.add(nodeMesh);
      hotspots[cfg.name] = nodeMesh;
    });

    hotspotsRef.current = hotspots;

    // Raycaster for 3D Click Selection
    const domElement = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.partName) {
          onSelectPart(hit.userData.partName);
        }
      }
    };

    domElement.addEventListener('click', handleClick);

    // Render Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (bodyGroupRef.current) {
        if (isSpinningRef.current) {
          bodyGroupRef.current.rotation.y += 0.018;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('click', handleClick);
      controls.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update hotspot colors on selection change
  useEffect(() => {
    Object.keys(hotspotsRef.current).forEach(partName => {
      const mesh = hotspotsRef.current[partName];
      if (mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color.setHex(partName === selectedPart ? 0x10B981 : 0x4F46E5);
      }
    });
  }, [selectedPart]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <div className="absolute top-2 left-2 pointer-events-none bg-[#12141C]/90 border border-[#1E2230] px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-200 flex items-center gap-1.5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Three.js Orbit Engine • Drag to Rotate 360°
      </div>
    </div>
  );
}
