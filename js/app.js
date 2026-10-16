/**
 * Atelier Óleo — Controlador Principal da Interface e Ciclo de Animação
 */

(function () {
  const { STYLE_PRESETS, generateSampleScene, OilEngine, FrameExporter } = window.AtelierOleo;
  const SESSION_IMG_KEY = 'atelier_oleo_current_image';

  // Elementos da DOM
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const selectPhotoBtn = document.getElementById('select-photo-btn');
  const sampleBtns = document.querySelectorAll('.sample-btn');
  const canvasStage = document.getElementById('canvas-stage');
  const paintCanvas = document.getElementById('paint-canvas');
  const originalCanvas = document.getElementById('original-canvas');

  // Barra de status e reprodução
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const strokeCounterEl = document.getElementById('stroke-counter');
  const progressFill = document.getElementById('progress-fill');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');
  const skipAnimationBtn = document.getElementById('skip-animation-btn');
  const instantFinishBtn = document.getElementById('instant-finish-btn');
  const replayBtn = document.getElementById('replay-btn');
  const downloadBtn = document.getElementById('download-btn');
  const applyReconstructBtn = document.getElementById('apply-reconstruct-btn');

  // Modal de Exportação com Moldura
  const exportModal = document.getElementById('export-modal');
  const closeExportModalBtn = document.getElementById('close-export-modal-btn');
  const exportPreviewCanvas = document.getElementById('export-preview-canvas');
  const frameOptionBtns = document.querySelectorAll('.frame-option-btn');
  const exportPassepartoutInput = document.getElementById('export-passepartout');
  const exportTitleInput = document.getElementById('export-title-input');
  const exportAuthorInput = document.getElementById('export-author-input');
  const confirmDownloadBtn = document.getElementById('confirm-download-btn');

  // Visualização e Comparador Antes/Depois
  const artworkFrame = document.getElementById('artwork-frame');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const comparisonOverlay = document.getElementById('comparison-overlay');
  const comparisonSlider = document.getElementById('comparison-slider');
  const badgeAfter = document.getElementById('badge-after');
  const compareToggleBtn = document.getElementById('compare-toggle-btn');
  const frameToggleBtn = document.getElementById('frame-toggle-btn');

  // Painel Lateral de Controles
  const stylePresetBtns = document.querySelectorAll('.style-card');
  const brushSizeInput = document.getElementById('brush-size');
  const detailLevelInput = document.getElementById('detail-level');
  const strokeCurvatureInput = document.getElementById('stroke-curvature');
  const swirlIntensityInput = document.getElementById('swirl-intensity');
  const paintSpeedInput = document.getElementById('paint-speed');
  const impastoStrengthInput = document.getElementById('impasto-strength');
  const canvasTextureInput = document.getElementById('canvas-texture');
  const colorVibranceInput = document.getElementById('color-vibrance');
  const warmthShiftInput = document.getElementById('warmth-shift');

  // Rótulos de saída dos sliders
  const brushSizeVal = document.getElementById('brush-size-val');
  const detailLevelVal = document.getElementById('detail-level-val');
  const strokeCurvatureVal = document.getElementById('stroke-curvature-val');
  const swirlIntensityVal = document.getElementById('swirl-intensity-val');
  const paintSpeedVal = document.getElementById('paint-speed-val');
  const impastoStrengthVal = document.getElementById('impasto-strength-val');
  const canvasTextureOut = document.getElementById('canvas-texture-val');
  const colorVibranceVal = document.getElementById('color-vibrance-val');
  const warmthShiftVal = document.getElementById('warmth-shift-val');

  // Instância do motor gráfico
  const engine = new OilEngine(paintCanvas, originalCanvas);

  const state = {
    sourceImage: null,
    activePreset: 'atelier',
    selectedExportFrame: 'museum_gold',
    isPlaying: false,
    isFinished: false,
    isComparing: false,
    splitPercent: 50,
    animationFrameId: null,
    strokeIndex: 0,
    totalStrokesRendered: 0
  };

  function getCurrentParams() {
    return {
      brushSize: Number(brushSizeInput.value),
      detailLevel: Number(detailLevelInput.value),
      strokeCurvature: Number(strokeCurvatureInput.value),
      swirlIntensity: Number(swirlIntensityInput.value),
      paintSpeed: Number(paintSpeedInput.value),
      impastoStrength: Number(impastoStrengthInput.value),
      canvasTexture: Number(canvasTextureInput.value),
      colorVibrance: Number(colorVibranceInput.value),
      warmthShift: Number(warmthShiftInput.value)
    };
  }

  function getActivePresetObject() {
    return STYLE_PRESETS[state.activePreset] || STYLE_PRESETS.vangogh;
  }

  function updateControlLabels() {
    const p = getCurrentParams();
    const sizeNames = {
      2: 'Muito Fino', 3: 'Fino', 4: 'Delicado', 5: 'Médio',
      6: 'Médio-Largo', 7: 'Largo', 8: 'Expressivo', 9: 'Espesso',
      10: 'Espátula', 11: 'Trincha', 12: 'Mural'
    };
    brushSizeVal.textContent = `${sizeNames[p.brushSize] || 'Médio'} (${p.brushSize})`;
    detailLevelVal.textContent = `${p.detailLevel}%`;
    strokeCurvatureVal.textContent = `${p.strokeCurvature}%`;
    swirlIntensityVal.textContent = p.swirlIntensity === 0 ? 'Desativado (0%)' : `${p.swirlIntensity}%`;

    const speedLabels = {
      1: 'Calmo (1x)',
      2: 'Normal (2x)',
      3: 'Rápido (4x)',
      4: 'Turbo (8x)',
      5: 'Ultra (16x)'
    };
    paintSpeedVal.textContent = speedLabels[p.paintSpeed] || 'Normal';

    impastoStrengthVal.textContent = `${p.impastoStrength}%`;
    canvasTextureOut.textContent = `${p.canvasTexture}%`;
    colorVibranceVal.textContent = `${p.colorVibrance >= 0 ? '+' : ''}${p.colorVibrance}%`;
    warmthShiftVal.textContent = `${p.warmthShift >= 0 ? '+' : ''}${p.warmthShift}%`;
  }

  // =========================================================================
  // EVENTOS DE UPLOAD, DRAG & DROP E COLAR
  // =========================================================================

  selectPhotoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('.sample-btn')) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    });
  });

  window.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadFile(file);
    }
  });

  window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) loadFile(file);
        break;
      }
    }
  });

  sampleBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sampleType = btn.dataset.sample;
      const sampleCanvas = generateSampleScene(sampleType);
      const dataUrl = sampleCanvas.toDataURL('image/png');
      loadFromDataUrl(dataUrl);
    });
  });

  // =========================================================================
  // EVENTOS DOS PRESETS DE ESTILO E SLIDERS
  // =========================================================================

  function applyPresetToInputs(presetKey) {
    const preset = STYLE_PRESETS[presetKey];
    if (!preset) return;
    state.activePreset = presetKey;
    brushSizeInput.value = preset.brushSize;
    detailLevelInput.value = preset.detailLevel;
    strokeCurvatureInput.value = preset.strokeCurvature;
    swirlIntensityInput.value = preset.swirlIntensity;
    impastoStrengthInput.value = preset.impastoStrength;
    canvasTextureInput.value = preset.canvasTexture;
    colorVibranceInput.value = preset.colorVibrance;
    warmthShiftInput.value = preset.warmthShift;
    updateControlLabels();
  }

  stylePresetBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      stylePresetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyPresetToInputs(btn.dataset.preset);
      if (state.sourceImage) {
        initPaintingProcess();
      }
    });
  });

  [impastoStrengthInput, canvasTextureInput].forEach((input) => {
    input.addEventListener('input', () => {
      updateControlLabels();
      if (state.sourceImage && (state.isFinished || !state.isPlaying)) {
        engine.applyImpastoAndCanvasLighting(getCurrentParams(), getActivePresetObject(), false);
      }
    });
  });

  [
    brushSizeInput,
    detailLevelInput,
    strokeCurvatureInput,
    swirlIntensityInput,
    colorVibranceInput,
    warmthShiftInput
  ].forEach((input) => {
    input.addEventListener('input', updateControlLabels);
    input.addEventListener('change', () => {
      if (state.sourceImage) {
        initPaintingProcess();
      }
    });
  });

  paintSpeedInput.addEventListener('input', updateControlLabels);

  applyReconstructBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.sourceImage) {
      initPaintingProcess();
    }
  });

  // =========================================================================
  // CONTROLES DE REPRODUÇÃO E COMPARAÇÃO
  // =========================================================================

  playPauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.sourceImage) return;
    if (state.isFinished) {
      initPaintingProcess();
      return;
    }
    state.isPlaying = !state.isPlaying;
    updatePlaybackUI();
    if (state.isPlaying) {
      scheduleNextFrame();
    }
  });

  if (skipAnimationBtn) {
    skipAnimationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!state.sourceImage || state.isFinished) return;
      finishPaintingInstantly();
    });
  }

  instantFinishBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    returnToInitialMenu();
  });

  function returnToInitialMenu() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    state.isPlaying = false;
    state.isFinished = false;
    state.sourceImage = null;
    state.strokeIndex = 0;
    state.totalStrokesRendered = 0;

    try {
      sessionStorage.removeItem(SESSION_IMG_KEY);
    } catch (_) {
      // Ignora erro de sessão
    }

    setComparisonMode(false);
    closeExportModal();
    canvasStage.classList.add('hidden');
    dropzone.classList.remove('hidden');
    downloadBtn.disabled = true;
    applyReconstructBtn.disabled = true;
    fileInput.value = '';
  }

  replayBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.sourceImage) return;
    initPaintingProcess();
  });

  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.sourceImage) return;
    // Se a pintura ainda estiver em andamento, finaliza para exportar com máxima nitidez
    if (!state.isFinished) {
      finishPaintingInstantly();
    }
    openExportModal();
  });

  function getExportOptions() {
    return {
      frameStyle: state.selectedExportFrame,
      passepartout: exportPassepartoutInput.checked,
      title: exportTitleInput.value,
      author: exportAuthorInput.value
    };
  }

  function updateExportPreview() {
    if (!state.sourceImage) return;
    const framedCanvas = FrameExporter.renderFramedArtwork(paintCanvas, getExportOptions());
    exportPreviewCanvas.width = framedCanvas.width;
    exportPreviewCanvas.height = framedCanvas.height;
    const previewCtx = exportPreviewCanvas.getContext('2d');
    previewCtx.drawImage(framedCanvas, 0, 0);
  }

  function openExportModal() {
    exportModal.classList.remove('hidden');
    updateExportPreview();
  }

  function closeExportModal() {
    exportModal.classList.add('hidden');
  }

  closeExportModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeExportModal();
  });

  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      closeExportModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !exportModal.classList.contains('hidden')) {
      closeExportModal();
    }
  });

  frameOptionBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      frameOptionBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedExportFrame = btn.dataset.frame;
      exportPassepartoutInput.disabled = state.selectedExportFrame === 'none';
      exportTitleInput.disabled = state.selectedExportFrame === 'none';
      updateExportPreview();
    });
  });

  exportPassepartoutInput.addEventListener('change', updateExportPreview);
  exportTitleInput.addEventListener('input', updateExportPreview);
  exportAuthorInput.addEventListener('input', updateExportPreview);

  confirmDownloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.sourceImage) return;
    updateExportPreview();
    const link = document.createElement('a');
    link.download = `atelier-oleo-quadro-${state.activePreset}-${Date.now()}.png`;
    link.href = exportPreviewCanvas.toDataURL('image/png');
    link.click();
  });

  frameToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    frameToggleBtn.classList.toggle('active');
    artworkFrame.classList.toggle('frameless', !frameToggleBtn.classList.contains('active'));
  });

  compareToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setComparisonMode(!state.isComparing);
  });

  function setComparisonMode(enabled) {
    state.isComparing = enabled;
    compareToggleBtn.classList.toggle('active', enabled);
    comparisonOverlay.classList.toggle('hidden', !enabled);
    comparisonSlider.classList.toggle('hidden', !enabled);
    badgeAfter.classList.toggle('hidden', !enabled);
    updateSplitPosition(state.splitPercent);
  }

  function updateSplitPosition(percent) {
    state.splitPercent = Math.max(2, Math.min(98, percent));
    comparisonOverlay.style.clipPath = `inset(0 ${100 - state.splitPercent}% 0 0)`;
    comparisonSlider.style.left = `${state.splitPercent}%`;
    comparisonSlider.setAttribute('aria-valuenow', Math.round(state.splitPercent));
  }

  let isDraggingSlider = false;
  let isPeekingOriginal = false;

  canvasWrapper.addEventListener('pointerdown', (e) => {
    if (!state.sourceImage) return;
    if (state.isComparing) {
      isDraggingSlider = true;
      handleSliderPointer(e);
    } else {
      isPeekingOriginal = true;
      comparisonOverlay.style.clipPath = 'inset(0 0 0 0)';
      comparisonOverlay.classList.remove('hidden');
    }
    canvasWrapper.setPointerCapture(e.pointerId);
  });

  canvasWrapper.addEventListener('pointermove', (e) => {
    if (isDraggingSlider && state.isComparing) {
      handleSliderPointer(e);
    }
  });

  const endPointerInteraction = () => {
    isDraggingSlider = false;
    if (isPeekingOriginal) {
      isPeekingOriginal = false;
      if (!state.isComparing) {
        comparisonOverlay.classList.add('hidden');
        updateSplitPosition(state.splitPercent);
      }
    }
  };

  canvasWrapper.addEventListener('pointerup', endPointerInteraction);
  canvasWrapper.addEventListener('pointercancel', endPointerInteraction);

  function handleSliderPointer(e) {
    const rect = paintCanvas.getBoundingClientRect();
    if (!rect.width) return;
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    updateSplitPosition(relX);
  }

  // =========================================================================
  // FLUXO DE EXECUÇÃO E ANIMAÇÃO DA PINTURA
  // =========================================================================

  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      loadFromDataUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function loadFromDataUrl(dataUrl, shouldSaveSession = true) {
    const img = new Image();
    img.onload = () => {
      if (shouldSaveSession) {
        try {
          sessionStorage.setItem(SESSION_IMG_KEY, dataUrl);
        } catch (_) {
          // Ignora caso a imagem exceda a cota do sessionStorage
        }
      }
      startNewArtwork(img);
    };
    img.src = dataUrl;
  }

  function startNewArtwork(img) {
    state.sourceImage = img;
    dropzone.classList.add('hidden');
    canvasStage.classList.remove('hidden');
    downloadBtn.disabled = false;
    applyReconstructBtn.disabled = false;

    engine.setupDimensions(img, 920);
    initPaintingProcess();
  }

  function initPaintingProcess() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    const params = getCurrentParams();
    const preset = getActivePresetObject();

    engine.prepareArtwork(params, preset);

    state.strokeIndex = 0;
    state.totalStrokesRendered = 0;
    state.isPlaying = true;
    state.isFinished = false;

    updatePlaybackUI();
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (!state.isPlaying || state.isFinished) return;
    state.animationFrameId = requestAnimationFrame(stepPaintingAnimation);
  }

  function stepPaintingAnimation() {
    state.animationFrameId = null;
    if (!state.isPlaying || state.isFinished) return;

    const queue = engine.strokeQueue;
    const total = queue.length;
    if (state.strokeIndex >= total) {
      completePainting();
      return;
    }

    const params = getCurrentParams();
    const preset = getActivePresetObject();

    const speedMultiplier = Math.pow(2, params.paintSpeed - 1);
    const baseBatch = Math.max(18, Math.round(total / 190));
    const strokesThisFrame = Math.min(total - state.strokeIndex, baseBatch * speedMultiplier);

    let currentPassName = '';

    for (let i = 0; i < strokesThisFrame; i++) {
      const stroke = queue[state.strokeIndex++];
      currentPassName = stroke.passName;
      engine.renderBrushStroke(stroke, params, preset);
      state.totalStrokesRendered++;
    }

    engine.applyImpastoAndCanvasLighting(params, preset, false);

    const pct = Math.min(100, Math.round((state.strokeIndex / total) * 100));
    progressFill.style.width = `${pct}%`;
    statusText.textContent = `${currentPassName} (${pct}%)`;
    strokeCounterEl.textContent = `${state.totalStrokesRendered.toLocaleString('pt-BR')} pinceladas`;

    if (state.strokeIndex >= total) {
      completePainting();
    } else {
      scheduleNextFrame();
    }
  }

  function finishPaintingInstantly() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    const params = getCurrentParams();
    const preset = getActivePresetObject();
    const queue = engine.strokeQueue;
    const total = queue.length;

    while (state.strokeIndex < total) {
      engine.renderBrushStroke(queue[state.strokeIndex++], params, preset);
      state.totalStrokesRendered++;
    }

    completePainting();
  }

  function completePainting() {
    state.isPlaying = false;
    state.isFinished = true;
    const params = getCurrentParams();
    const preset = getActivePresetObject();

    engine.applyImpastoAndCanvasLighting(params, preset, true);

    progressFill.style.width = '100%';
    statusDot.classList.add('done');
    statusText.textContent = `Obra finalizada — ${preset.name}`;
    strokeCounterEl.textContent = `${state.totalStrokesRendered.toLocaleString('pt-BR')} pinceladas`;
    updatePlaybackUI();
  }

  function updatePlaybackUI() {
    if (skipAnimationBtn) {
      skipAnimationBtn.disabled = state.isFinished;
    }
    if (state.isPlaying && !state.isFinished) {
      pauseIcon.classList.remove('hidden');
      playIcon.classList.add('hidden');
      statusDot.classList.remove('done');
    } else {
      pauseIcon.classList.add('hidden');
      playIcon.classList.remove('hidden');
    }
  }

  // Inicializa com o modelo Pintura a Óleo Clássica selecionado por padrão
  applyPresetToInputs('atelier');

  // Restaura automaticamente a foto ativa caso a página tenha sido recarregada pelo Live Server
  try {
    const savedImg = sessionStorage.getItem(SESSION_IMG_KEY);
    if (savedImg) {
      loadFromDataUrl(savedImg, false);
    }
  } catch (_) {
    // Sem imagem salva na sessão
  }
})();
