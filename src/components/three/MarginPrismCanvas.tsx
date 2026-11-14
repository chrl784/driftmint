'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, TrendingUp } from 'lucide-react';

export function MarginPrismCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setFallbackMode(true);
      return;
    }

    let animationFrameId = 0;
    let renderer: import('three').WebGLRenderer | null = null;
    let isDisposed = false;

    async function initThree() {
      try {
        const THREE = await import('three');
        if (isDisposed || !container) return;

        const width = container.clientWidth || 380;
        const height = container.clientHeight || 320;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        camera.position.set(0, 0.3, 4.6);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // Inner emerald revenue core
        const coreGeo = new THREE.OctahedronGeometry(0.92, 0);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x059669,
          roughness: 0.25,
          metalness: 0.35,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // Outer protective scope wireframe shield
        const cageGeo = new THREE.IcosahedronGeometry(1.48, 0);
        const cageWire = new THREE.WireframeGeometry(cageGeo);
        const cageMat = new THREE.LineBasicMaterial({
          color: 0x2563eb,
          transparent: true,
          opacity: 0.55,
        });
        const cageLines = new THREE.LineSegments(cageWire, cageMat);
        group.add(cageLines);

        // Orbiting ring representing continuous billable guard
        const ringGeo = new THREE.TorusGeometry(1.88, 0.025, 16, 72);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.45,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.6;
        group.add(ringMesh);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0x93c5fd, 2.2);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x34d399, 1.5);
        rimLight.position.set(-4, -2, 3);
        scene.add(rimLight);

        let targetX = 0;
        let targetY = 0;

        const handlePointerMove = (event: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
          targetX = ny * 0.35;
          targetY = nx * 0.45;
        };

        container.addEventListener('pointermove', handlePointerMove, { passive: true });

        const handleResize = () => {
          if (!container || !renderer) return;
          const w = container.clientWidth || 380;
          const h = container.clientHeight || 320;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
          if (isDisposed || !renderer) return;
          coreMesh.rotation.y += 0.008;
          coreMesh.rotation.x += 0.003;
          cageLines.rotation.y -= 0.004;
          ringMesh.rotation.z += 0.005;

          group.rotation.x += (targetX - group.rotation.x) * 0.06;
          group.rotation.y += (targetY - group.rotation.y) * 0.06;

          renderer.render(scene, camera);
          animationFrameId = window.requestAnimationFrame(animate);
        };

        animate();

        return () => {
          container.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('resize', handleResize);
          coreGeo.dispose();
          coreMat.dispose();
          cageGeo.dispose();
          cageWire.dispose();
          cageMat.dispose();
          ringGeo.dispose();
          ringMat.dispose();
        };
      } catch {
        setFallbackMode(true);
      }
    }

    let cleanupScene: (() => void) | undefined;
    initThree().then((fn) => {
      cleanupScene = fn;
    });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrameId);
      if (cleanupScene) cleanupScene();
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/90 via-white to-emerald-50/80 shadow-inner sm:h-[340px]">
      {fallbackMode ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-base font-bold text-slate-900">Active Margin Shield</p>
          <p className="max-w-xs text-sm text-slate-600">
            Every out-of-scope Slack or email request is automatically priced and converted into a payable Change Order.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" aria-hidden="true" />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/80 bg-white/85 px-3.5 py-2.5 text-xs shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Margin Shield Engine
        </div>
        <div className="inline-flex items-center gap-1 font-bold text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          +24.8% avg. project profit
        </div>
      </div>
    </div>
  );
}
