import React, { useEffect, useRef } from "react";

const NetworkAnimation = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particleCount = 80;
    const backgroundParticleCount = 40;
    const maxDistance = 150;

    const allParticles = [];

    const createParticles = (count, depth = "foreground") => {
      const layer = depth === "foreground" ? 1 : 0.4;

      for (let i = 0; i < count; i++) {
        const radius = (() => {
          const r = Math.random();
          if (r < 0.1) return Math.random() * 2 + 1;
          if (r > 0.9) return Math.random() * 10 + 10;
          return depth === "foreground"
            ? Math.random() * 5 + 4
            : Math.random() * 3 + 2;
        })();

        const opacity =
          depth === "foreground"
            ? Math.random() * 0.6 + 0.4
            : Math.random() * 0.3 + 0.1;

        allParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3 * layer,
          vy: (Math.random() - 0.5) * 0.3 * layer,
          radius,
          layer,
          pulse: Math.random() * Math.PI * 2,
          opacity,
          depth,
        });
      }
    };

    createParticles(particleCount, "foreground");
    createParticles(backgroundParticleCount, "background");

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouse = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#050d2d";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < allParticles.length; i++) {
        const p = allParticles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.pulse += 0.02;
        const scale = 1 + 0.2 * Math.sin(p.pulse);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle =
          p.depth === "foreground"
            ? `rgba(74, 137, 220, ${p.opacity})`
            : `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < allParticles.length; j++) {
          const q = allParticles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance * p.layer && p.depth === q.depth) {
            const opacity = (1 - dist / maxDistance) * 0.5 * p.layer;

            const mouseDist = Math.hypot(
              mouse.current.x - p.x,
              mouse.current.y - p.y
            );
            const highlight = mouseDist < 150;

            const strokeColor = highlight
              ? `rgba(255, 255, 255, ${opacity + 0.2})`
              : `rgba(74, 137, 220, ${opacity})`;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = p.layer * (highlight ? 3.5 : 2.5);
            ctx.stroke();

            const pulseProgress = (Date.now() / 1000 + i * 0.01) % 1;
            const px = p.x + (q.x - p.x) * pulseProgress;
            const py = p.y + (q.y - p.y) * pulseProgress;

            ctx.beginPath();
            ctx.arc(px, py, 3.5 * p.layer, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${opacity + 0.2})`;
            ctx.fill();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
};

export default NetworkAnimation;
