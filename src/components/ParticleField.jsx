import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Three.js Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Particle Grid parameters
    const spacing = 28;
    const cols = Math.ceil(width / spacing) + 4;
    const rows = Math.ceil(height / spacing) + 4;
    const count = cols * rows;

    // Geometry for small dash/capsule (thin rectangle)
    const dashGeo = new THREE.PlaneGeometry(3, 8);

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const instancedMesh = new THREE.InstancedMesh(dashGeo, material, count);
    scene.add(instancedMesh);

    // Store particle data
    const particles = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    let idx = 0;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = ((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = startX + c * spacing + (Math.random() - 0.5) * 4;
        const oy = startY - r * spacing + (Math.random() - 0.5) * 4;
        const baseAngle = (Math.random() - 0.5) * 0.4 - Math.PI / 4; // slight diagonal dash slant like Antigravity

        // Color spectrum mapping: normalized screen position (0 to 1)
        const nx = (ox + width / 2) / width;
        const ny = (oy + height / 2) / height;

        // Gradient from Red/Purple (left) -> Blue/Indigo (center) -> Orange/Yellow (right)
        let hue;
        if (nx < 0.35) {
          // Red to Magenta/Purple (hue ~0.95 to 0.8)
          hue = THREE.MathUtils.lerp(0.96, 0.78, nx / 0.35);
        } else if (nx < 0.7) {
          // Purple to Blue/Cyan (hue ~0.78 to 0.55)
          hue = THREE.MathUtils.lerp(0.78, 0.58, (nx - 0.35) / 0.35);
        } else {
          // Blue to Orange/Yellow (hue ~0.55 to 0.08)
          hue = THREE.MathUtils.lerp(0.58, 0.08, (nx - 0.7) / 0.3);
        }

        const sat = 0.75 + Math.random() * 0.2;
        const light = 0.5 + Math.random() * 0.15;
        color.setHSL(hue % 1.0, sat, light);

        instancedMesh.setColorAt(idx, color);

        particles.push({
          id: idx,
          ox,
          oy,
          x: ox,
          y: oy,
          vx: 0,
          vy: 0,
          baseAngle,
          angle: baseAngle,
          vAngle: 0,
          scale: 1,
        });

        idx++;
      }
    }
    instancedMesh.instanceColor.needsUpdate = true;

    // Mouse tracking & ripples
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0 };
    const waves = []; // active shockwave ripples

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left - width / 2;
      const my = -(e.clientY - rect.top - height / 2);

      const dx = mx - mouse.x;
      const dy = my - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        // Spawn a wave ripple on mouse move
        waves.push({
          x: mx,
          y: my,
          radius: 10,
          maxRadius: 160 + Math.min(dist * 2, 100),
          speed: 4 + Math.min(dist * 0.1, 6),
          intensity: Math.min(1.2, 0.4 + dist * 0.02),
        });
        if (waves.length > 8) waves.shift();
      }

      mouse.x = mx;
      mouse.y = my;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Update waves
      for (let w = waves.length - 1; w >= 0; w--) {
        const wave = waves[w];
        wave.radius += wave.speed;
        if (wave.radius > wave.maxRadius) {
          waves.splice(w, 1);
        }
      }

      // Physics and displacement update for each particle
      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Direct mouse radial push
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.hypot(mdx, mdy);
        const mRadius = 140;

        if (mDist < mRadius && mDist > 0) {
          const force = (1 - mDist / mRadius) * 2.5;
          const pushX = (mdx / mDist) * force;
          const pushY = (mdy / mDist) * force;
          p.vx += pushX;
          p.vy += pushY;
          p.vAngle += (Math.atan2(mdy, mdx) - p.angle) * 0.05 * force;
        }

        // Wave front pushes
        for (let w = 0; w < waves.length; w++) {
          const wave = waves[w];
          const wdx = p.x - wave.x;
          const wdy = p.y - wave.y;
          const wDist = Math.hypot(wdx, wdy);
          const waveThickness = 35;
          const diff = Math.abs(wDist - wave.radius);

          if (diff < waveThickness && wDist > 0) {
            const waveForce = (1 - diff / waveThickness) * wave.intensity * 1.8;
            p.vx += (wdx / wDist) * waveForce;
            p.vy += (wdy / wDist) * waveForce;
            p.vAngle += (Math.atan2(wdy, wdx) - p.angle) * 0.08 * waveForce;
          }
        }

        // Spring force to origin
        const k = 0.08; // stiffness
        const damp = 0.82; // damping

        const fx = (p.ox - p.x) * k;
        const fy = (p.oy - p.y) * k;

        p.vx = (p.vx + fx) * damp;
        p.vy = (p.vy + fy) * damp;

        p.x += p.vx;
        p.y += p.vy;

        // Angular spring
        const fAngle = (p.baseAngle - p.angle) * 0.1;
        p.vAngle = (p.vAngle + fAngle) * damp;
        p.angle += p.vAngle;

        // Scale effect based on movement speed
        const speed = Math.hypot(p.vx, p.vy);
        const targetScale = 1 + Math.min(speed * 0.15, 0.8);
        p.scale += (targetScale - p.scale) * 0.1;

        // Apply matrix transformation to dummy instance
        dummy.position.set(p.x, p.y, 0);
        dummy.rotation.z = p.angle;
        dummy.scale.set(p.scale, p.scale, 1);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      dashGeo.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    />
  );
}
