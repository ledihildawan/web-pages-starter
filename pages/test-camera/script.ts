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

const LABEL_FRONT = ['front', 'depan', 'selfie', 'faces'];
const LABEL_BACK = ['back', 'belakang', 'rear', 'environment'];
const LABEL_ULTRA = ['ultra', 'ultrawide', '0.5x', '0.5'];
const LABEL_WIDE = ['wide', 'lebar', '1x', 'standard'];

function timestamp(): string {
  const now = new Date();
  return `${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
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

function pickByPriority(cameras: CameraDevice[], priority: CameraPriority): { index: number; reason: string } {
  if (cameras.length === 0) return { index: -1, reason: 'no cameras' };
  if (cameras.length === 1) return { index: cameras[0].index, reason: 'only one available' };

  switch (priority) {
    case 'camera0': {
      const found = cameras.find((c) => c.cameraNum === 0);
      if (found) return { index: found.index, reason: `found camera0 (num=${found.cameraNum})` };
      const sorted = sortByCameraNumberDesc(cameras);
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
        return { index: sorted[0].index, reason: `fallback from wide → non-ultra (num=${sorted[0].cameraNum})` };
      }
      const sorted = sortByCameraNumberDesc(cameras);
      return { index: sorted[0].index, reason: `fallback from wide → highest (num=${sorted[0].cameraNum})` };
    }
    case 'ultra': {
      const ultra = cameras.filter((c) => c.isUltra);
      if (ultra.length > 0) {
        const sorted = sortByCameraNumberDesc(ultra);
        return { index: sorted[0].index, reason: `found ultra (num=${sorted[0].cameraNum})` };
      }
      const sorted = sortByCameraNumberDesc(cameras);
      return { index: sorted[0].index, reason: `fallback from ultra → highest (num=${sorted[0].cameraNum})` };
    }
    case 'standard': {
      const standard = cameras.filter((c) => !c.isUltra && !c.isWide);
      if (standard.length > 0) {
        const sorted = sortByCameraNumberDesc(standard);
        return { index: sorted[0].index, reason: `found standard (num=${sorted[0].cameraNum})` };
      }
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

function detectMainCamera(
  facing: 'back' | 'front',
  devices: CameraDevice[],
  config: Record<'back' | 'front', CameraPriority>,
): { index: number; reason: string } {
  const filtered = filterByFacing(devices, facing);
  if (filtered.length === 0) return { index: -1, reason: 'none found' };

  const priority = config[facing];
  const result = pickByPriority(filtered, priority);
  return result;
}

function getTypeTag(cam: CameraDevice): string {
  if (cam.isUltra) return ' [ULTRA]';
  if (cam.isWide) return ' [WIDE]';
  return ' [STD]';
}

document.addEventListener('alpine:init', () => {
  Alpine.data('cameraTest', () => ({
    stream: null as MediaStream | null,
    devices: [] as CameraDevice[],
    selectedIndex: -1,
    backIndex: -1,
    frontIndex: -1,
    isFront: false,
    lastError: null as string | null,
    isInitializing: false,
    captured: false,
    logMessages: [] as { msg: string; type: 'info' | 'warn' | 'error'; time: string }[],

    cameraConfig: {
      back: 'camera0' as CameraPriority,
      front: 'highest' as CameraPriority,
    },

    get hasMultipleCameras() {
      return this.devices.length > 1;
    },

    get isActive() {
      return this.stream !== null && this.selectedIndex >= 0;
    },

    get selectedCamera(): CameraDevice | null {
      return this.selectedIndex >= 0 ? this.devices[this.selectedIndex] : null;
    },

    get btnLabelText() {
      return this.isActive ? 'Matikan Kamera' : 'Nyalakan Kamera';
    },

    get btnColorClass() {
      return this.isActive ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500';
    },

    init() {
      this.$nextTick(() => {
        this.setupEventListeners();
      });
    },

    setupEventListeners() {
      const video = this.$refs.video as HTMLVideoElement;
      if (video) {
        video.addEventListener('loadedmetadata', () => {
          this.log('Video metadata loaded');
        });
      }

      navigator.mediaDevices?.addEventListener('devicechange', async () => {
        this.log('Device change detected', 'warn');
        const hadStream = this.stream !== null;
        const prevSelected = this.selectedIndex;

        await this.enumerateCameras();

        const stillExists = prevSelected >= 0 && this.devices.some((d) => d.index === prevSelected);

        if (!stillExists && hadStream) {
          this.log('Kamera sebelumnya tidak ada - auto-switch ke default', 'warn');
          this.autoSelectDefault();
          await this.startCamera();
        } else if (stillExists) {
          this.selectedIndex = prevSelected;
        }

        this.renderSelector();
      });
    },

    log(msg: string, type: 'info' | 'warn' | 'error' = 'info') {
      const prefix = type === 'error' ? '[ERROR]' : type === 'warn' ? '[WARN]' : '';
      const line = `${prefix ? `${prefix} ` : ''}[${timestamp()}] ${msg}`;
      console.log(line);
      this.logMessages.push({ msg, type, time: timestamp() });
      this.$nextTick(() => {
        const logOutput = this.$refs.logOutput as HTMLElement;
        if (logOutput) {
          const color = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
          logOutput.innerHTML += `<br><span style="color:${color}">[${timestamp()}] ${msg}</span>`;
        }
      });
    },

    stopStream(stream: MediaStream | null) {
      if (!stream) return;
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },

    async enumerateCameras(): Promise<void> {
      const rawDevices = await navigator.mediaDevices.enumerateDevices();
      this.devices = buildCameraDevices(rawDevices);
    },

    async detectCameras(): Promise<void> {
      const backResult = detectMainCamera('back', this.devices, this.cameraConfig);
      const frontResult = detectMainCamera('front', this.devices, this.cameraConfig);

      this.backIndex = backResult.index;
      this.frontIndex = frontResult.index;
    },

    autoSelectDefault(): void {
      if (this.backIndex >= 0) {
        this.selectedIndex = this.backIndex;
        this.log('[AUTO] Default: kamera belakang');
      } else if (this.frontIndex >= 0) {
        this.selectedIndex = this.frontIndex;
        this.log('[AUTO] Default: kamera depan');
      } else if (this.devices.length > 0) {
        this.selectedIndex = 0;
        this.log('[AUTO] Default: kamera pertama (tidak ada back/front terdeteksi)');
      }
    },

    logDeviceSummary(): void {
      this.log('');
      this.log(`Ditemukan ${this.devices.length} kamera:`);
      this.devices.forEach((cam) => {
        const isBack = this.backIndex >= 0 && cam.index === this.backIndex;
        const isFront = this.frontIndex >= 0 && cam.index === this.frontIndex;
        const isSelected = cam.index === this.selectedIndex;
        const flags = [isBack ? '←BACK' : '', isFront ? 'FRONT→' : '', isSelected ? '✓' : ''].filter(Boolean).join(' ');
        this.log(`  [${cam.index}] "${cam.label}"${getTypeTag(cam)} ${flags}`);
      });
      this.log('');
    },

    renderSelector(): void {
      const selector = this.$refs.selector as HTMLElement;
      if (!selector) return;

      if (this.devices.length <= 1) {
        selector.classList.add('hidden');
        return;
      }

      selector.innerHTML = '';
      selector.classList.remove('hidden');

      this.devices.forEach((cam, i) => {
        const btn = document.createElement('button');
        const isBackMain = this.backIndex >= 0 && i === this.backIndex;
        const isFrontMain = this.frontIndex >= 0 && i === this.frontIndex;
        const isSelected = i === this.selectedIndex;

        let tag = '';
        if (isBackMain) tag = ` [${this.cameraConfig.back}]`;
        else if (isFrontMain) tag = ` [${this.cameraConfig.front}]`;
        if (isSelected && tag) tag += ' ✓';

        btn.className = `px-4 py-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.96] ${
          isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`;
        btn.textContent = cam.label + tag + getTypeTag(cam);
        btn.addEventListener('click', () => this.selectCamera(i));
        selector.appendChild(btn);
      });
    },

    async selectCamera(index: number) {
      if (index < 0 || index >= this.devices.length) return;

      const cam = this.devices[index];
      this.selectedIndex = index;
      this.isFront = cam.facing === 'front';

      this.log(`Kamera dipilih: "${cam.label}"${getTypeTag(cam)} [facing: ${cam.facing}, num: ${cam.cameraNum}]`);

      if (this.stream) {
        await this.startCamera();
      }
      this.renderSelector();
    },

    async startCamera() {
      if (this.selectedIndex < 0 || this.selectedIndex >= this.devices.length) {
        this.log('Tidak ada kamera dipilih', 'error');
        return;
      }

      const cam = this.devices[this.selectedIndex];
      this.isFront = cam.facing === 'front';
      this.lastError = null;

      this.log(`Membuka: "${cam.label}"...`);

      try {
        if (this.stream) {
          this.stopStream(this.stream);
          this.stream = null;
          await new Promise((r) => setTimeout(r, 100));
        }

        const baseConstraints = {
          deviceId: { exact: cam.deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };

        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: baseConstraints,
        });

        this.stream.getTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            this.log('Track ended - kamera terputus', 'warn');
            this.stopCamera();
          });
          track.addEventListener('mute', () => this.log('Track muted', 'warn'));
          track.addEventListener('unmute', () => this.log('Track unmuted'));
        });

        const video = this.$refs.video as HTMLVideoElement;
        video.srcObject = this.stream;
        video.classList.remove('hidden');
        video.classList.toggle('mirror', this.isFront);

        try {
          await video.play();
        } catch (playErr) {
          if (video.error) {
            this.log(`Video error: ${video.error.message}`, 'error');
          }
          throw playErr;
        }

        if (video.readyState < 2) {
          await new Promise<void>((resolve, reject) => {
            if (!video) return reject();
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error('Video failed to load'));
            setTimeout(() => reject(new Error('Video load timeout')), 5000);
          });
        }

        this.log(`Kamera aktif ✓ [facing: ${cam.facing}, num: ${cam.cameraNum}, type: ${getTypeTag(cam).trim()}]`);
      } catch (err) {
        this.lastError = (err as Error).message;
        this.log(`Error: ${this.lastError}`, 'error');
        if (this.stream) {
          this.stopStream(this.stream);
          this.stream = null;
        }
        const video = this.$refs.video as HTMLVideoElement;
        video.srcObject = null;
      }
    },

    stopCamera() {
      this.stopStream(this.stream);
      this.stream = null;

      const video = this.$refs.video as HTMLVideoElement;
      if (video) {
        video.srcObject = null;
        video.classList.remove('mirror');
      }

      const preview = this.$refs.preview as HTMLImageElement;
      if (preview) preview.classList.add('hidden');

      this.isFront = false;
      this.log('Kamera dimatikan.');
    },

    captureImage() {
      const video = this.$refs.video as HTMLVideoElement;
      const canvas = this.$refs.canvas as HTMLCanvasElement;

      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (this.isFront) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);

      const preview = this.$refs.preview as HTMLImageElement;
      if (preview) {
        preview.src = canvas.toDataURL('image/png');
        preview.classList.remove('hidden');
        this.log('Gambar berhasil di-capture!');
      }
    },

    async initCamera() {
      if (this.isInitializing) return;

      if (this.stream) {
        this.stopCamera();
        return;
      }

      this.isInitializing = true;
      const logOutput = this.$refs.logOutput as HTMLElement;
      if (logOutput) logOutput.innerHTML = '';

      this.log('═══════════════════════════════════════');
      this.log('       INISIALISASI KAMERA             ');
      this.log('═══════════════════════════════════════');

      this.log('Meminta izin kamera...');

      try {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true });
        this.stopStream(temp);
      } catch {
        this.log('Izin kamera ditolak atau tidak tersedia', 'error');
        this.isInitializing = false;
        return;
      }

      try {
        await this.enumerateCameras();
      } catch (err) {
        this.log(`Gagal enumerateDevices: ${(err as Error).message}`, 'error');
        this.isInitializing = false;
        return;
      }

      if (this.devices.length === 0) {
        this.log('Kamera tidak ditemukan', 'error');
        this.isInitializing = false;
        return;
      }

      await this.detectCameras();
      this.autoSelectDefault();
      this.logDeviceSummary();
      this.renderSelector();
      await this.startCamera();

      this.isInitializing = false;
    },

    async switchCamera() {
      if (this.devices.length <= 1) return;

      const nextIndex = (this.selectedIndex + 1) % this.devices.length;
      await this.selectCamera(nextIndex);
    },

    async switchToBack() {
      if (this.backIndex < 0) return;
      await this.selectCamera(this.backIndex);
    },

    async switchToFront() {
      if (this.frontIndex < 0) return;
      await this.selectCamera(this.frontIndex);
    },

    async handlePriorityChange(config: 'back' | 'front') {
      const select =
        config === 'back'
          ? (this.$refs.backPrioritySelect as HTMLSelectElement)
          : (this.$refs.frontPrioritySelect as HTMLSelectElement);
      if (!select) return;

      const newPriority = select.value as CameraPriority;
      const oldPriority = this.cameraConfig[config];
      this.cameraConfig[config] = newPriority;

      this.log(`[Config] ${config === 'back' ? 'Back' : 'Front'} priority: ${oldPriority} → ${newPriority}`);

      if (this.devices.length > 0) {
        const prevBack = this.backIndex;
        const prevFront = this.frontIndex;

        await this.detectCameras();

        const shouldSwitch =
          config === 'back'
            ? this.backIndex !== prevBack && this.backIndex >= 0
            : this.frontIndex !== prevFront && this.frontIndex >= 0;

        if (shouldSwitch) {
          this.log(`[Auto] Switch ke ${config} berdasarkan priority baru`);
          if (config === 'back') {
            await this.switchToBack();
          } else {
            await this.switchToFront();
          }
        }

        this.renderSelector();
      }
    },

    getDebugInfo(): string {
      const { devices, backIndex, frontIndex, selectedIndex, isFront, lastError } = this;
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
        `  Back priority:   ${this.cameraConfig.back}`,
        `  Front priority: ${this.cameraConfig.front}`,
        '═══════════════════════════════════════',
      ];
      return lines.join('\n');
    },

    copyDebugInfo() {
      const info = this.getDebugInfo();
      navigator.clipboard
        .writeText(info)
        .then(() => this.log('Debug info copied to clipboard!'))
        .catch(() => {
          this.log('Failed to copy - see console');
          console.log(info);
        });
    },
  }));
});
