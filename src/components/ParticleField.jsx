import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COUNT = 135;
const REPEL_RADIUS = 120;
const REPEL_FORCE = 0.55;
const RETURN_FORCE = 0.015;
const DAMPING = 0.88;
const CONNECT_DIST = 80;
const CONNECT_ALPHA = 0.12;

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x0d0f14, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);

    // ── Particles ─────────────────────────────────────────────
    const particles = [];
    const canvas2d = document.createElement('canvas');
    canvas2d.width = canvas2d.height = 6;
    const c2d = canvas2d.getContext('2d');
    c2d.fillStyle = '#fff';
    c2d.beginPath();
    c2d.arc(3, 3, 3, 0, Math.PI * 2);
    c2d.fill();
    const spriteTex = new THREE.CanvasTexture(canvas2d);

    const rand = (a, b) => a + Math.random() * (b - a);

    function makeColor() {
      const roll = Math.random();
      if (roll < 0.60) {
        return new THREE.Color(`rgb(${~~rand(30,60)},${~~rand(80,120)},${~~rand(180,240)})`);
      } else if (roll < 0.85) {
        const g = ~~rand(80, 120);
        return new THREE.Color(`rgb(${g},${g},${g})`);
      } else {
        const g = ~~rand(200, 255);
        return new THREE.Color(`rgb(${g},${g},${g})`);
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const ox = rand(0, W), oy = rand(0, H);
      const size = rand(0.5, 2);
      const mat = new THREE.SpriteMaterial({ map: spriteTex, color: makeColor(), transparent: true, opacity: rand(0.5, 0.95) });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(size, size, 1);
      sprite.position.set(ox, oy, 0);
      scene.add(sprite);
      particles.push({ sprite, ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
    }

    // ── Connection lines (Canvas 2D overlay) ──────────────────
    const lineCanvas = document.createElement('canvas');
    lineCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    lineCanvas.width = W; lineCanvas.height = H;
    el.style.position = 'relative';
    el.appendChild(lineCanvas);
    const lctx = lineCanvas.getContext('2d');

    // ── Mouse tracking ────────────────────────────────────────
    const mouse = { x: -9999, y: -9999 };
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMove);

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      const nW = el.clientWidth, nH = el.clientHeight;
      renderer.setSize(nW, nH);
      camera.right = nW; camera.top = nH;
      camera.updateProjectionMatrix();
      lineCanvas.width = nW; lineCanvas.height = nH;
      // Scatter origins to new bounds
      particles.forEach(p => {
        p.ox = rand(0, nW); p.oy = rand(0, nH);
      });
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ────────────────────────────────────────
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Update physics
      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = (H - mouse.y) - p.y; // flip Y for Three.js coords
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }
        // Return to origin
        p.vx += (p.ox - p.x) * RETURN_FORCE;
        p.vy += (p.oy - p.y) * RETURN_FORCE;
        // Damping
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        p.sprite.position.set(p.x, p.y, 0);
      }

      // Draw connection lines on 2D overlay
      lctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
      lctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x, ay = lineCanvas.height - a.y;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = b.x, by = lineCanvas.height - b.y;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * CONNECT_ALPHA;
            lctx.strokeStyle = `rgba(37,99,235,${alpha.toFixed(3)})`;
            lctx.beginPath();
            lctx.moveTo(ax, ay);
            lctx.lineTo(bx, by);
            lctx.stroke();
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      spriteTex.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      if (el.contains(lineCanvas)) el.removeChild(lineCanvas);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
