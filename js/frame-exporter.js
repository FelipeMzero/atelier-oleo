/**
 * Atelier Óleo — Renderizador de Moldura de Galeria 3D para Exportação
 */

window.AtelierOleo = window.AtelierOleo || {};

(function () {
  const FRAME_STYLES = {
    museum_gold: {
      name: 'Clássica Ouro & Mogno',
      outerSizeRatio: 0.085,
      outerColors: {
        top: ['#593e25', '#362415', '#785532'],
        bottom: ['#2d1e10', '#1c1209', '#47311c'],
        left: ['#4f3720', '#2e1f11', '#6b4b2b'],
        right: ['#382616', '#21160b', '#523920']
      },
      goldLipColors: ['#f6d88c', '#b5842f', '#e5be67'],
      innerShadow: 'rgba(0, 0, 0, 0.65)'
    },
    royal_ornate: {
      name: 'Ouro Imperial (Van Gogh)',
      outerSizeRatio: 0.09,
      outerColors: {
        top: ['#e6be6a', '#9e7324', '#f7dd97'],
        bottom: ['#8c631b', '#593d0d', '#b88935'],
        left: ['#d4ab56', '#8a621b', '#ebcb7c'],
        right: ['#9e7324', '#694911', '#c79942']
      },
      goldLipColors: ['#fff0b8', '#c49335', '#f5d478'],
      innerShadow: 'rgba(0, 0, 0, 0.6)'
    },
    modern_ebony: {
      name: 'Galeria Moderna (Ébano)',
      outerSizeRatio: 0.07,
      outerColors: {
        top: ['#32302e', '#1a1918', '#292725'],
        bottom: ['#171615', '#0d0c0c', '#1f1e1c'],
        left: ['#2b2927', '#161514', '#242220'],
        right: ['#1c1b1a', '#100f0f', '#211f1d']
      },
      goldLipColors: ['#d4a857', '#8c6927', '#bd9242'],
      innerShadow: 'rgba(0, 0, 0, 0.7)'
    },
    none: {
      name: 'Sem Moldura (Apenas Tela)',
      outerSizeRatio: 0
    }
  };

  class FrameExporter {
    static getStyles() {
      return FRAME_STYLES;
    }

    /**
     * Renderiza o quadro pintado dentro da moldura 3D escolhida em um canvas de exportação
     */
    static renderFramedArtwork(sourceCanvas, options = {}) {
      const styleKey = options.frameStyle || 'museum_gold';
      const style = FRAME_STYLES[styleKey] || FRAME_STYLES.museum_gold;
      const useMat = options.passepartout !== false;
      const titleText = (options.title || '').trim();
      const authorText = (options.author || '').trim();

      const artW = sourceCanvas.width;
      const artH = sourceCanvas.height;
      const baseDim = Math.max(artW, artH);

      const outCanvas = document.createElement('canvas');
      const ctx = outCanvas.getContext('2d');

      // Caso escolha sem moldura, exporta apenas a pintura (com assinatura opcional)
      if (styleKey === 'none') {
        outCanvas.width = artW;
        outCanvas.height = artH;
        ctx.drawImage(sourceCanvas, 0, 0);
        if (authorText) {
          FrameExporter.drawCanvasSignature(ctx, artW, artH, authorText);
        }
        return outCanvas;
      }

      const frameThickness = Math.max(36, Math.round(baseDim * style.outerSizeRatio));
      const lipThickness = Math.max(6, Math.round(frameThickness * 0.14));
      const matThickness = useMat ? Math.max(24, Math.round(baseDim * 0.048)) : 0;
      const plaqueExtraBottom = titleText ? Math.round(frameThickness * 0.25) : 0;

      const borderLeft = frameThickness + lipThickness + matThickness;
      const borderRight = frameThickness + lipThickness + matThickness;
      const borderTop = frameThickness + lipThickness + matThickness;
      const borderBottom = frameThickness + plaqueExtraBottom + lipThickness + matThickness;

      const totalW = artW + borderLeft + borderRight;
      const totalH = artH + borderTop + borderBottom;

      outCanvas.width = totalW;
      outCanvas.height = totalH;

      const innerX = frameThickness;
      const innerY = frameThickness;
      const innerW = totalW - frameThickness * 2;
      const innerH = totalH - frameThickness - (frameThickness + plaqueExtraBottom);
      const bottomFrameH = frameThickness + plaqueExtraBottom;

      // 1. Desenha os 4 lados chanfrados em 45° da moldura externa
      FrameExporter.drawMiteredSide(
        ctx,
        [
          [0, 0],
          [totalW, 0],
          [innerX + innerW, innerY],
          [innerX, innerY]
        ],
        0,
        0,
        0,
        innerY,
        style.outerColors.top
      );

      FrameExporter.drawMiteredSide(
        ctx,
        [
          [innerX, innerY + innerH],
          [innerX + innerW, innerY + innerH],
          [totalW, totalH],
          [0, totalH]
        ],
        0,
        innerY + innerH,
        0,
        totalH,
        style.outerColors.bottom
      );

      FrameExporter.drawMiteredSide(
        ctx,
        [
          [0, 0],
          [innerX, innerY],
          [innerX, innerY + innerH],
          [0, totalH]
        ],
        0,
        0,
        innerX,
        0,
        style.outerColors.left
      );

      FrameExporter.drawMiteredSide(
        ctx,
        [
          [innerX + innerW, innerY],
          [totalW, 0],
          [totalH >= 0 ? totalW : totalW, totalH],
          [innerX + innerW, innerY + innerH]
        ],
        innerX + innerW,
        0,
        totalW,
        0,
        style.outerColors.right
      );

      // Sulcos decorativos de entalhe na moldura
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 235, 190, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.round(frameThickness * 0.35),
        Math.round(frameThickness * 0.35),
        totalW - Math.round(frameThickness * 0.7),
        totalH - Math.round(frameThickness * 0.35) - Math.round(bottomFrameH * 0.35)
      );

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.round(frameThickness * 0.68),
        Math.round(frameThickness * 0.68),
        totalW - Math.round(frameThickness * 1.36),
        totalH - Math.round(frameThickness * 0.68) - Math.round(bottomFrameH * 0.68)
      );

      // Linhas de junção de 45 graus nos 4 cantos
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(innerX, innerY);
      ctx.moveTo(totalW, 0);
      ctx.lineTo(innerX + innerW, innerY);
      ctx.moveTo(0, totalH);
      ctx.lineTo(innerX, innerY + innerH);
      ctx.moveTo(totalW, totalH);
      ctx.lineTo(innerX + innerW, innerY + innerH);
      ctx.stroke();
      ctx.restore();

      // 2. Filete Dourado Interno (Lip)
      const lipGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
      lipGrad.addColorStop(0, style.goldLipColors[0]);
      lipGrad.addColorStop(0.5, style.goldLipColors[1]);
      lipGrad.addColorStop(1, style.goldLipColors[2]);
      ctx.fillStyle = lipGrad;
      ctx.fillRect(innerX, innerY, innerW, innerH);

      // 3. Passe-partout de linho creme (se ativado)
      const matX = innerX + lipThickness;
      const matY = innerY + lipThickness;
      const matW = innerW - lipThickness * 2;
      const matH = innerH - lipThickness * 2;

      if (useMat && matThickness > 0) {
        const matGrad = ctx.createLinearGradient(matX, matY, matX + matW, matY + matH);
        matGrad.addColorStop(0, '#f4efe4');
        matGrad.addColorStop(1, '#e3dac9');
        ctx.fillStyle = matGrad;
        ctx.fillRect(matX, matY, matW, matH);

        // Sombra projetada da moldura sobre o passe-partout
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 3;
        ctx.strokeRect(matX + 1.5, matY + 1.5, matW - 3, matH - 3);

        // Chanfro branco de corte 45° do passe-partout ao redor da pintura
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(borderLeft - 2, borderTop - 2, artW + 4, artH + 4);
        ctx.restore();
      }

      // 4. Desenha a Pintura a Óleo no centro
      ctx.drawImage(sourceCanvas, borderLeft, borderTop);

      // Sombra interna realista sobre a borda da tela
      ctx.save();
      ctx.strokeStyle = style.innerShadow;
      ctx.lineWidth = 4;
      ctx.strokeRect(borderLeft + 2, borderTop + 2, artW - 4, artH - 4);
      ctx.restore();

      // 5. Assinatura do artista no canto inferior direito da tela (se preenchida)
      if (authorText) {
        ctx.save();
        ctx.translate(borderLeft, borderTop);
        FrameExporter.drawCanvasSignature(ctx, artW, artH, authorText);
        ctx.restore();
      }

      // 6. Plaqueta de Museu Dourada na base da moldura (se título preenchido)
      if (titleText) {
        FrameExporter.drawMuseumPlaque(
          ctx,
          totalW / 2,
          totalH - bottomFrameH / 2,
          bottomFrameH,
          titleText,
          authorText
        );
      }

      return outCanvas;
    }

    static drawMiteredSide(ctx, points, gx0, gy0, gx1, gy1, colors) {
      ctx.save();
      const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(0.52, colors[1]);
      grad.addColorStop(1, colors[2]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    static drawCanvasSignature(ctx, artW, artH, authorText) {
      ctx.save();
      const fontSize = Math.max(14, Math.round(Math.min(artW, artH) * 0.032));
      ctx.font = `italic 600 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const padX = Math.max(16, Math.round(artW * 0.03));
      const padY = Math.max(14, Math.round(artH * 0.025));

      ctx.fillStyle = 'rgba(20, 15, 10, 0.65)';
      ctx.fillText(authorText, artW - padX + 1, artH - padY + 1);

      ctx.fillStyle = 'rgba(245, 226, 185, 0.88)';
      ctx.fillText(authorText, artW - padX, artH - padY);
      ctx.restore();
    }

    static drawMuseumPlaque(ctx, centerX, centerY, frameH, titleText, authorText) {
      ctx.save();
      const fontSize = Math.max(12, Math.round(frameH * 0.24));
      ctx.font = `700 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
      const displayLabel = authorText ? `${titleText} — ${authorText}` : titleText;
      const textMetrics = ctx.measureText(displayLabel);

      const plaqueW = Math.max(150, Math.round(textMetrics.width + 44));
      const plaqueH = Math.max(24, Math.round(frameH * 0.44));
      const px = centerX - plaqueW / 2;
      const py = centerY - plaqueH / 2;

      // Sombra da plaqueta
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(px + 2, py + 3, plaqueW, plaqueH);

      // Latão escovado dourado
      const pGrad = ctx.createLinearGradient(px, py, px + plaqueW, py + plaqueH);
      pGrad.addColorStop(0, '#f5d98e');
      pGrad.addColorStop(0.5, '#c99b42');
      pGrad.addColorStop(1, '#e8c46e');
      ctx.fillStyle = pGrad;
      ctx.fillRect(px, py, plaqueW, plaqueH);

      ctx.strokeStyle = '#6e4e16';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px + 2, py + 2, plaqueW - 4, plaqueH - 4);

      // Parafusos laterais da plaqueta
      ctx.fillStyle = '#593e10';
      ctx.beginPath();
      ctx.arc(px + 9, centerY, 2.2, 0, Math.PI * 2);
      ctx.arc(px + plaqueW - 9, centerY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Texto gravado
      ctx.fillStyle = '#1f1508';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayLabel, centerX, centerY + 1);
      ctx.restore();
    }
  }

  window.AtelierOleo.FrameExporter = FrameExporter;
})();
