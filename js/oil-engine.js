/**
 * Atelier Óleo — Motor Gráfico de Pintura a Óleo de Alta Nitidez, Fluxo Van Gogh & Impasto 3D
 */

window.AtelierOleo = window.AtelierOleo || {};

(function () {
  const { clampByte, clampInt, clampFloat, shuffleArray } = window.AtelierOleo.utils;

  class OilEngine {
    constructor(paintCanvas, originalCanvas) {
      this.paintCanvas = paintCanvas;
      this.originalCanvas = originalCanvas;
      this.paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
      this.origCtx = originalCanvas.getContext('2d', { willReadFrequently: true });

      this.rawPaintCanvas = document.createElement('canvas');
      this.rawPaintCtx = this.rawPaintCanvas.getContext('2d', { willReadFrequently: true });

      this.width = 0;
      this.height = 0;
      this.gradedPixels = null;
      this.oilRefPixels = null;
      this.heightMap = null;
      this.weaveMap = null;
      this.flowX = null;
      this.flowY = null;
      this.gradMag = null;
      this.strokeQueue = [];
    }

    /**
     * Define dimensões de trabalho e desenha a foto original no canvas de referência
     */
    setupDimensions(img, maxDim = 960) {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      w = Math.max(240, w - (w % 2));
      h = Math.max(240, h - (h % 2));

      this.width = w;
      this.height = h;

      this.paintCanvas.width = w;
      this.paintCanvas.height = h;
      this.originalCanvas.width = w;
      this.originalCanvas.height = h;
      this.rawPaintCanvas.width = w;
      this.rawPaintCanvas.height = h;

      this.origCtx.drawImage(img, 0, 0, w, h);
    }

    /**
     * Prepara todos os mapas matemáticos e a fila de pinceladas para construir o quadro
     */
    prepareArtwork(params, preset) {
      const w = this.width;
      const h = this.height;

      const origData = this.origCtx.getImageData(0, 0, w, h).data;
      const isDisney = Boolean(preset && preset.isDisney);

      // 1. Ajuste de pigmento (Vibrância, contraste suave a óleo ou paleta encantada Disney)
      this.gradedPixels = this.applyOilPigmentGrading(
        origData,
        params.colorVibrance,
        params.warmthShift,
        isDisney
      );

      // 2. Campo de Fluxo Tangente + Turbilhão Espiral de Van Gogh
      this.computeFlowField(this.gradedPixels, w, h, params.swirlIntensity);

      // 3. Filtro de referência: Efeito Disney Experimental (Bilateral + Cel-Shading + Contorno) ou Óleo Nítido
      if (isDisney) {
        this.oilRefPixels = this.computeDisneyIllustrationFilter(
          this.gradedPixels,
          w,
          h,
          params.detailLevel / 100
        );
      } else {
        const baseRadius = Math.max(1, Math.min(4, Math.round(params.brushSize * 0.42)));
        this.oilRefPixels = this.computeSharpOilPaintFilter(
          this.gradedPixels,
          w,
          h,
          baseRadius,
          28,
          params.detailLevel / 100
        );
      }

      // 4. Prepara a tela de linho com Imprimatura
      this.preparePrimedCanvas(w, h, params);

      // 5. Constrói fila de pinceladas em 4 camadas progressivas (precisas e fiéis à foto)
      this.strokeQueue = this.buildMultiPassStrokeQueue(w, h, params, preset);
    }

    /**
     * Enriquecimento cromático de pigmentos a óleo ou paleta encantada Disney
     */
    applyOilPigmentGrading(src, vibrancePct, warmthPct, isDisney = false) {
      const out = new Uint8ClampedArray(src.length);
      const vibrance = vibrancePct / 100;
      const warmth = warmthPct / 100;

      for (let i = 0; i < src.length; i += 4) {
        let r = src[i];
        let g = src[i + 1];
        let b = src[i + 2];

        r = r + warmth * 22;
        g = g + warmth * 8;
        b = b - warmth * 18;

        const avg = (r + g + b) / 3;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = (maxC - minC) / 255;
        const boost = 1 + vibrance * (1 - sat * 0.45);

        r = avg + (r - avg) * boost;
        g = avg + (g - avg) * boost;
        b = avg + (b - avg) * boost;

        if (isDisney) {
          // Color script encantado Disney: luzes pêssego/douradas suaves e sombras azul-violeta ricas
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const lift = Math.pow(lum, 0.88) * 255 - lum * 255;
          r = r + lift * 0.65 + lum * 12;
          g = g + lift * 0.52 + lum * 4;
          b = b + lift * 0.45 + (1 - lum) * 14;
        }

        const contrast = isDisney ? 1.09 : 1.05;
        r = clampByte(((r / 255 - 0.5) * contrast + 0.5) * 255);
        g = clampByte(((g / 255 - 0.5) * contrast + 0.5) * 255);
        b = clampByte(((b / 255 - 0.5) * contrast + 0.5) * 255);

        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
      return out;
    }

    /**
     * Modelo Experimental Disney: Suavização Bilateral de Porcelana + Volume Cel-Shading + Traços de Contorno
     */
    computeDisneyIllustrationFilter(src, w, h, detailRatio) {
      const smoothed = new Uint8ClampedArray(src.length);
      const out = new Uint8ClampedArray(src.length);
      const radius = 4;

      // 1. Filtro Bilateral preservador de bordas (pele e superfícies aveludadas mantendo olhos e lábios nítidos)
      for (let y = 0; y < h; y++) {
        const yMin = Math.max(0, y - radius);
        const yMax = Math.min(h - 1, y + radius);

        for (let x = 0; x < w; x++) {
          const xMin = Math.max(0, x - radius);
          const xMax = Math.min(w - 1, x + radius);
          const cIdx = (y * w + x) << 2;
          const cr = src[cIdx];
          const cg = src[cIdx + 1];
          const cb = src[cIdx + 2];

          let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

          for (let ny = yMin; ny <= yMax; ny++) {
            const rOff = ny * w;
            const dy = ny - y;
            for (let nx = xMin; nx <= xMax; nx++) {
              const dx = nx - x;
              const nIdx = (rOff + nx) << 2;
              const nr = src[nIdx];
              const ng = src[nIdx + 1];
              const nb = src[nIdx + 2];

              const colorDiff = Math.abs(nr - cr) + Math.abs(ng - cg) + Math.abs(nb - cb);
              if (colorDiff < 62) {
                const wSpatial = 1 / (1 + (dx * dx + dy * dy) * 0.25);
                const wColor = 1 - colorDiff / 62;
                const wgt = wSpatial * wColor * wColor;
                sumR += nr * wgt;
                sumG += ng * wgt;
                sumB += nb * wgt;
                sumW += wgt;
              }
            }
          }

          if (sumW > 0) {
            smoothed[cIdx] = (sumR / sumW) | 0;
            smoothed[cIdx + 1] = (sumG / sumW) | 0;
            smoothed[cIdx + 2] = (sumB / sumW) | 0;
          } else {
            smoothed[cIdx] = cr;
            smoothed[cIdx + 1] = cg;
            smoothed[cIdx + 2] = cb;
          }
          smoothed[cIdx + 3] = 255;
        }
      }

      // 2. Sombreamento Ilustrado (Soft Cel-Shading) + Contorno Artístico Quente + Brilho Mágico
      for (let p = 0, i = 0; p < w * h; p++, i += 4) {
        let r = smoothed[i];
        let g = smoothed[i + 1];
        let b = smoothed[i + 2];

        // Leve estilização tonal de ilustração nos meios-tons
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const celLum = (Math.round(lum * 14) / 14) * 0.22 + lum * 0.78;
        const lumScale = celLum / Math.max(0.02, lum);

        r = clampByte(r * lumScale);
        g = clampByte(g * lumScale);
        b = clampByte(b * lumScale);

        // Brilho encantado nas altas luzes (Golden Bloom)
        if (lum > 0.72) {
          const glow = (lum - 0.72) * 55;
          r = clampByte(r + glow * 1.1);
          g = clampByte(g + glow * 0.95);
          b = clampByte(b + glow * 0.7);
        }

        // Traço de contorno ilustrado estilo animação (marrom-ameixa quente nas bordas principais)
        const edge = this.gradMag[p];
        if (edge > 0.14) {
          const inkStrength = Math.min(0.62, (edge - 0.14) * 1.35 * detailRatio);
          const inkR = r * 0.36 + 18;
          const inkG = g * 0.26 + 10;
          const inkB = b * 0.34 + 16;
          r = Math.round(r * (1 - inkStrength) + inkR * inkStrength);
          g = Math.round(g * (1 - inkStrength) + inkG * inkStrength);
          b = Math.round(b * (1 - inkStrength) + inkB * inkStrength);
        }

        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }

      return out;
    }

    /**
     * Filtro de Pintura a Óleo que preserva 100% das bordas e feições da foto
     */
    computeSharpOilPaintFilter(src, w, h, radius, levels, detailRatio) {
      const out = new Uint8ClampedArray(src.length);
      const intensityLut = new Uint8Array(w * h);

      for (let i = 0, p = 0; i < src.length; i += 4, p++) {
        const lum = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
        intensityLut[p] = (lum * levels) >> 8;
      }

      const countBin = new Int32Array(levels + 1);
      const rBin = new Int32Array(levels + 1);
      const gBin = new Int32Array(levels + 1);
      const bBin = new Int32Array(levels + 1);

      for (let y = 0; y < h; y++) {
        const yMin = Math.max(0, y - radius);
        const yMax = Math.min(h - 1, y + radius);

        for (let x = 0; x < w; x++) {
          const xMin = Math.max(0, x - radius);
          const xMax = Math.min(w - 1, x + radius);

          countBin.fill(0);
          rBin.fill(0);
          gBin.fill(0);
          bBin.fill(0);

          let maxCount = 0;
          let maxIndex = 0;

          for (let ny = yMin; ny <= yMax; ny++) {
            const rowOffset = ny * w;
            for (let nx = xMin; nx <= xMax; nx++) {
              const idx = rowOffset + nx;
              const bin = intensityLut[idx];
              const c = ++countBin[bin];
              const p4 = idx << 2;
              rBin[bin] += src[p4];
              gBin[bin] += src[p4 + 1];
              bBin[bin] += src[p4 + 2];

              if (c > maxCount) {
                maxCount = c;
                maxIndex = bin;
              }
            }
          }

          const pIdx = y * w + x;
          const outIdx = pIdx << 2;
          const oilR = (rBin[maxIndex] / maxCount) | 0;
          const oilG = (gBin[maxIndex] / maxCount) | 0;
          const oilB = (bBin[maxIndex] / maxCount) | 0;

          // Preserva detalhes finos proporcionalmente à força da borda e ao slider de Fidelidade
          const edgeSharpness = Math.min(1, this.gradMag[pIdx] * 3.0 * detailRatio + (detailRatio - 0.5) * 0.45);
          const sharpMix = Math.max(0, Math.min(0.85, edgeSharpness));

          out[outIdx] = Math.round(oilR * (1 - sharpMix) + src[outIdx] * sharpMix);
          out[outIdx + 1] = Math.round(oilG * (1 - sharpMix) + src[outIdx + 1] * sharpMix);
          out[outIdx + 2] = Math.round(oilB * (1 - sharpMix) + src[outIdx + 2] * sharpMix);
          out[outIdx + 3] = 255;
        }
      }

      return out;
    }

    /**
     * Calcula o Campo de Fluxo Tangente de Sobel + Vórtices/Ondulações estilo Van Gogh
     */
    computeFlowField(src, w, h, swirlIntensityPct) {
      const size = w * h;
      const lum = new Float32Array(size);
      for (let i = 0, p = 0; i < src.length; i += 4, p++) {
        lum[p] = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;
      }

      const gxArr = new Float32Array(size);
      const gyArr = new Float32Array(size);
      const magArr = new Float32Array(size);
      let maxMag = 0.0001;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const tl = lum[idx - w - 1], tc = lum[idx - w], tr = lum[idx - w + 1];
          const ml = lum[idx - 1],                         mr = lum[idx + 1];
          const bl = lum[idx + w - 1], bc = lum[idx + w], br = lum[idx + w + 1];

          const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
          const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
          const mag = Math.hypot(gx, gy);

          gxArr[idx] = gx;
          gyArr[idx] = gy;
          magArr[idx] = mag;
          if (mag > maxMag) maxMag = mag;
        }
      }

      this.flowX = new Float32Array(size);
      this.flowY = new Float32Array(size);
      this.gradMag = new Float32Array(size);

      const swirlStrength = (swirlIntensityPct || 0) / 100;
      const freq1 = (Math.PI * 3.4) / Math.max(w, h);
      const freq2 = (Math.PI * 5.8) / Math.max(w, h);

      for (let y = 0; y < h; y++) {
        const y0 = Math.max(0, y - 2);
        const y1 = Math.min(h - 1, y + 2);

        for (let x = 0; x < w; x++) {
          const x0 = Math.max(0, x - 2);
          const x1 = Math.min(w - 1, x + 2);
          let sumGx = 0;
          let sumGy = 0;

          for (let ny = y0; ny <= y1; ny++) {
            const rOff = ny * w;
            for (let nx = x0; nx <= x1; nx++) {
              const nIdx = rOff + nx;
              const wgt = magArr[nIdx] + 0.02;
              sumGx += gxArr[nIdx] * wgt;
              sumGy += gyArr[nIdx] * wgt;
            }
          }

          let tx = -sumGy;
          let ty = sumGx;
          const len = Math.hypot(tx, ty);
          const idx = y * w + x;
          const normMag = magArr[idx] / maxMag;
          this.gradMag[idx] = normMag;

          if (len > 1e-4) {
            tx /= len;
            ty /= len;
          } else {
            tx = 0.866;
            ty = -0.5;
          }

          if (swirlStrength > 0.01) {
            const phaseX = x * freq1 + Math.cos(y * freq2) * 1.35;
            const phaseY = y * freq1 - Math.sin(x * freq2) * 1.35;

            let vx = Math.cos(phaseY) + 0.55 * Math.sin(phaseX * 1.4);
            let vy = -Math.sin(phaseX) + 0.55 * Math.cos(phaseY * 1.4);
            const vLen = Math.hypot(vx, vy) || 1;
            vx /= vLen;
            vy /= vLen;

            if (tx * vx + ty * vy < 0) {
              vx = -vx;
              vy = -vy;
            }

            // Protege fortemente todas as bordas e feições para não distorcer a foto
            const edgeProtection = Math.min(1, normMag * 3.2);
            const mix = swirlStrength * (1 - edgeProtection * 0.85);

            const bx = tx * (1 - mix) + vx * mix;
            const by = ty * (1 - mix) + vy * mix;
            const bLen = Math.hypot(bx, by) || 1;
            this.flowX[idx] = bx / bLen;
            this.flowY[idx] = by / bLen;
          } else {
            this.flowX[idx] = tx;
            this.flowY[idx] = ty;
          }
        }
      }
    }

    /**
     * Prepara a tela com textura de linho e base suave da imagem
     */
    preparePrimedCanvas(w, h, params) {
      this.heightMap = new Float32Array(w * h);
      this.weaveMap = new Float32Array(w * h);

      for (let y = 0; y < h; y++) {
        const sinY = Math.sin(y * 1.45);
        const cosY = Math.cos(y * 0.72);
        const rowOff = y * w;
        for (let x = 0; x < w; x++) {
          this.weaveMap[rowOff + x] = Math.sin(x * 1.45) * cosY + Math.cos(x * 0.72) * sinY;
        }
      }

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < this.gradedPixels.length; i += 64) {
        rSum += this.gradedPixels[i];
        gSum += this.gradedPixels[i + 1];
        bSum += this.gradedPixels[i + 2];
        count++;
      }

      const baseR = Math.round((rSum / count) * 0.55 + 72);
      const baseG = Math.round((gSum / count) * 0.52 + 58);
      const baseB = Math.round((bSum / count) * 0.48 + 44);

      this.rawPaintCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      this.rawPaintCtx.fillRect(0, 0, w, h);

      this.applyImpastoAndCanvasLighting(params, null, false);
    }

    /**
     * Cria a fila de pinceladas com raios mais precisos e cobertura completa para máxima nitidez
     */
    buildMultiPassStrokeQueue(w, h, params, preset) {
      const userBrush = params.brushSize; // 2..12 (padrão 4)
      const detailPct = params.detailLevel / 100; // 0.25..1.0 (padrão 0.90)
      const isVanGogh = Boolean(preset.complementaryVibration && params.swirlIntensity >= 35);

      const passes = [
        {
          name: 'Camada 1/4: Imprimatura & Base de Cor',
          radius: Math.max(3, Math.round(userBrush * 1.65)),
          length: Math.round(userBrush * 3.8),
          spacing: Math.max(5, Math.round(userBrush * 1.5)),
          edgeThreshold: 0.0,
          opacity: 0.95,
          relief: 0.5
        },
        {
          name: 'Camada 2/4: Modelagem de Formas',
          radius: Math.max(2.2, userBrush * 1.05),
          length: Math.round(userBrush * (isVanGogh ? 3.4 : 2.8)),
          spacing: Math.max(4, Math.round(userBrush * 0.95)),
          edgeThreshold: 0.0,
          opacity: 0.94,
          relief: 0.78
        },
        {
          name: 'Camada 3/4: Pinceladas Finas & Textura',
          radius: Math.max(1.5, userBrush * 0.62),
          length: Math.round(userBrush * (isVanGogh ? 2.6 : 2.0)),
          spacing: Math.max(3, Math.round(userBrush * 0.62)),
          edgeThreshold: 0.0, // cobre toda a foto para não deixar nenhuma área borrada!
          opacity: 0.94,
          relief: 0.95
        },
        {
          name: 'Camada 4/4: Nitidez & Detalhes da Foto',
          radius: Math.max(1.0, userBrush * (0.36 - detailPct * 0.1)),
          length: Math.max(3, Math.round(userBrush * 1.35)),
          spacing: Math.max(2, Math.round(userBrush * (0.45 - detailPct * 0.14))),
          edgeThreshold: Math.max(0.01, 0.12 - detailPct * 0.11),
          opacity: 0.96,
          relief: 1.05
        }
      ];

      const queue = [];

      for (let pIndex = 0; pIndex < passes.length; pIndex++) {
        const pass = passes[pIndex];
        const passStrokes = [];
        const step = pass.spacing;

        for (let y = Math.floor(step / 2); y < h; y += step) {
          for (let x = Math.floor(step / 2); x < w; x += step) {
            const jx = clampInt(x + (Math.random() - 0.5) * step * 0.75, 0, w - 1);
            const jy = clampInt(y + (Math.random() - 0.5) * step * 0.75, 0, h - 1);
            const idx = jy * w + jx;

            if (this.gradMag[idx] >= pass.edgeThreshold) {
              passStrokes.push({
                x: jx,
                y: jy,
                radius: pass.radius,
                length: pass.length,
                opacity: pass.opacity,
                relief: pass.relief,
                passIndex: pIndex,
                passName: pass.name
              });
            }
          }
        }

        shuffleArray(passStrokes);
        for (let i = 0; i < passStrokes.length; i++) {
          queue.push(passStrokes[i]);
        }
      }

      return queue;
    }

    /**
     * Renderiza uma pincelada respeitando rigorosamente os limites de cor da foto para não borrar
     */
    renderBrushStroke(stroke, params, preset) {
      const w = this.width;
      const h = this.height;
      const ctx = this.rawPaintCtx;
      const curvature = params.strokeCurvature / 100;

      const x0 = stroke.x;
      const y0 = stroke.y;
      const pixelIndex = y0 * w + x0;
      const pIdx = pixelIndex << 2;

      // No modo Disney usa sempre o buffer ilustrado suave; nos modos a óleo usa pixels graduados nas camadas finas
      const isDisney = Boolean(preset && preset.isDisney);
      const useOilRef = isDisney || stroke.passIndex < 2;
      const srcPixels = useOilRef ? this.oilRefPixels : this.gradedPixels;

      const jitterScale = stroke.passIndex >= 2 ? 0.35 : 0.8;
      const jitter = preset.jitter * jitterScale;
      let rBase = srcPixels[pIdx];
      let gBase = srcPixels[pIdx + 1];
      let bBase = srcPixels[pIdx + 2];

      if (preset.complementaryVibration) {
        const shift = (Math.random() - 0.5) * jitter;
        rBase = clampByte(rBase + shift);
        gBase = clampByte(gBase + shift * 0.45);
        bBase = clampByte(bBase - shift * 0.75);
      } else {
        const shift = (Math.random() - 0.5) * jitter;
        rBase = clampByte(rBase + shift);
        gBase = clampByte(gBase + shift);
        bBase = clampByte(bBase + shift);
      }

      const radius = stroke.radius;
      const numSteps = Math.max(2, Math.min(9, Math.round(stroke.length / Math.max(1.2, radius * 0.6))));
      const stepLen = stroke.length / numSteps;

      const pointsX = new Float32Array(numSteps + 1);
      const pointsY = new Float32Array(numSteps + 1);
      pointsX[0] = x0;
      pointsY[0] = y0;

      let cx = x0;
      let cy = y0;
      let prevDx = this.flowX[pixelIndex];
      let prevDy = this.flowY[pixelIndex];
      let actualSteps = 0;

      // Limite rigoroso de diferença de cor: impede que o pincel invada outra feição e borre a foto!
      const maxColorDiff = stroke.passIndex >= 2 ? 28 : 48;

      for (let s = 1; s <= numSteps; s++) {
        const ix = clampInt(Math.round(cx), 0, w - 1);
        const iy = clampInt(Math.round(cy), 0, h - 1);
        const fIdx = iy * w + ix;

        let fx = this.flowX[fIdx];
        let fy = this.flowY[fIdx];

        if (fx * prevDx + fy * prevDy < 0) {
          fx = -fx;
          fy = -fy;
        }

        const dx = prevDx * (1 - curvature) + fx * curvature;
        const dy = prevDy * (1 - curvature) + fy * curvature;
        const norm = Math.hypot(dx, dy) || 1;
        prevDx = dx / norm;
        prevDy = dy / norm;

        const checkX = clampInt(Math.round(cx + prevDx * stepLen), 0, w - 1);
        const checkY = clampInt(Math.round(cy + prevDy * stepLen), 0, h - 1);
        const cIdx = (checkY * w + checkX) << 2;
        const colorDiff =
          Math.abs(srcPixels[cIdx] - rBase) +
          Math.abs(srcPixels[cIdx + 1] - gBase) +
          Math.abs(srcPixels[cIdx + 2] - bBase);

        if (colorDiff > maxColorDiff) {
          pointsX[s] = cx;
          pointsY[s] = cy;
          actualSteps = s;
          break;
        }

        cx = clampFloat(cx + prevDx * stepLen, 0, w - 1);
        cy = clampFloat(cy + prevDy * stepLen, 0, h - 1);
        pointsX[s] = cx;
        pointsY[s] = cy;
        actualSteps = s;
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Corpo principal da pincelada (fino e preciso)
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = `rgb(${rBase}, ${gBase}, ${bBase})`;
      ctx.lineWidth = radius * 1.45;
      ctx.beginPath();
      ctx.moveTo(pointsX[0], pointsY[0]);
      for (let s = 1; s <= actualSteps; s++) {
        ctx.lineTo(pointsX[s], pointsY[s]);
      }
      ctx.stroke();

      // 2. Filamentos internos de cerda para textura de pincel (desativados no modo Disney para manter pele lisa)
      if (!isDisney && radius >= 1.8) {
        const nx = -prevDy * (radius * 0.34);
        const ny = prevDx * (radius * 0.34);
        const hiDelta = preset.complementaryVibration ? 18 : 12;

        ctx.globalAlpha = stroke.opacity * 0.55;
        ctx.strokeStyle = `rgb(${clampByte(rBase + hiDelta)}, ${clampByte(gBase + hiDelta * 0.9)}, ${clampByte(bBase + hiDelta * 0.7)})`;
        ctx.lineWidth = Math.max(0.8, radius * 0.45);
        ctx.beginPath();
        ctx.moveTo(pointsX[0] + nx, pointsY[0] + ny);
        for (let s = 1; s <= actualSteps; s++) {
          ctx.lineTo(pointsX[s] + nx, pointsY[s] + ny);
        }
        ctx.stroke();

        ctx.strokeStyle = `rgb(${clampByte(rBase - 12)}, ${clampByte(gBase - 12)}, ${clampByte(bBase - 10)})`;
        ctx.beginPath();
        ctx.moveTo(pointsX[0] - nx, pointsY[0] - ny);
        for (let s = 1; s <= actualSteps; s++) {
          ctx.lineTo(pointsX[s] - nx, pointsY[s] - ny);
        }
        ctx.stroke();
      }

      ctx.restore();

      this.stampStrokeHeightMap(pointsX, pointsY, actualSteps, radius, prevDx, prevDy, stroke.relief);
    }

    /**
     * Registra os sulcos das cerdas e o turbilhão de Van Gogh no mapa de relevo 3D (sem borrar a cor!)
     */
    stampStrokeHeightMap(pointsX, pointsY, actualSteps, radius, dirX, dirY, reliefScale) {
      const w = this.width;
      const h = this.height;
      const hMap = this.heightMap;
      const rInt = Math.max(1, Math.ceil(radius));
      const rSq = radius * radius;
      const invRSq = 1 / rSq;
      const perpX = -dirY;
      const perpY = dirX;
      const freq = Math.max(1.8, 4.6 / Math.max(1.2, radius));
      const stepStride = radius < 2.0 ? 2 : 1;

      for (let s = 0; s <= actualSteps; s += stepStride) {
        const px = pointsX[s];
        const py = pointsY[s];

        const minY = Math.max(0, Math.floor(py - rInt));
        const maxY = Math.min(h - 1, Math.ceil(py + rInt));
        const minX = Math.max(0, Math.floor(px - rInt));
        const maxX = Math.min(w - 1, Math.ceil(px + rInt));

        for (let y = minY; y <= maxY; y++) {
          const dy = y - py;
          const dySq = dy * dy;
          const rowOff = y * w;
          for (let x = minX; x <= maxX; x++) {
            const dx = x - px;
            const distSq = dx * dx + dySq;
            if (distSq <= rSq) {
              const crossDist = dx * perpX + dy * perpY;
              const bristleGroove = Math.sin(crossDist * freq) * 0.38;
              const edgeRidge = distSq * invRSq * 0.45;
              hMap[rowOff + x] = hMap[rowOff + x] * 0.6 + (bristleGroove + edgeRidge) * reliefScale;
            }
          }
        }
      }
    }

    /**
     * Aplica iluminação 3D Impasto e garante alta nitidez fiel à foto enviada
     */
    applyImpastoAndCanvasLighting(params, preset, blendFinalOilGlaze = false) {
      const w = this.width;
      const h = this.height;
      const rawImgData = this.rawPaintCtx.getImageData(0, 0, w, h);
      const rawPixels = rawImgData.data;

      // Acabamento final de alta definição: une a nitidez da foto ao agrupamento a óleo ou ilustração Disney
      if (blendFinalOilGlaze && this.oilRefPixels && preset) {
        const detailPct = params.detailLevel / 100;
        const ratio = Math.min(0.95, preset.oilBlendRatio * (0.75 + detailPct * 0.35));
        const isDisney = Boolean(preset.isDisney);

        for (let i = 0; i < rawPixels.length; i += 4) {
          const pIdx = i >> 2;
          let targetR, targetG, targetB;

          if (isDisney) {
            targetR = this.oilRefPixels[i];
            targetG = this.oilRefPixels[i + 1];
            targetB = this.oilRefPixels[i + 2];
          } else {
            const edgeFactor = Math.min(1, this.gradMag[pIdx] * 2.8 + detailPct * 0.35);
            targetR = this.oilRefPixels[i] * (1 - edgeFactor) + this.gradedPixels[i] * edgeFactor;
            targetG = this.oilRefPixels[i + 1] * (1 - edgeFactor) + this.gradedPixels[i + 1] * edgeFactor;
            targetB = this.oilRefPixels[i + 2] * (1 - edgeFactor) + this.gradedPixels[i + 2] * edgeFactor;
          }

          rawPixels[i] = Math.round(rawPixels[i] * (1 - ratio) + targetR * ratio);
          rawPixels[i + 1] = Math.round(rawPixels[i + 1] * (1 - ratio) + targetG * ratio);
          rawPixels[i + 2] = Math.round(rawPixels[i + 2] * (1 - ratio) + targetB * ratio);
        }
        this.rawPaintCtx.putImageData(rawImgData, 0, 0);
      }

      const outImgData = this.paintCtx.createImageData(w, h);
      const out = outImgData.data;

      const impastoStrength = (params.impastoStrength / 100) * 1.45;
      const colorReliefScale = (impastoStrength * 0.55) / 510;
      const canvasWeaveScale = (params.canvasTexture / 100) * 0.22;
      const specStrength = 30 * (impastoStrength * 0.6);
      const hMap = this.heightMap;
      const wMap = this.weaveMap;

      const lx = -0.62;
      const ly = -0.62;
      const lz = 0.48;

      for (let y = 0; y < h; y++) {
        const yPrev = (y > 0 ? y - 1 : 0) * w;
        const yCurr = y * w;
        const yNext = (y < h - 1 ? y + 1 : h - 1) * w;

        for (let x = 0; x < w; x++) {
          const xPrev = x > 0 ? x - 1 : 0;
          const xNext = x < w - 1 ? x + 1 : w - 1;
          const idx = yCurr + x;
          const p4 = idx << 2;

          const dhxPaint = (hMap[yCurr + xNext] - hMap[yCurr + xPrev]) * impastoStrength;
          const dhyPaint = (hMap[yNext + x] - hMap[yPrev + x]) * impastoStrength;

          const rRight = (yCurr + xNext) << 2;
          const rLeft = (yCurr + xPrev) << 2;
          const rDown = (yNext + x) << 2;
          const rUp = (yPrev + x) << 2;

          const dhxColor = (rawPixels[rRight] + rawPixels[rRight + 1] - rawPixels[rLeft] - rawPixels[rLeft + 1]) * colorReliefScale;
          const dhyColor = (rawPixels[rDown] + rawPixels[rDown + 1] - rawPixels[rUp] - rawPixels[rUp + 1]) * colorReliefScale;

          const weave = wMap[idx] * canvasWeaveScale;

          const nx = -(dhxPaint + dhxColor + weave);
          const ny = -(dhyPaint + dhyColor + weave);

          const lenSq = nx * nx + ny * ny + 1.0;
          const invLen = 1.0 / Math.sqrt(lenSq);

          const dot = (nx * lx + ny * ly + lz) * invLen;
          const diffuse = (dot - 0.48) * 62;
          const specBase = dot > 0 ? dot : 0;
          const s2 = specBase * specBase;
          const s4 = s2 * s2;
          const specular = s4 * s4 * specStrength;

          const lightDelta = diffuse + specular;

          out[p4] = clampByte(rawPixels[p4] + lightDelta);
          out[p4 + 1] = clampByte(rawPixels[p4 + 1] + lightDelta);
          out[p4 + 2] = clampByte(rawPixels[p4 + 2] + lightDelta);
          out[p4 + 3] = 255;
        }
      }

      this.paintCtx.putImageData(outImgData, 0, 0);
    }
  }

  window.AtelierOleo.OilEngine = OilEngine;
})();
