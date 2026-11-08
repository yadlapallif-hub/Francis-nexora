'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cinematic hero backdrop: a levitating glass torus-knot hologram with
 * electric-blue rim light, drifting particles and slow camera drift.
 * Renders nothing under prefers-reduced-motion or on failure.
 */
export default function ThreeBackdrop() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frame = 0;
    try {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x040e22, 0.16);

      const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 7.4);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      // ── Lights ─────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0x24406b, 1.4));
      const key = new THREE.DirectionalLight(0xeaf2ff, 2.1);
      key.position.set(-3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x2563eb, 3.2);
      rim.position.set(4.5, -1.5, -2.5);
      scene.add(rim);
      const core = new THREE.PointLight(0x60a5fa, 60, 30);
      core.position.set(0, 0, 0);
      scene.add(core);

      // ── Torus knot hologram ────────────────────────────────
      const knotGeo = new THREE.TorusKnotGeometry(1.35, 0.42, 220, 36, 2, 3);
      const knotMat = new THREE.MeshPhysicalMaterial({
        color: 0x1d4ed8,
        emissive: 0x0b3aa8,
        emissiveIntensity: 0.9,
        metalness: 0.25,
        roughness: 0.18,
        transmission: 0.55,
        thickness: 1.4,
        transparent: true,
        opacity: 0.96,
        clearcoat: 1,
        clearcoatRoughness: 0.22,
      });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      scene.add(knot);

      // Wireframe echo shell
      const shellGeo = new THREE.TorusKnotGeometry(1.78, 0.028, 140, 12, 2, 3);
      const shellMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.5, wireframe: true });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      scene.add(shell);

      // Orbiting ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.9, 0.014, 8, 160),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2.35;
      scene.add(ring);

      // ── Particles ──────────────────────────────────────────
      const particleCount = 420;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        const r = 6 + Math.random() * 16;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        positions[i + 2] = r * Math.cos(phi);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x9cc0ff,
        size: 0.05,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // ── Interaction + loop ─────────────────────────────────
      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      mount.addEventListener('pointermove', onPointerMove);

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer?.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      const clock = new THREE.Clock();
      const animate = () => {
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        knot.rotation.x = t * 0.22;
        knot.rotation.y = t * 0.31;
        knot.position.y = Math.sin(t * 0.7) * 0.18;
        shell.rotation.x = -t * 0.16;
        shell.rotation.y = t * 0.22;
        shell.position.y = knot.position.y;
        ring.rotation.z = t * 0.18;
        particles.rotation.y = t * 0.02;
        camera.position.x += (pointer.x * 1.1 - camera.position.x) * 0.04;
        camera.position.y += (0.4 - pointer.y * 0.7 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer?.render(scene, camera);
      };
      animate();

      return () => {
        window.removeEventListener('resize', onResize);
        mount.removeEventListener('pointermove', onPointerMove);
        cancelAnimationFrame(frame);
        knotGeo.dispose();
        knotMat.dispose();
        shellGeo.dispose();
        shellMat.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        renderer?.dispose();
        if (renderer?.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch (error) {
      console.warn('[three] backdrop disabled:', error);
      if (renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      return undefined;
    }
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="pointer-events-auto absolute inset-0" />;
}
