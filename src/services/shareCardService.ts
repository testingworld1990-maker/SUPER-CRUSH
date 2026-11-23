/**
 * Generates a high-resolution, comic-movie Victory Poster PNG card on an offscreen Canvas
 * so players can share or download their Super Crush: Doomsday victories & 60s Blitz high scores.
 */

export interface VictoryCardOptions {
  playerName: string;
  missionTitle: string;
  score: number;
  stars: number; // 0..3
  bestCombo: number;
  winStreak: number;
  heroCodename: string;
  heroAccentHex: string;
  isBlitz?: boolean;
}

export async function shareOrDownloadVictoryCard(
  opts: VictoryCardOptions
): Promise<'shared' | 'downloaded'> {
  const width = 900;
  const height = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'downloaded';

  // 1. Deep Cosmic Gradient Background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#050C1B');
  bg.addColorStop(0.5, '#0C1D35');
  bg.addColorStop(1, '#07171B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Dual Vibrant Cosmic Glows
  const glowA = ctx.createRadialGradient(180, 220, 20, 180, 220, 420);
  glowA.addColorStop(0, `${opts.heroAccentHex}55`);
  glowA.addColorStop(1, 'transparent');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, width, height);

  const glowB = ctx.createRadialGradient(740, 880, 20, 740, 880, 420);
  glowB.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
  glowB.addColorStop(1, 'transparent');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, width, height);

  // 3. Comic-Poster Outer Frame
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, width - 56, height - 56);
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // 4. Header Emblem & Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#34D399';
  ctx.font = '800 26px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('AVENGERS SAGA · VICTORY DOSSIER', width / 2, 118);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 72px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('SUPER CRUSH', width / 2, 198);

  ctx.fillStyle = '#34D399';
  ctx.font = '900 34px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('D O O M S D A Y', width / 2, 246);

  // 5. Mission / Blitz Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(88, 290, width - 176, 110);
  ctx.strokeStyle = opts.heroAccentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(88, 290, width - 176, 110);

  ctx.fillStyle = '#FDE047';
  ctx.font = '800 22px "Avenir Next", system-ui, sans-serif';
  ctx.fillText(
    opts.isBlitz ? '60-SECOND INFINITY BLITZ RECORD' : 'MISSION ACCOMPLISHED',
    width / 2,
    332
  );
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 34px "Avenir Next", system-ui, sans-serif';
  ctx.fillText(opts.missionTitle.slice(0, 32), width / 2, 378);

  // 6. Three Golden Stars
  const starY = 478;
  const starXs = [width / 2 - 110, width / 2, width / 2 + 110];
  starXs.forEach((sx, i) => {
    const earned = opts.stars > i;
    drawStar(ctx, sx, starY, 5, 44, 20, earned ? '#FBBF24' : '#334155', earned ? '#FEF08A' : '#475569');
  });

  // 7. Giant Final Score Display
  ctx.fillStyle = '#94A3B8';
  ctx.font = '800 24px "Avenir Next", system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', width / 2, 578);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 96px "Avenir Next", system-ui, sans-serif';
  ctx.fillText(opts.score.toLocaleString(), width / 2, 672);

  // 8. 3-Stat Tactical Grid
  const stats = [
    { label: 'ACTIVE AVENGER', value: opts.heroCodename, color: opts.heroAccentHex },
    { label: 'BEST COMBO', value: `${Math.max(1, opts.bestCombo)}× CHAIN`, color: '#22D3EE' },
    {
      label: opts.isBlitz ? 'MODE' : 'WIN STREAK',
      value: opts.isBlitz ? '60s BLITZ' : `${opts.winStreak}× STREAK`,
      color: '#FBBF24',
    },
  ];
  const cardW = 224;
  const startX = (width - (cardW * 3 + 32)) / 2;
  stats.forEach((st, idx) => {
    const x = startX + idx * (cardW + 16);
    const y = 730;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(x, y, cardW, 132);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, 132);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 17px "Avenir Next", system-ui, sans-serif';
    ctx.fillText(st.label, x + cardW / 2, y + 46);

    ctx.fillStyle = st.color;
    ctx.font = '900 26px "Avenir Next", system-ui, sans-serif';
    ctx.fillText(st.value.slice(0, 15), x + cardW / 2, y + 96);
  });

  // 9. Challenger Footer
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '700 26px "Avenir Next", system-ui, sans-serif';
  ctx.fillText(`Agent: ${opts.playerName || 'Avenger Agent'}`, width / 2, 945);

  ctx.fillStyle = '#34D399';
  ctx.font = '800 24px "Avenir Next", system-ui, sans-serif';
  ctx.fillText('Can you beat my score in Super Crush: Doomsday?', width / 2, 1002);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) return 'downloaded';

  const fileName = `super-crush-doomsday-${opts.score}.png`;
  const shareText = `I scored ${opts.score.toLocaleString()} (${opts.stars}★ · ${opts.bestCombo}× Combo) with ${opts.heroCodename} in Super Crush: Doomsday! Can you beat it?`;

  // Copy challenge text silently when clipboard is available
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
    }
  } catch {
    // Ignore clipboard restrictions
  }

  // Prefer native Web Share API with image file on mobile/supported browsers
  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Super Crush: Doomsday Victory',
        text: shareText,
        files: [file],
      });
      return 'shared';
    }
  } catch {
    // Fall through to clean PNG download
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return 'downloaded';
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number,
  fill: string,
  stroke: string
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}
