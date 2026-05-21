import { createCanvas } from 'canvas';
import fs from 'fs';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.18; // corner radius

  // Background — deep black with subtle gradient
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.closePath();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#0a0a0a');
  bg.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = bg;
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = size * 0.012;
  ctx.stroke();

  const cx = size / 2;
  const cy = size / 2;

  // Glow circle behind icon
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.38);
  glow.addColorStop(0, 'rgba(255,255,255,0.08)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Music note — clean, geometric
  const s = size * 0.42; // scale
  const ox = cx - s * 0.18; // offset x
  const oy = cy - s * 0.32; // offset y

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Stem (vertical line)
  const stemW = s * 0.13;
  const stemH = s * 0.72;
  const stemX = ox + s * 0.52;
  ctx.fillRect(stemX, oy, stemW, stemH);

  // Flag (horizontal beam at top)
  const beamW = s * 0.44;
  const beamH = s * 0.13;
  ctx.fillRect(stemX, oy, beamW + stemW, beamH);

  // Second stem
  ctx.fillRect(stemX + beamW, oy + beamH * 0.1, stemW, stemH * 0.72);

  // Note head 1 (left, bigger)
  const head1R = s * 0.18;
  const head1X = stemX - head1R * 0.7;
  const head1Y = oy + stemH - head1R * 0.5;
  ctx.save();
  ctx.translate(head1X, head1Y);
  ctx.rotate(-0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, head1R, head1R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Note head 2 (right, same size)
  const head2R = s * 0.17;
  const head2X = stemX + beamW - head2R * 0.3;
  const head2Y = oy + stemH * 0.72 - head2R * 0.5;
  ctx.save();
  ctx.translate(head2X, head2Y);
  ctx.rotate(-0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, head2R, head2R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return canvas.toBuffer('image/png');
}

// Generate 192 and 512
const sizes = [192, 512];
for (const s of sizes) {
  const buf = drawIcon(s);
  fs.writeFileSync(`public/icon-${s}.png`, buf);
  console.log(`Generated icon-${s}.png`);
}
