import * as THREE from 'three';

/** Procedurally generate grass texture with mowing stripes */
export function createGrassTexture(width = 1024, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const stripeWidth = 32;
  for (let y = 0; y < height; y += stripeWidth) {
    const stripeIdx = Math.floor(y / stripeWidth);
    const base = stripeIdx % 2 === 0 ? 34 : 42;
    const r = base + Math.floor(Math.random() * 8);
    const g = base + 60 + Math.floor(Math.random() * 15);
    const b = base + 10 + Math.floor(Math.random() * 8);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, width, stripeWidth);

    // Fine grass noise
    for (let i = 0; i < 200; i++) {
      const nx = Math.random() * width;
      const ny = y + Math.random() * stripeWidth;
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgba(${r + shade},${g + shade},${b + shade},0.3)`;
      ctx.fillRect(nx, ny, 1, 2 + Math.random() * 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 5);
  texture.anisotropy = 16;
  return texture;
}

/** Create pitch line markings texture */
export function createPitchMarkingsTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1344; // aspect ratio ~105:68
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  const lineW = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = lineW;
  ctx.lineCap = 'round';

  const pad = 40;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  const cx = w / 2;
  const cy = h / 2;

  // Outer boundary
  ctx.strokeRect(pad, pad, pw, ph);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(cx, pad);
  ctx.lineTo(cx, pad + ph);
  ctx.stroke();

  // Center circle
  const centerR = (9.15 / 105) * pw;
  ctx.beginPath();
  ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  const drawPenaltyArea = (left: boolean) => {
    const paLen = (16.5 / 105) * pw;
    const paWid = (40.32 / 68) * ph;
    const gaLen = (5.5 / 105) * pw;
    const gaWid = (18.32 / 68) * ph;
    const penSpot = (11 / 105) * pw;
    const x = left ? pad : pad + pw;

    ctx.strokeRect(
      left ? x : x - paLen,
      cy - paWid / 2,
      left ? paLen : -paLen,
      paWid
    );
    ctx.strokeRect(
      left ? x : x - gaLen,
      cy - gaWid / 2,
      left ? gaLen : -gaLen,
      gaWid
    );

    // Penalty spot
    ctx.beginPath();
    ctx.arc(left ? x + penSpot : x - penSpot, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Penalty arc
    const arcR = (9.15 / 105) * pw;
    ctx.beginPath();
    if (left) {
      ctx.arc(x + penSpot, cy, arcR, -0.9, 0.9);
    } else {
      ctx.arc(x - penSpot, cy, arcR, Math.PI - 0.9, Math.PI + 0.9);
    }
    ctx.stroke();
  };

  drawPenaltyArea(true);
  drawPenaltyArea(false);

  // Corner arcs
  const cornerR = (1 / 105) * pw;
  const corners = [
    [pad, pad], [pad + pw, pad], [pad, pad + ph], [pad + pw, pad + ph]
  ];
  for (const [cx2, cy2] of corners) {
    ctx.beginPath();
    const startAngle = cx2 === pad
      ? (cy2 === pad ? 0 : Math.PI / 2)
      : (cy2 === pad ? -Math.PI / 2 : Math.PI);
    ctx.arc(cx2!, cy2!, cornerR, startAngle, startAngle + Math.PI / 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

export function createCrowdTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const colors = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#ff7043'];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]!;
    ctx.fillRect(
      Math.random() * 60,
      Math.random() * 50,
      3 + Math.random() * 4,
      6 + Math.random() * 8
    );
  }

  return new THREE.CanvasTexture(canvas);
}
