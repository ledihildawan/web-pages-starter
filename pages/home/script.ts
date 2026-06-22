document.addEventListener('alpine:init', () => {
  Alpine.data('homeHero', () => ({
    title: 'Web Pages Starter',
    subtitle: 'Build lightning-fast web applications',
    isMenuOpen: false,

    init() {},

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
  }));
});

type CameraPriority =
  | 'camera0'
  | 'wide'
  | 'ultra'
  | 'standard'
  | 'highest'
  | 'lowest'
  | 'first'
  | 'last'
  | 'first-available';

type FacingMode = 'back' | 'front' | 'unknown';

interface CameraDevice {
  index: number;
  deviceId: string;
  label: string;
  facing: FacingMode;
  cameraNum: number;
  isUltra: boolean;
  isWide: boolean;
}

interface CameraState {
  stream: MediaStream | null;
  devices: CameraDevice[];
  selectedIndex: number;
  backIndex: number;
  frontIndex: number;
  isFront: boolean;
  lastError: string | null;
  isInitializing: boolean;
}

const LABEL_FRONT = ['front', 'depan', 'selfie', 'faces'];
const LABEL_BACK = ['back', 'belakang', 'rear', 'environment'];
const LABEL_ULTRA = ['ultra', 'ultrawide', '0.5x', '0.5'];
const LABEL_WIDE = ['wide', 'lebar', '1x', 'standard'];

const cameraConfig: Record<'back' | 'front', CameraPriority> = {
  back: 'camera0',
  front: 'highest',
};

const dom = {
  startBtn: document.getElementById('startCameraBtn') as HTMLButtonElement | null,
  switchBtn: document.getElementById('switchCameraBtn') as HTMLButtonElement | null,
  backBtn: document.getElementById('backCameraBtn') as HTMLButtonElement | null,
  frontBtn: document.getElementById('frontCameraBtn') as HTMLButtonElement | null,
  debugBtn: document.getElementById('debugCameraBtn') as HTMLButtonElement | null,
  captureBtn: document.getElementById('captureBtn') as HTMLButtonElement | null,
  btnLabel: document.getElementById('btnLabel'),
  video: document.getElementById('videoElement') as HTMLVideoElement | null,
  logOutput: document.getElementById('logOutput'),
  selector: document.getElementById('cameraSelector'),
  canvas: document.getElementById('captureCanvas') as HTMLCanvasElement | null,
  preview: document.getElementById('capturePreview') as HTMLImageElement | null,
  backPrioritySelect: document.getElementById('backPrioritySelect') as HTMLSelectElement | null,
  frontPrioritySelect: document.getElementById('frontPrioritySelect') as HTMLSelectElement | null,
};

const state: CameraState = {
  stream: null,
  devices: [],
  selectedIndex: -1,
  backIndex: -1,
  frontIndex: -1,
  isFront: false,
  lastError: null,
  isInitializing: false,
};

