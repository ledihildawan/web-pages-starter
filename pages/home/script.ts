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

const startBtn = document.getElementById('startCameraBtn');
const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
const logOutput = document.getElementById('logOutput');

function log(msg: string) {
  console.log(msg);
  if (logOutput) {
    logOutput.innerHTML += `<br>> ${msg}`;
  }
}

async function initCamera() {
  if (!logOutput) return;
  logOutput.innerHTML = '';
  try {
    log('Meminta izin...');
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
    initialStream.getTracks().forEach((track) => {
      track.stop();
    });

    log('Membaca daftar kamera...');
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');

    if (videoDevices.length === 0) {
      log('Kamera tidak ditemukan.');
      return;
    }

    videoDevices.forEach((device, i) => {
      log(`[${i}]: ${device.label || 'Tanpa Label'}`);
    });

    const mainBackCamera = videoDevices.find((d) => {
      const label = d.label.toLowerCase();
      const isBack = label.includes('back') || label.includes('rear') || label.includes('lingkungan');
      const isWide = label.includes('wide') || label.includes('0.5') || label.includes('ultra');
      return isBack && !isWide;
    });

    const selectedId = mainBackCamera ? mainBackCamera.deviceId : videoDevices[0].deviceId;
    log('Membuka ID terpilih...');

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: selectedId },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    const videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = videoStream;
    log('Kamera aktif!');
  } catch (error) {
    log(`Error: ${(error as Error).message}`);
  }
}

startBtn?.addEventListener('click', initCamera);
