'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cinematic hero canvas: floating faceted crystal (icosahedron), orbiting
 * satellite, and a drifting particle field — racing red and silver over deep black.
 * Automatically disabled for reduced-motion users and small screens.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Skip the whole WebGL context on phones — the canvas is CSS-hidden there anyway,
    // and physical-transmission materials are too heavy for mobile GPUs.
    const isSmall = window.innerWidth < 768;
    if (prefersReduced || isSmall) return;

    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.4, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Lighting: cinematic key/fill/rim ──
    const ambient = new THREE.AmbientLight(0x3a1f1f, 1.15);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 5, 6);
    const rim = new THREE.DirectionalLight(0xe10600, 3.2);
    rim.position.set(-6, -2, -4);
    const glowPoint = new THREE.PointLight(0xff1e14, 22, 18, 2);
    glowPoint.position.set(0, 0, 0.6);
    scene.add(ambient, key, rim, glowPoint);

    // ── Hero object: glass-like faceted crystal ──
    const crystalGeo = new THREE.IcosahedronGeometry(1.55, 1);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x1b1b1f,
      metalness: 0.35,
      roughness: 0.12,
      transmission: 0.55,
      thickness: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      emissive: 0x2b0503,
      emissiveIntensity: 0.85,
      flatShading: true,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0.4, 0.15, 0);
    scene.add(crystal);

    // Glowing core inside the crystal
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 0),
      new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.95 })
    );
    core.position.copy(crystal.position);
    scene.add(core);

    // ── Orbiting satellite ──
    const orbitGroup = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.05, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0xe10600, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2.35;
    const satellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f4, emissive: 0xe10600, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.2 })
    );
    orbitGroup.add(ring, satellite);
    scene.add(orbitGroup);

    // ── Particle field ──
    const particleCount = isSmall ? 260 : 520;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 3.4 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffb3a6,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Interaction ──
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    mount.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      crystal.rotation.y = t * 0.28;
      crystal.rotation.x = Math.sin(t * 0.4) * 0.22;
      crystal.position.y = 0.15 + Math.sin(t * 0.85) * 0.18;
      core.rotation.y = -t * 0.5;
      core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08);

      const orbitT = t * 0.42;
      satellite.position.set(
        Math.cos(orbitT) * 3.05,
        Math.sin(orbitT) * Math.sin(Math.PI / 2.35) * 3.05,
        Math.sin(orbitT) * Math.cos(Math.PI / 2.35) * 3.05
      );
      satellite.rotation.x = t * 2;
      satellite.rotation.y = t * 1.4;

      particles.rotation.y = t * 0.018;

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;
      camera.position.x = pointer.x * 0.85;
      camera.position.y = 0.4 - pointer.y * 0.6;
      camera.lookAt(0.2, 0.1, 0);

      glowPoint.intensity = 20 + Math.sin(t * 1.5) * 6;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      mount.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else if (material) material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
