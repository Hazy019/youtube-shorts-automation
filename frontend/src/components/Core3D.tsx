'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
}

function project(x: number, y: number, z: number, fov: number, cx: number, cy: number) {
  const scale = fov / (fov + z);
  return { px: x * scale + cx, py: y * scale + cy, scale };
}

export default function Core3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Generate icosahedron-inspired wireframe vertices on a sphere
    const POINTS = 120;
    const RADIUS = 140;
    const particles: Particle[] = [];

    for (let i = 0; i < POINTS; i++) {
      // Fibonacci sphere distribution for even coverage
      const phi = Math.acos(1 - (2 * (i + 0.5)) / POINTS);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = RADIUS * Math.sin(phi) * Math.sin(theta);
      const z = RADIUS * Math.cos(phi);
      particles.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    // Build edges: connect nearby points
    const edges: [number, number][] = [];
    const EDGE_DIST = RADIUS * 0.72;
    for (let i = 0; i < POINTS; i++) {
      for (let j = i + 1; j < POINTS; j++) {
        const dx = particles[i].ox - particles[j].ox;
        const dy = particles[i].oy - particles[j].oy;
        const dz = particles[i].oz - particles[j].oz;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < EDGE_DIST) {
          edges.push([i, j]);
        }
      }
    }

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const FOV = 350;

      ctx.clearRect(0, 0, W, H);

      // Rotate all points
      const rx = t * 0.18;
      const ry = t * 0.28;
      const floatY = Math.sin(t * 0.6) * 18;

      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);

      const projected = particles.map((p) => {
        // Rotate Y
        let x = p.ox * cosY - p.oz * sinY;
        let z = p.ox * sinY + p.oz * cosY;
        // Rotate X
        let y = p.oy * cosX - z * sinX;
        z = p.oy * sinX + z * cosX;

        return project(x, y + floatY, z, FOV, cx, cy);
      });

      // Draw edges
      for (const [i, j] of edges) {
        const a = projected[i];
        const b = projected[j];
        const depth = (a.scale + b.scale) / 2;
        const alpha = Math.max(0, Math.min(0.55, depth * 0.55));

        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        // Color gradient from purple to magenta based on depth
        const r = Math.round(147 + (217 - 147) * depth);
        const g = Math.round(51 + (70 - 51) * depth);
        const b2 = Math.round(234 + (239 - 234) * depth);
        ctx.strokeStyle = `rgba(${r},${g},${b2},${alpha})`;
        ctx.lineWidth = 0.8 * depth;
        ctx.stroke();
      }

      // Draw nodes
      for (const p of projected) {
        const alpha = Math.max(0, Math.min(0.9, p.scale * 0.8));
        const r = 2.2 * p.scale;
        if (r < 0.4) continue;

        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 38, 211, ${alpha})`;
        ctx.fill();
      }

      // Draw glowing inner core
      const pulse = 1 + Math.sin(t * 1.8) * 0.06;
      const coreR = 44 * pulse;
      const grad = ctx.createRadialGradient(cx, cy + floatY, 0, cx, cy + floatY, coreR);
      grad.addColorStop(0, 'rgba(217, 70, 239, 0.85)');
      grad.addColorStop(0.4, 'rgba(147, 51, 234, 0.4)');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy + floatY, coreR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Outer glow halo
      const haloR = 170 * pulse;
      const halo = ctx.createRadialGradient(cx, cy + floatY, coreR * 0.5, cx, cy + floatY, haloR);
      halo.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
      halo.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy + floatY, haloR, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      t += 0.012;
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
