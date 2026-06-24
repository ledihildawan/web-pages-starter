import { defineData } from '@/shared/utils/alpine';

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
  const cameraTest = defineData('cameraTest', () => ({
    stream: null as MediaStream | null,
    devices: [] as CameraDevice[],
    selectedIndex: -1,
    backIndex: -1,
    frontIndex: -1,
    isFront: false,
    lastError: null as string | null,
    isInitializing: false,
    captured: false,
    isCapturing: false,
    showDebugInfo: false,
    showCameraSelector: false,

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

    init() {
      this.$nextTick(() => {
        this.setupEventListeners();
      });
    },

    setupEventListeners() {
      const video = this.$refs.video as HTMLVideoElement;
      if (video) {
        video.addEventListener('loadedmetadata', () => {
          console.log(`[${timestamp()}] Video metadata loaded`);
        });
      }

      navigator.mediaDevices?.addEventListener('devicechange', async () => {
        console.log(`[${timestamp()}] Device change detected`);
        const hadStream = this.stream !== null;
        const prevSelected = this.selectedIndex;

        await this.enumerateCameras();

        const stillExists = prevSelected >= 0 && this.devices.some((d) => d.index === prevSelected);

        if (!stillExists && hadStream) {
          console.log(`[${timestamp()}] Previous camera unavailable - auto-switching to default`);
          this.autoSelectDefault();
          await this.startCamera();
        } else if (stillExists) {
          this.selectedIndex = prevSelected;
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
        console.log(`[${timestamp()}] [AUTO] Default: back camera`);
      } else if (this.frontIndex >= 0) {
        this.selectedIndex = this.frontIndex;
        console.log(`[${timestamp()}] [AUTO] Default: front camera`);
      } else if (this.devices.length > 0) {
        this.selectedIndex = 0;
        console.log(`[${timestamp()}] [AUTO] Default: first camera (no back/front detected)`);
      }
    },

    toggleCameraSelector() {
      this.showCameraSelector = !this.showCameraSelector;
    },

    async selectCamera(index: number) {
      if (index < 0 || index >= this.devices.length) return;

      const cam = this.devices[index];
      this.selectedIndex = index;
      this.isFront = cam.facing === 'front';

      console.log(
        `[${timestamp()}] Camera selected: "${cam.label}"${getTypeTag(cam)} [facing: ${cam.facing}, num: ${cam.cameraNum}]`,
      );

      if (this.stream) {
        await this.startCamera();
      }
    },

    async startCamera() {
      if (this.selectedIndex < 0 || this.selectedIndex >= this.devices.length) {
        this.lastError = 'No camera selected';
        return;
      }

      const cam = this.devices[this.selectedIndex];
      this.isFront = cam.facing === 'front';
      this.lastError = null;
      this.captured = false;

      console.log(`[${timestamp()}] Opening: "${cam.label}"...`);

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
            console.log(`[${timestamp()}] Track ended - camera disconnected`);
            this.stopCamera();
          });
          track.addEventListener('mute', () => console.log(`[${timestamp()}] Track muted`));
          track.addEventListener('unmute', () => console.log(`[${timestamp()}] Track unmuted`));
        });

        const video = this.$refs.video as HTMLVideoElement;
        video.srcObject = this.stream;
        video.classList.toggle('mirror', this.isFront);

        try {
          await video.play();
        } catch (playErr) {
          if (video.error) {
            this.lastError = video.error.message;
            console.error(`[${timestamp()}] Video error: ${video.error.message}`);
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

        console.log(
          `[${timestamp()}] Camera active [facing: ${cam.facing}, num: ${cam.cameraNum}, type: ${getTypeTag(cam).trim()}]`,
        );
      } catch (err) {
        this.lastError = (err as Error).message;
        console.error(`[${timestamp()}] Error: ${this.lastError}`);
        if (this.stream) {
          this.stopStream(this.stream);
          this.stream = null;
        }
        const video = this.$refs.video as HTMLVideoElement;
        if (video) video.srcObject = null;

        setTimeout(() => {
          if (this.lastError === (err as Error).message) {
            this.lastError = null;
          }
        }, 4000);
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
      this.captured = false;
      console.log(`[${timestamp()}] Camera stopped`);
    },

    async captureImage() {
      if (this.isCapturing) return;

      const video = this.$refs.video as HTMLVideoElement;
      const canvas = this.$refs.canvas as HTMLCanvasElement;

      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      this.isCapturing = true;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (this.isFront) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);

      const flashOverlay = this.$refs.flashOverlay as HTMLElement;
      const captureSuccess = this.$refs.captureSuccess as HTMLElement;

      flashOverlay.classList.remove('flash-overlay');
      captureSuccess.classList.remove('capture-success');

      await new Promise((r) => setTimeout(r, 10));
      flashOverlay.classList.add('flash-overlay');

      const preview = this.$refs.preview as HTMLImageElement;
      if (preview) {
        preview.src = canvas.toDataURL('image/png');
        preview.classList.remove('hidden');
      }

      await new Promise((r) => setTimeout(r, 100));
      captureSuccess.classList.add('capture-success');

      console.log(`[${timestamp()}] Image captured!`);

      setTimeout(() => {
        this.isCapturing = false;
        captureSuccess.classList.remove('capture-success');
      }, 600);
    },

    async initCamera() {
      if (this.isInitializing) return;

      if (this.stream) {
        this.stopCamera();
        return;
      }

      this.isInitializing = true;
      this.lastError = null;

      console.log('═══════════════════════════════════════');
      console.log('       CAMERA INITIALIZATION           ');
      console.log('═══════════════════════════════════════');

      try {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true });
        this.stopStream(temp);
      } catch {
        this.lastError = 'Camera access denied or not available';
        this.isInitializing = false;
        setTimeout(() => {
          if (this.lastError === 'Camera access denied or not available') {
            this.lastError = null;
          }
        }, 4000);
        return;
      }

      try {
        await this.enumerateCameras();
      } catch (err) {
        this.lastError = `Failed to enumerate devices: ${(err as Error).message}`;
        this.isInitializing = false;
        return;
      }

      if (this.devices.length === 0) {
        this.lastError = 'No cameras found on this device';
        this.isInitializing = false;
        return;
      }

      await this.detectCameras();
      this.autoSelectDefault();
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

      console.log(
        `[${timestamp()}] [Config] ${config === 'back' ? 'Back' : 'Front'} priority: ${oldPriority} → ${newPriority}`,
      );

      if (this.devices.length > 0) {
        const prevBack = this.backIndex;
        const prevFront = this.frontIndex;

        await this.detectCameras();

        const shouldSwitch =
          config === 'back'
            ? this.backIndex !== prevBack && this.backIndex >= 0
            : this.frontIndex !== prevFront && this.frontIndex >= 0;

        if (shouldSwitch) {
          console.log(`[${timestamp()}] [Auto] Switching to ${config} based on new priority`);
          if (config === 'back') {
            await this.switchToBack();
          } else {
            await this.switchToFront();
          }
        }
      }
    },

    getDebugInfo(): string {
      const { devices, backIndex, frontIndex, selectedIndex, isFront, lastError } = this;
      const lines = [
        '═══════════════════════════════════════',
        '           CAMERA DEBUG INFO           ',
        '═══════════════════════════════════════',
        `Timestamp: ${new Date().toISOString()}`,
        `Total cameras: ${devices.length}`,
        `Last error: ${lastError || 'none'}`,
        '',
        '─── Camera List ───',
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
        .then(() => console.log(`[${timestamp()}] Debug info copied to clipboard!`))
        .catch(() => {
          console.log(info);
        });
    },
  }));

  Alpine.data(cameraTest.name, cameraTest.factory);
});
