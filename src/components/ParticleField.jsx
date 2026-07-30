import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Particle Grid parameters
    const spacing = 28; // fine comfortable grid spacing
    const cols = Math.ceil(width / spacing) + 4;
    const rows = Math.ceil(height / spacing) + 4;
    const count = cols * rows;

    // Dash capsule geometry (2px width, 6px height)
    const dashGeo = new THREE.PlaneGeometry(2, 6);

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    const instancedMesh = new THREE.InstancedMesh(dashGeo, material, count);
    scene.add(instancedMesh);

    // Particle instances storage
    const particles = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    let idx = 0;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = ((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = startX + c * spacing;
        const oy = startY - r * spacing;
        const baseAngle = -Math.PI / 4; // slant angle

        // Color spectrum across width: Red/Purple (left) -> Blue/Cyan (center) -> Orange/Yellow (right)
        const nx = (ox + width / 2) / width;
        let hue;
        if (nx < 0.35) {
          hue = THREE.MathUtils.lerp(0.96, 0.78, nx / 0.35);
        } else if (nx < 0.7) {
          hue = THREE.MathUtils.lerp(0.78, 0.58, (nx - 0.35) / 0.35);
        } else {
          hue = THREE.MathUtils.lerp(0.58, 0.08, (nx - 0.7) / 0.3);
        }

        color.setHSL(hue % 1.0, 0.85, 0.55);
        instancedMesh.setColorAt(idx, color);

        particles.push({
          id: idx,
          ox,
          oy,
          x: ox,
          y: oy,
          baseAngle,
          angle: baseAngle,
          scale: 0, // INVISIBLE by default! Appear ONLY on hover
        });

        idx++;
      }
    }
    instancedMesh.instanceColor.needsUpdate = true;

    // Mouse tracking & ripples
    const mouse = { x: -9999, y: -9999, active: false };
    const waves = [];

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left - width / 2;
      const my = -(e.clientY - rect.top - height / 2);

      const dx = mx - mouse.x;
      const dy = my - mouse.y;
      const dist = Math.hypot(dx, dy);

      mouse.active = true;

      // Spawn expanding shockwave ring on mouse move
      if (dist > 12 && mouse.x > -9000) {
        waves.push({
          x: mx,
          y: my,
          radius: 10,
          maxRadius: 200,
          speed: 5.0,
          strength: 30,
        });
        if (waves.length > 6) waves.shift();
      }

      mouse.x = mx;
      mouse.y = my;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

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

      // Expand wave rings
      for (let w = waves.length - 1; w >= 0; w--) {
        const wave = waves[w];
        wave.radius += wave.speed;
        if (wave.radius > wave.maxRadius) {
          waves.splice(w, 1);
        }
      }

      // Hover radius around mouse
      const hoverRadius = 190;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        let targetX = p.ox;
        let targetY = p.oy;
        let targetAngle = p.baseAngle;
        let targetScale = 0; // Default INVISIBLE (scale = 0)

        // 1. Mouse Proximity Hover — particles reveal ONLY when hovered!
        if (mouse.active) {
          const dx = p.ox - mouse.x;
          const dy = p.oy - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < hoverRadius && dist > 0) {
            // Smooth bell curve factor (0 at radius boundary, 1 at cursor center)
            const factor = Math.sin((1 - dist / hoverRadius) * (Math.PI / 2));
            targetScale = factor; // Scale smoothly up to 1 on hover!

            const pushDist = factor * 32; // smooth radial push
            const angle = Math.atan2(dy, dx);

            targetX += Math.cos(angle) * pushDist;
            targetY += Math.sin(angle) * pushDist;
            targetAngle = angle - Math.PI / 2;
          }
        }

        // 2. Wave Shockfront Reveal & Push
        for (let w = 0; w < waves.length; w++) {
          const wave = waves[w];
          const wdx = p.ox - wave.x;
          const wdy = p.oy - wave.y;
          const wdist = Math.hypot(wdx, wdy);
          const ringWidth = 45;
          const diff = Math.abs(wdist - wave.radius);

          if (diff < ringWidth && wdist > 0) {
            const waveFactor = (1 - diff / ringWidth) * (1 - wave.radius / wave.maxRadius);
            targetScale = Math.max(targetScale, waveFactor); // Wave reveals particles as it expands!

            const pushDist = waveFactor * wave.strength;
            const wAngle = Math.atan2(wdy, wdx);

            targetX += Math.cos(wAngle) * pushDist;
            targetY += Math.sin(wAngle) * pushDist;
            targetAngle = THREE.MathUtils.lerp(targetAngle, wAngle - Math.PI / 2, waveFactor * 0.5);
          }
        }

        // Smooth Lerp transitions: silky scale in/out & smooth motion
        const lerpSpeed = 0.12;
        p.x += (targetX - p.x) * lerpSpeed;
        p.y += (targetY - p.y) * lerpSpeed;
        p.angle += (targetAngle - p.angle) * lerpSpeed;
        p.scale += (targetScale - p.scale) * lerpSpeed;

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
      document.removeEventListener('mouseleave', handleMouseLeave);
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
