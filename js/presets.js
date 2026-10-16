/**
 * Atelier Óleo — Configurações dos Modelos de Pintura (Pintura a Óleo & Estilo Van Gogh)
 */

window.AtelierOleo = window.AtelierOleo || {};

window.AtelierOleo.STYLE_PRESETS = {
  atelier: {
    name: 'Pintura a Óleo Clássica',
    brushSize: 4,
    detailLevel: 90,
    strokeCurvature: 75,
    swirlIntensity: 0,
    impastoStrength: 60,
    canvasTexture: 35,
    colorVibrance: 25,
    warmthShift: 10,
    jitter: 5,
    oilBlendRatio: 0.82,
    contourAccents: false,
    complementaryVibration: false
  },
  vangogh: {
    name: 'Pintura Estilo Van Gogh',
    brushSize: 4,
    detailLevel: 88,
    strokeCurvature: 90,
    swirlIntensity: 75,
    impastoStrength: 80,
    canvasTexture: 35,
    colorVibrance: 40,
    warmthShift: 10,
    jitter: 12,
    oilBlendRatio: 0.72,
    contourAccents: true,
    complementaryVibration: true
  }
};

window.AtelierOleo.utils = {
  clampByte(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v | 0;
  },

  clampInt(v, min, max) {
    return v < min ? min : v > max ? max : v | 0;
  },

  clampFloat(v, min, max) {
    return v < min ? min : v > max ? max : v;
  },

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
};
