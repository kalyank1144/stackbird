import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const COLORS = [
  'rgba(59, 130, 246, 0.4)', // Blue-500 (60%)
  'rgba(59, 130, 246, 0.35)', // Blue-500
  'rgba(59, 130, 246, 0.3)', // Blue-500
  'rgba(147, 51, 234, 0.35)', // Purple-600 (20%)
  'rgba(147, 51, 234, 0.3)', // Purple-600
  'rgba(148, 163, 184, 0.3)', // Slate-400 (20%)
];

const CONFIG = {
  particleCount: 80,
  maxSpeed: 2,
  perceptionRadius: 100,
  separationDist: 30,
  alignmentWeight: 0.05,
  cohesionWeight: 0.02,
  separationWeight: 0.08,
  antigravityForce: -0.015,
  mouseRepelRadius: 200,
  mouseRepelForce: 0.5,
};

export function BoidsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  const initParticles = useCallback((width: number, height: number) => {
    particlesRef.current = Array.from({ length: CONFIG.particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
      vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
      size: 2 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }, []);

  const updateParticle = useCallback((particle: Particle, particles: Particle[], width: number, height: number) => {
    let avgVx = 0,
      avgVy = 0,
      avgX = 0,
      avgY = 0;
    let sepX = 0,
      sepY = 0;
    let neighbors = 0;

    for (const other of particles) {
      if (other === particle) {
        continue;
      }

      const dx = other.x - particle.x;
      const dy = other.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.perceptionRadius) {
        neighbors++;
        avgVx += other.vx;
        avgVy += other.vy;
        avgX += other.x;
        avgY += other.y;

        if (dist < CONFIG.separationDist && dist > 0) {
          sepX -= dx / dist;
          sepY -= dy / dist;
        }
      }
    }

    if (neighbors > 0) {
      // Alignment
      particle.vx += (avgVx / neighbors - particle.vx) * CONFIG.alignmentWeight;
      particle.vy += (avgVy / neighbors - particle.vy) * CONFIG.alignmentWeight;

      // Cohesion
      particle.vx += (avgX / neighbors - particle.x) * CONFIG.cohesionWeight;
      particle.vy += (avgY / neighbors - particle.y) * CONFIG.cohesionWeight;
    }

    // Separation
    particle.vx += sepX * CONFIG.separationWeight;
    particle.vy += sepY * CONFIG.separationWeight;

    // Antigravity (float upward)
    particle.vy += CONFIG.antigravityForce;

    // Mouse repulsion
    const mdx = particle.x - mouseRef.current.x;
    const mdy = particle.y - mouseRef.current.y;
    const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

    if (mDist < CONFIG.mouseRepelRadius && mDist > 0) {
      const force = (CONFIG.mouseRepelRadius - mDist) / CONFIG.mouseRepelRadius;
      particle.vx += (mdx / mDist) * force * CONFIG.mouseRepelForce;
      particle.vy += (mdy / mDist) * force * CONFIG.mouseRepelForce;
    }

    // Limit speed
    const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);

    if (speed > CONFIG.maxSpeed) {
      particle.vx = (particle.vx / speed) * CONFIG.maxSpeed;
      particle.vy = (particle.vy / speed) * CONFIG.maxSpeed;
    }

    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Wrap around edges
    if (particle.x < 0) {
      particle.x = width;
    }

    if (particle.x > width) {
      particle.x = 0;
    }

    if (particle.y < 0) {
      particle.y = height;
    }

    if (particle.y > height) {
      particle.y = 0;
    }
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(-p.size, -p.size / 2, p.size * 2, p.size, p.size / 3);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return undefined;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const particles = particlesRef.current;

      for (const p of particles) {
        updateParticle(p, particles, canvas.width, canvas.height);
      }
      draw(ctx, particles);
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, updateParticle, draw]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}
