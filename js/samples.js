/**
 * Atelier Óleo — Gerador de Telas de Demonstração (Noite Estrelada, Toscana, Girassóis)
 */

window.AtelierOleo = window.AtelierOleo || {};

window.AtelierOleo.generateSampleScene = function generateSampleScene(type) {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 600;
  const ctx = c.getContext('2d');

  if (type === 'starry') {
    // Inspirado na Noite Estrelada de Van Gogh
    const sky = ctx.createLinearGradient(0, 0, 0, 430);
    sky.addColorStop(0, '#0a1733');
    sky.addColorStop(0.5, '#17376e');
    sky.addColorStop(1, '#2c5d9e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, 430);

    // Correntes ondulantes luminosas no céu noturno
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(92, 148, 226, 0.55)';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(60, 170);
    ctx.bezierCurveTo(220, 90, 360, 260, 530, 165);
    ctx.bezierCurveTo(610, 120, 560, 230, 460, 225);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 208, 97, 0.38)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(80, 180);
    ctx.bezierCurveTo(230, 110, 360, 250, 520, 170);
    ctx.stroke();

    // Estrelas e Lua Crescente com halos radiantes
    const stars = [
      { x: 145, y: 82, r: 28 },
      { x: 280, y: 68, r: 24 },
      { x: 430, y: 95, r: 30 },
      { x: 350, y: 240, r: 25 },
      { x: 675, y: 105, r: 78, isMoon: true }
    ];

    stars.forEach((s) => {
      const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
      g.addColorStop(0, '#fffbe0');
      g.addColorStop(0.45, s.isMoon ? '#f5b82e' : '#f7d454');
      g.addColorStop(1, 'rgba(247, 212, 84, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Montanhas azuis ao fundo
    ctx.fillStyle = '#14284d';
    ctx.beginPath();
    ctx.moveTo(0, 410);
    ctx.bezierCurveTo(180, 330, 370, 395, 560, 340);
    ctx.bezierCurveTo(680, 310, 750, 365, 800, 350);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // Vila tranquila no vale
    ctx.fillStyle = '#1d2d44';
    ctx.fillRect(0, 430, 800, 170);

    // Igreja com torre pontiaguda e casas iluminadas
    const houses = [
      [280, 470, 46, 34],
      [340, 480, 52, 36],
      [450, 465, 48, 35],
      [520, 485, 56, 38],
      [600, 472, 45, 34]
    ];
    houses.forEach(([hx, hy, hw, hh]) => {
      ctx.fillStyle = '#2d4463';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#1a2639';
      ctx.beginPath();
      ctx.moveTo(hx - 5, hy);
      ctx.lineTo(hx + hw / 2, hy - 20);
      ctx.lineTo(hx + hw + 5, hy);
      ctx.fill();
      // Janelas acesas
      ctx.fillStyle = '#f6c851';
      ctx.fillRect(hx + 10, hy + 12, 9, 11);
      ctx.fillRect(hx + 26, hy + 12, 9, 11);
    });

    // Torre da igreja
    ctx.fillStyle = '#283f5e';
    ctx.beginPath();
    ctx.moveTo(402, 485);
    ctx.lineTo(418, 315);
    ctx.lineTo(434, 485);
    ctx.fill();

    // Grande Cipreste flamejante em primeiro plano (esquerda)
    ctx.fillStyle = '#15221b';
    ctx.beginPath();
    ctx.moveTo(95, 600);
    ctx.bezierCurveTo(75, 430, 105, 220, 145, 65);
    ctx.bezierCurveTo(175, 210, 210, 420, 195, 600);
    ctx.fill();

    ctx.fillStyle = '#263c2a';
    ctx.beginPath();
    ctx.moveTo(125, 600);
    ctx.bezierCurveTo(115, 450, 132, 260, 152, 125);
    ctx.bezierCurveTo(172, 270, 182, 450, 170, 600);
    ctx.fill();
  } else if (type === 'landscape') {
    // Pôr do Sol na Toscana
    const sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, '#2c3e66');
    sky.addColorStop(0.45, '#b85d43');
    sky.addColorStop(0.8, '#f2a65a');
    sky.addColorStop(1, '#ffe19c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, 380);

    const sun = ctx.createRadialGradient(540, 210, 10, 540, 210, 110);
    sun.addColorStop(0, '#fff9d6');
    sun.addColorStop(0.4, '#ffbe55');
    sun.addColorStop(1, 'rgba(255, 160, 75, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(540, 210, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6d4c5b';
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.bezierCurveTo(180, 250, 320, 310, 500, 280);
    ctx.bezierCurveTo(640, 255, 730, 290, 800, 270);
    ctx.lineTo(800, 420);
    ctx.lineTo(0, 420);
    ctx.fill();

    ctx.fillStyle = '#5c6b3c';
    ctx.beginPath();
    ctx.moveTo(0, 370);
    ctx.bezierCurveTo(240, 310, 480, 390, 800, 335);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    ctx.fillStyle = '#8f6b32';
    ctx.beginPath();
    ctx.moveTo(0, 445);
    ctx.bezierCurveTo(260, 410, 520, 460, 800, 415);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    ctx.fillStyle = '#d4a26a';
    ctx.beginPath();
    ctx.moveTo(410, 375);
    ctx.bezierCurveTo(360, 440, 490, 510, 340, 600);
    ctx.lineTo(470, 600);
    ctx.bezierCurveTo(560, 505, 410, 440, 435, 375);
    ctx.fill();

    const cypresses = [
      { x: 180, y: 380, h: 125, w: 18 },
      { x: 220, y: 392, h: 105, w: 15 },
      { x: 640, y: 375, h: 140, w: 20 },
      { x: 680, y: 395, h: 115, w: 16 }
    ];
    cypresses.forEach((t) => {
      ctx.fillStyle = '#1f3322';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y - t.h / 2, t.w, t.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#c87d4b';
    ctx.fillRect(375, 325, 65, 42);
    ctx.fillStyle = '#8c3823';
    ctx.beginPath();
    ctx.moveTo(368, 325);
    ctx.lineTo(408, 302);
    ctx.lineTo(448, 325);
    ctx.fill();
  } else {
    // Girassóis de Van Gogh
    const wall = ctx.createRadialGradient(400, 260, 50, 400, 280, 480);
    wall.addColorStop(0, '#f3d36b');
    wall.addColorStop(1, '#c99b38');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#b56e28';
    ctx.fillRect(0, 440, 800, 160);

    const vaseGrad = ctx.createLinearGradient(310, 300, 490, 500);
    vaseGrad.addColorStop(0, '#f7d469');
    vaseGrad.addColorStop(0.5, '#d18a2c');
    vaseGrad.addColorStop(1, '#7a4414');
    ctx.fillStyle = vaseGrad;
    ctx.beginPath();
    ctx.moveTo(340, 300);
    ctx.bezierCurveTo(280, 370, 295, 470, 345, 515);
    ctx.lineTo(455, 515);
    ctx.bezierCurveTo(505, 470, 520, 370, 460, 300);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2d5a27';
    [
      [330, 285, 45, 22, -0.5],
      [470, 290, 48, 22, 0.5],
      [360, 220, 40, 20, -0.3],
      [445, 215, 42, 20, 0.4]
    ].forEach(([x, y, rx, ry, rot]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    });

    const flowers = [
      { x: 400, y: 155, r: 58 },
      { x: 305, y: 215, r: 50 },
      { x: 495, y: 210, r: 52 },
      { x: 355, y: 275, r: 46 },
      { x: 450, y: 278, r: 44 }
    ];

    flowers.forEach((f) => {
      for (let p = 0; p < 18; p++) {
        const a = (p * Math.PI) / 9;
        const px = f.x + Math.cos(a) * (f.r * 0.72);
        const py = f.y + Math.sin(a) * (f.r * 0.72);
        ctx.fillStyle = p % 2 === 0 ? '#f7b801' : '#e07200';
        ctx.beginPath();
        ctx.ellipse(px, py, f.r * 0.44, f.r * 0.19, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4a2511';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8c4215';
      ctx.beginPath();
      ctx.arc(f.x - 5, f.y - 5, f.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return c;
};
