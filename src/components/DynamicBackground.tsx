import React, { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const DynamicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createBubbles = () => {
      const bubbleCount = Math.floor((canvas.width * canvas.height) / 15000);
      bubblesRef.current = [];

      const colors = [
        'rgba(59, 130, 246, 0.3)', // blue
        'rgba(147, 51, 234, 0.3)', // purple
        'rgba(236, 72, 153, 0.3)', // pink
        'rgba(14, 165, 233, 0.3)', // sky
      ];

      for (let i = 0; i < bubbleCount; i++) {
        bubblesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 100 + 20,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach(bubble => {
        // Update position
        bubble.x += bubble.speedX;
        bubble.y += bubble.speedY;

        // Bounce off edges
        if (bubble.x < 0 || bubble.x > canvas.width) bubble.speedX *= -1;
        if (bubble.y < 0 || bubble.y > canvas.height) bubble.speedY *= -1;

        // Keep bubbles in bounds
        bubble.x = Math.max(0, Math.min(canvas.width, bubble.x));
        bubble.y = Math.max(0, Math.min(canvas.height, bubble.y));

        // Draw bubble
        ctx.save();
        ctx.globalAlpha = bubble.opacity;
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add inner glow
        const gradient = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.size
        );
        gradient.addColorStop(0, bubble.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createBubbles();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createBubbles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    />
  );
};

export default DynamicBackground;
