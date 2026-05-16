export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function project3D(x, y, z, width, height, fov = 720) {
  const safeZ = Math.max(z, 1);
  const scale = fov / (fov + safeZ);
  const cx = width * 0.5;
  const cy = height * 0.5;

  return {
    x: cx + x * scale,
    y: cy + y * scale,
    scale,
    depth: clamp(1 - safeZ / 2200, 0, 1),
  };
}

export function drawCatmullRomPath(ctx, points) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

export function drawGlowStroke(ctx, points, depthAlpha, intensity = 1) {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[points.length - 1];
  const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
  const peak = clamp(depthAlpha * intensity, 0, 1);

  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.25, `rgba(255, 255, 255, ${peak * 0.35})`);
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${peak})`);
  gradient.addColorStop(0.75, `rgba(255, 255, 255, ${peak * 0.45})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

  const layers = [
    { width: 14, alpha: 0.035 },
    { width: 7, alpha: 0.07 },
    { width: 2, alpha: 0.95 },
  ];

  layers.forEach(({ width, alpha }) => {
    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * peak;
    drawCatmullRomPath(ctx, points);
    ctx.stroke();
    ctx.restore();
  });
}
