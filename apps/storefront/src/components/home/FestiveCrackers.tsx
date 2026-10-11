"use client";

import { useEffect, useRef } from "react";

type Rocket = { x: number; y: number; vx: number; vy: number; targetY: number; color: string; trail: [number, number][] };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string; size: number; twinkle: boolean };

const COLORS = ["#ffd25a", "#ff9f1c", "#ff6b35", "#ff4f9a", "#b980ff", "#7cf3ff", "#ffffff"];
// One show is a volley of rockets launched across this window; it plays on
// landing and again every REPEAT_EVERY while the hero is on screen.
const LAUNCH_WINDOW = 5000;
const REPEAT_EVERY = 30000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// Diwali fireworks over the homepage hero: rockets climb from the bottom and
// burst into glowing, fading sparks. Motion is per-second (not per-frame), so
// it looks the same on 60Hz and 120Hz screens.
export function FestiveCrackers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let visible = true;
    let frame = 0;
    let nextShow = 0;
    let running = false;
    let rockets: Rocket[] = [];
    let sparks: Spark[] = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(canvas);

    const launch = () => {
      rockets.push({
        x: rand(width * 0.12, width * 0.88),
        y: height + 10,
        vx: rand(-36, 36),
        vy: -(rand(height * 0.81, height * 0.99) + 240),
        targetY: rand(height * 0.12, height * 0.5),
        color: pick(),
        trail: [],
      });
    };

    const burst = (rocket: Rocket, small: boolean) => {
      const count = small ? 70 : 110;
      const palette = [rocket.color, pick(), "#fff3c4"];
      // About a third of the bursts are a clean ring; the rest fill in.
      const ring = Math.random() < 0.35;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.05, 0.05);
        const speed = (ring ? rand(324, 360) : rand(72, 408)) * (small ? 0.8 : 1);
        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.54, 0.96),
          color: palette[Math.floor(Math.random() * palette.length)],
          size: rand(1.8, 3.2),
          twinkle: Math.random() < 0.3,
        });
      }
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
      rockets = [];
      sparks = [];
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
    };

    const play = () => {
      if (running || !visible || document.hidden || width === 0) return;
      running = true;
      const small = width < 750;
      const launches = small ? 10 : 16;
      const start = performance.now();
      let launched = 0;
      let last = start;

      const tick = (now: number) => {
        // Scrolled past the hero or switched tabs: end the show quietly.
        if (!visible || document.hidden) { stop(); return; }
        const dt = Math.min((now - last) / 1000, 0.05);
        const frames = dt * 60;
        last = now;
        while (launched < launches && now - start > (launched / launches) * LAUNCH_WINDOW) {
          launch();
          launched++;
        }

        // Fade what's already drawn instead of clearing, so sparks leave
        // soft trails; "lighter" makes overlapping sparks glow.
        context.globalCompositeOperation = "destination-out";
        context.globalAlpha = 1;
        context.fillStyle = `rgba(0, 0, 0, ${1 - Math.pow(0.84, frames)})`;
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = "lighter";

        for (let i = rockets.length - 1; i >= 0; i--) {
          const rocket = rockets[i];
          rocket.trail.push([rocket.x, rocket.y]);
          if (rocket.trail.length > 8) rocket.trail.shift();
          rocket.x += rocket.vx * dt;
          rocket.y += rocket.vy * dt;
          rocket.vy *= Math.pow(0.985, frames);
          context.strokeStyle = "rgba(255, 214, 120, 0.7)";
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(rocket.trail[0][0], rocket.trail[0][1]);
          context.lineTo(rocket.x, rocket.y);
          context.stroke();
          if (rocket.y <= rocket.targetY || rocket.vy > -90) {
            burst(rocket, small);
            rockets.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const spark = sparks[i];
          const drag = Math.pow(0.975, frames);
          spark.vx *= drag;
          spark.vy = spark.vy * drag + 198 * dt;
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          spark.life -= spark.decay * dt;
          if (spark.life <= 0) { sparks.splice(i, 1); continue; }
          context.globalAlpha = spark.twinkle ? spark.life * (0.4 + Math.random() * 0.6) : spark.life;
          context.fillStyle = spark.color;
          context.beginPath();
          context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          context.fill();
        }

        if (launched >= launches && rockets.length === 0 && sparks.length === 0) { stop(); return; }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const schedule = (delay: number) => {
      nextShow = window.setTimeout(() => {
        play();
        schedule(REPEAT_EVERY);
      }, delay);
    };
    schedule(400);

    return () => {
      window.clearTimeout(nextShow);
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-fireworks" aria-hidden="true" />;
}