function timestamp(): string {
  const now = new Date();
  return `${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
}

function log(msg: string, type: 'info' | 'warn' | 'error' = 'info') {
  const prefix = type === 'error' ? '[ERROR]' : type === 'warn' ? '[WARN]' : '';
  const line = `${prefix ? `${prefix} ` : ''}[${timestamp()}] ${msg}`;
  console.log(line);
  if (dom.logOutput) {
    const color = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
    dom.logOutput.innerHTML += `<br><span style="color:${color}">[${timestamp()}] ${msg}</span>`;
  }
}

function labelMatch(label: string, keywords: string[]): boolean {
  const lower = label.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function extractCameraNumber(label: string): number {
  const patterns = [/\bcamera\s*(\d+)/i, /(\d+)\s*,\s*facing/i, /\bfacing.*?(\d+)/i];

  for (const pattern of patterns) {
    const match = label.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num)) return num;
    }
  }

  const lastNum = label.match(/\d+$/);
  if (lastNum) return parseInt(lastNum[0], 10);

  return -1;
}

function detectFacing(label: string): FacingMode {
  const lower = label.toLowerCase();

  const frontMatch = labelMatch(lower, LABEL_FRONT) && !labelMatch(lower, LABEL_BACK);
  const backMatch = labelMatch(lower, LABEL_BACK) && !labelMatch(lower, LABEL_FRONT);

  if (frontMatch && !backMatch) return 'front';
  if (backMatch && !frontMatch) return 'back';
  if (frontMatch && backMatch) {
    const frontIdx = LABEL_FRONT.findIndex((kw) => lower.includes(kw));
    const backIdx = LABEL_BACK.findIndex((kw) => lower.includes(kw));
    return frontIdx <= backIdx ? 'front' : 'back';
  }

  return 'unknown';
}

function buildCameraDevices(rawDevices: MediaDeviceInfo[]): CameraDevice[] {
  return rawDevices
    .filter((d) => d.kind === 'videoinput')
    .map((d, i) => {
      const label = d.label || `Camera ${i}`;
      const lower = label.toLowerCase();
      const facing = detectFacing(label);
      const cameraNum = extractCameraNumber(label);
      const isUltra = labelMatch(lower, LABEL_ULTRA);
      const isWide = labelMatch(lower, LABEL_WIDE) && !isUltra;

      return {
        index: i,
        deviceId: d.deviceId,
        label,
        facing,
        cameraNum,
        isUltra,
        isWide,
      };
    });
}

function sortByCameraNumberDesc<T extends { cameraNum: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    if (a.cameraNum === -1 && b.cameraNum !== -1) return 1;
    if (a.cameraNum !== -1 && b.cameraNum === -1) return -1;
    return b.cameraNum - a.cameraNum;
  });
}

function pickByPriority(
  cameras: CameraDevice[],
  priority: CameraPriority,
  _fallbackLabel: string,
): { index: number; reason: string } {
  if (cameras.length === 0) return { index: -1, reason: 'no cameras' };
  if (cameras.length === 1) return { index: cameras[0].index, reason: 'only one available' };

  switch (priority) {
    case 'camera0': {
      const found = cameras.find((c) => c.cameraNum === 0);
      if (found) return { index: found.index, reason: `found camera0 (num=${found.cameraNum})` };
      const sorted = sortByCameraNumberDesc(cameras);
      log(`[Prioritas] "camera0" tidak ditemukan, fallback ke "${sorted[0].label}"`, 'warn');
      return { index: sorted[0].index, reason: `fallback from camera0 → highest (num=${sorted[0].cameraNum})` };
    }
    case 'wide': {
      const wide = cameras.filter((c) => c.isWide);
      if (wide.length > 0) {
        const sorted = sortByCameraNumberDesc(wide);
        return { index: sorted[0].index, reason: `found wide (num=${sorted[0].cameraNum})` };
      }
      const nonUltra = cameras.filter((c) => !c.isUltra);
      if (nonUltra.length > 0) {
        const sorted = sortByCameraNumberDesc(nonUltra);
        log(`[Prioritas] "wide" tidak ditemukan, fallback ke non-ultra "${sorted[0].label}"`, 'warn');
        return { index: sorted[0].index, reason: `fallback from wide → non-ultra (num=${sorted[0].cameraNum})` };
      }
      const sorted = sortByCameraNumberDesc(cameras);
      log(`[Prioritas] "wide" tidak ditemukan, fallback ke "${sorted[0].label}"`, 'warn');
      return { index: sorted[0].index, reason: `fallback from wide → highest (num=${sorted[0].cameraNum})` };
    }
    case 'ultra': {
      const ultra = cameras.filter((c) => c.isUltra);
      if (ultra.length > 0) {
        const sorted = sortByCameraNumberDesc(ultra);
        return { index: sorted[0].index, reason: `found ultra (num=${sorted[0].cameraNum})` };
      }
      log(`[Prioritas] "ultra" tidak ditemukan, fallback ke highest`, 'warn');
      const sorted = sortByCameraNumberDesc(cameras);
      return { index: sorted[0].index, reason: `fallback from ultra → highest (num=${sorted[0].cameraNum})` };
    }
    case 'standard': {
      const standard = cameras.filter((c) => !c.isUltra && !c.isWide);
      if (standard.length > 0) {
        const sorted = sortByCameraNumberDesc(standard);
        return { index: sorted[0].index, reason: `found standard (num=${sorted[0].cameraNum})` };
      }
      log(`[Prioritas] "standard" tidak ditemukan, fallback ke highest`, 'warn');
      const sorted = sortByCameraNumberDesc(cameras);
      return { index: sorted[0].index, reason: `fallback from standard → highest (num=${sorted[0].cameraNum})` };
    }
    case 'highest': {
      const sorted = sortByCameraNumberDesc(cameras);
      return { index: sorted[0].index, reason: `highest (num=${sorted[0].cameraNum})` };
    }
    case 'lowest': {
      const sorted = sortByCameraNumberDesc(cameras);
      const last = sorted.at(-1);
      return { index: last ? last.index : cameras[0].index, reason: `lowest (num=${last?.cameraNum ?? -1})` };
    }
    case 'first':
      return { index: cameras[0].index, reason: 'first in list' };
    case 'last':
      return { index: cameras.at(-1)?.index ?? cameras[0].index, reason: 'last in list' };
    case 'first-available':
      return { index: cameras[0].index, reason: 'first-available' };
    default:
      return { index: cameras[0].index, reason: 'default' };
  }
}

function filterByFacing(devices: CameraDevice[], facing: 'back' | 'front'): CameraDevice[] {
  return devices.filter((d) => d.facing === facing);
}

function detectMainCamera(facing: 'back' | 'front', devices: CameraDevice[]): { index: number; reason: string } {
  const filtered = filterByFacing(devices, facing);
  if (filtered.length === 0) return { index: -1, reason: 'none found' };

  const priority = cameraConfig[facing];
  const result = pickByPriority(filtered, priority, facing);
  log(
    `[Deteksi] ${facing === 'back' ? 'Belakang' : 'Depan'} → "${devices[result.index]?.label}" (${result.reason}, prioritas: ${priority})`,
  );
  return result;
}

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

async function getStream(deviceId: string): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Browser tidak mendukung getUserMedia');
  }

  const baseConstraints = {
    deviceId: { exact: deviceId },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

  const tryConstraints = async (video: MediaTrackConstraints): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices?.getUserMedia({ audio: false, video });
    } catch (err) {
      if (video.advanced) {
        const { advanced: _advanced, ...basic } = video;
        return await navigator.mediaDevices?.getUserMedia({ audio: false, video: basic });
      }
      throw err;
    }
  };

  try {
    return await tryConstraints({
      ...baseConstraints,
      advanced: [{ focusMode: 'continuous' } as MediaTrackConstraints],
    });
  } catch (_warn) {
    log('Gagal dengan advanced constraints, retry tanpa focusMode...', 'warn');
    return await tryConstraints(baseConstraints);
  }
}

function showHide(btn: HTMLButtonElement | null, show: boolean) {
  if (!btn) return;
  btn.classList.toggle('hidden', !show);
}

function updateButtons() {
  const { backIndex, frontIndex, selectedIndex, stream, devices } = state;
  const hasMultiple = devices.length > 1;
  const isActive = stream !== null && state.selectedIndex >= 0;

  showHide(dom.switchBtn, hasMultiple && isActive);
  showHide(dom.backBtn, hasMultiple && isActive && backIndex >= 0 && selectedIndex !== backIndex);
  showHide(dom.frontBtn, hasMultiple && isActive && frontIndex >= 0 && selectedIndex !== frontIndex);
  showHide(dom.captureBtn, isActive);

  if (dom.startBtn && dom.btnLabel) {
    if (isActive) {
      dom.startBtn.classList.replace('bg-emerald-600', 'bg-red-600');
      dom.startBtn.classList.replace('hover:bg-emerald-500', 'hover:bg-red-500');
      dom.btnLabel.textContent = 'Matikan Kamera';
    } else {
      dom.startBtn.classList.replace('bg-red-600', 'bg-emerald-600');
      dom.startBtn.classList.replace('hover:bg-red-500', 'hover:bg-emerald-500');
      dom.btnLabel.textContent = 'Nyalakan Kamera';
    }
  }
}

function updateMirror() {
  if (!dom.video) return;
  dom.video.classList.toggle('mirror', state.isFront);
}

function getTypeTag(cam: CameraDevice): string {
  if (cam.isUltra) return ' [ULTRA]';
  if (cam.isWide) return ' [WIDE]';
  return ' [STD]';
}

function renderSelector() {
  const selector = dom.selector;
  if (!selector) return;

  if (state.devices.length <= 1) {
    selector.classList.add('hidden');
    return;
  }

  selector.innerHTML = '';
  selector.classList.remove('hidden');

  state.devices.forEach((cam, i) => {
    const btn = document.createElement('button');
    const isBackMain = state.backIndex >= 0 && i === state.backIndex;
    const isFrontMain = state.frontIndex >= 0 && i === state.frontIndex;
    const isSelected = i === state.selectedIndex;

    let tag = '';
    if (isBackMain) tag = ` [${cameraConfig.back}]`;
    else if (isFrontMain) tag = ` [${cameraConfig.front}]`;
    if (isSelected && tag) tag += ' ✓';

    btn.className = `px-4 py-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.96] ${
      isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;
    btn.textContent = cam.label + tag + getTypeTag(cam);
    btn.addEventListener('click', () => selectCamera(i));
    selector.appendChild(btn);
  });
}

async function selectCamera(index: number) {
  if (index < 0 || index >= state.devices.length) return;

  const cam = state.devices[index];
  state.selectedIndex = index;
  state.isFront = cam.facing === 'front';

  log(`Kamera dipilih: "${cam.label}"${getTypeTag(cam)} [facing: ${cam.facing}, num: ${cam.cameraNum}]`);

  if (state.stream) {
    await startCamera();
  }
  renderSelector();
  updateButtons();
}

async function startCamera() {
  if (!dom.video || !dom.logOutput) return;
  if (state.selectedIndex < 0 || state.selectedIndex >= state.devices.length) {
    log('Tidak ada kamera dipilih', 'error');
    return;
  }

  const cam = state.devices[state.selectedIndex];
  state.isFront = cam.facing === 'front';
  state.lastError = null;

  log(`Membuka: "${cam.label}"...`);

  try {
    if (state.stream) {
      stopStream(state.stream);
      state.stream = null;
      await new Promise((r) => setTimeout(r, 100));
    }

    state.stream = await getStream(cam.deviceId);

    state.stream.getTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        log('Track ended - kamera terputus', 'warn');
        stopCamera();
      });
      track.addEventListener('mute', () => log('Track muted', 'warn'));
      track.addEventListener('unmute', () => log('Track unmuted'));
    });

    dom.video.srcObject = state.stream;
    dom.video.classList.remove('hidden');

    window.dispatchEvent(new CustomEvent('camera-start'));

    try {
      await dom.video.play();
    } catch (playErr) {
      if (dom.video.error) {
        log(`Video error: ${dom.video.error.message}`, 'error');
      }
      throw playErr;
    }

    if (dom.video.readyState < 2) {
      await new Promise<void>((resolve, reject) => {
        if (!dom.video) return reject();
        dom.video.onloadeddata = () => resolve();
        dom.video.onerror = () => reject(new Error('Video failed to load'));
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });
    }

    updateMirror();
    log(`Kamera aktif ✓ [facing: ${cam.facing}, num: ${cam.cameraNum}, type: ${getTypeTag(cam).trim()}]`);
    updateButtons();
    window.dispatchEvent(new CustomEvent('camera-ready'));
  } catch (err) {
    state.lastError = (err as Error).message;
    log(`Error: ${state.lastError}`, 'error');
    if (state.stream) {
      stopStream(state.stream);
      state.stream = null;
    }
    dom.video.srcObject = null;
    updateButtons();
    window.dispatchEvent(new CustomEvent('camera-error', { detail: { message: state.lastError } }));
  }
}

function stopCamera() {
  stopStream(state.stream);
  state.stream = null;

  if (dom.video) {
    dom.video.srcObject = null;
    dom.video.classList.remove('mirror');
  }

  if (dom.preview) dom.preview.classList.add('hidden');

  state.isFront = false;
  log('Kamera dimatikan.');
  updateButtons();
  window.dispatchEvent(new CustomEvent('camera-stop'));
}

function captureImage() {
  if (!dom.video || !dom.canvas) return;

  const ctx = dom.canvas.getContext('2d');
  if (!ctx) return;

  dom.canvas.width = dom.video.videoWidth;
  dom.canvas.height = dom.video.videoHeight;

  if (state.isFront) {
    ctx.translate(dom.canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(dom.video, 0, 0);

  if (dom.preview) {
    dom.preview.src = dom.canvas.toDataURL('image/png');
    dom.preview.classList.remove('hidden');
    log('Gambar berhasil di-capture!');
  }
}

function getDebugInfo(): string {
  const { devices, backIndex, frontIndex, selectedIndex, isFront, lastError } = state;
  const lines = [
    '═══════════════════════════════════════',
    '           CAMERA DEBUG INFO            ',
    '═══════════════════════════════════════',
    `Timestamp: ${new Date().toISOString()}`,
    `Total kamera: ${devices.length}`,
    `Last error: ${lastError || 'none'}`,
    '',
    '─── Kamera List ───',
    ...devices.map((cam) =>
      [
        `  [${cam.index}] "${cam.label}"`,
        `       ID: ${cam.deviceId.slice(0, 20)}...`,
        `       facing: ${cam.facing} | num: ${cam.cameraNum} | ultra: ${cam.isUltra} | wide: ${cam.isWide}`,
      ].join('\n'),
    ),
    '',
    '─── State ───',
    `  BackIndex:  ${backIndex} ${backIndex >= 0 ? `→ "${devices[backIndex]?.label}"` : ''}`,
    `  FrontIndex: ${frontIndex} ${frontIndex >= 0 ? `→ "${devices[frontIndex]?.label}"` : ''}`,
    `  Selected:   ${selectedIndex} ${selectedIndex >= 0 ? `→ "${devices[selectedIndex]?.label}"` : ''}`,
    `  IsFront:    ${isFront}`,
    '',
    `  Back priority:   ${cameraConfig.back}`,
    `  Front priority: ${cameraConfig.front}`,
    '═══════════════════════════════════════',
  ];
  return lines.join('\n');
}

async function enumerateCameras(): Promise<void> {
  const rawDevices = await navigator.mediaDevices.enumerateDevices();
  state.devices = buildCameraDevices(rawDevices);
}

async function detectCameras(): Promise<void> {
  const backResult = detectMainCamera('back', state.devices);
  const frontResult = detectMainCamera('front', state.devices);

  state.backIndex = backResult.index;
  state.frontIndex = frontResult.index;
}

function autoSelectDefault(): void {
  if (state.backIndex >= 0) {
    state.selectedIndex = state.backIndex;
    log('[AUTO] Default: kamera belakang');
  } else if (state.frontIndex >= 0) {
    state.selectedIndex = state.frontIndex;
    log('[AUTO] Default: kamera depan');
  } else if (state.devices.length > 0) {
    state.selectedIndex = 0;
    log('[AUTO] Default: kamera pertama (tidak ada back/front terdeteksi)');
  }
}

function logDeviceSummary(): void {
  log('');
  log(`Ditemukan ${state.devices.length} kamera:`);
  state.devices.forEach((cam) => {
    const isBack = state.backIndex >= 0 && cam.index === state.backIndex;
    const isFront = state.frontIndex >= 0 && cam.index === state.frontIndex;
    const isSelected = cam.index === state.selectedIndex;
    const flags = [isBack ? '←BACK' : '', isFront ? 'FRONT→' : '', isSelected ? '✓' : ''].filter(Boolean).join(' ');
    log(`  [${cam.index}] "${cam.label}"${getTypeTag(cam)} ${flags}`);
  });
  log('');
}

async function initCamera() {
  if (state.isInitializing) return;

  if (state.stream) {
    stopCamera();
    return;
  }

  state.isInitializing = true;
  if (dom.logOutput) dom.logOutput.innerHTML = '';

  log('═══════════════════════════════════════');
  log('       INISIALISASI KAMERA             ');
  log('═══════════════════════════════════════');

  log('Meminta izin kamera...');

  try {
    const temp = await navigator.mediaDevices.getUserMedia({ video: true });
    stopStream(temp);
  } catch {
    log('Izin kamera ditolak atau tidak tersedia', 'error');
    state.isInitializing = false;
    return;
  }

  try {
    await enumerateCameras();
  } catch (err) {
    log(`Gagal enumerateDevices: ${(err as Error).message}`, 'error');
    state.isInitializing = false;
    return;
  }

  if (state.devices.length === 0) {
    log('Kamera tidak ditemukan', 'error');
    state.isInitializing = false;
    return;
  }

  await detectCameras();
  autoSelectDefault();
  logDeviceSummary();
  renderSelector();
  await startCamera();

  state.isInitializing = false;
}

async function switchCamera() {
  if (state.devices.length <= 1) return;

  const nextIndex = (state.selectedIndex + 1) % state.devices.length;
  await selectCamera(nextIndex);
}

async function switchToBack() {
  if (state.backIndex < 0) return;
  await selectCamera(state.backIndex);
}

async function switchToFront() {
  if (state.frontIndex < 0) return;
  await selectCamera(state.frontIndex);
}

dom.startBtn?.addEventListener('click', initCamera);
dom.switchBtn?.addEventListener('click', switchCamera);
dom.backBtn?.addEventListener('click', switchToBack);
dom.frontBtn?.addEventListener('click', switchToFront);
dom.captureBtn?.addEventListener('click', captureImage);
dom.debugBtn?.addEventListener('click', () => {
  const info = getDebugInfo();
  navigator.clipboard
    .writeText(info)
    .then(() => log('Debug info copied to clipboard!'))
    .catch(() => {
      log('Failed to copy - see console');
      console.log(info);
    });
});

function handlePriorityChange(config: 'back' | 'front') {
  return async () => {
    const select = config === 'back' ? dom.backPrioritySelect : dom.frontPrioritySelect;
    if (!select) return;

    const newPriority = select.value as CameraPriority;
    const oldPriority = cameraConfig[config];
    cameraConfig[config] = newPriority;

    log(`[Config] ${config === 'back' ? 'Back' : 'Front'} priority: ${oldPriority} → ${newPriority}`);

    if (state.devices.length > 0) {
      const prevBack = state.backIndex;
      const prevFront = state.frontIndex;

      await detectCameras();

      const shouldSwitch =
        config === 'back'
          ? state.backIndex !== prevBack && state.backIndex >= 0
          : state.frontIndex !== prevFront && state.frontIndex >= 0;

      if (shouldSwitch) {
        log(`[Auto] Switch ke ${config} berdasarkan priority baru`);
        if (config === 'back') {
          await switchToBack();
        } else {
          await switchToFront();
        }
      }

      renderSelector();
    }
  };
}

if (dom.backPrioritySelect) {
  dom.backPrioritySelect.value = cameraConfig.back;
  dom.backPrioritySelect.addEventListener('change', handlePriorityChange('back'));
}

if (dom.frontPrioritySelect) {
  dom.frontPrioritySelect.value = cameraConfig.front;
  dom.frontPrioritySelect.addEventListener('change', handlePriorityChange('front'));
}

navigator.mediaDevices?.addEventListener('devicechange', async () => {
  log('─── Device change detected ───', 'warn');
  const hadStream = state.stream !== null;
  const prevSelected = state.selectedIndex;

  await enumerateCameras();
  await detectCameras();

  const stillExists = prevSelected >= 0 && state.devices.some((d) => d.index === prevSelected);

  if (!stillExists && hadStream) {
    log('Kamera sebelumnya tidak ada - auto-switch ke default', 'warn');
    autoSelectDefault();
    await startCamera();
  } else if (stillExists) {
    state.selectedIndex = prevSelected;
  }

  logDeviceSummary();
  renderSelector();
  updateButtons();
});
