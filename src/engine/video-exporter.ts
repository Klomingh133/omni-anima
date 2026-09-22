const W = 960;
const H = 540;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function renderFramesToVideo(
  frames: Array<{ image_data: string } | string>,
  fps: number = 12,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; dataUrl: string }> {
  if (!frames || !frames.length) {
    throw new Error('No frames provided for video rendering.');
  }

  const frameRate = Math.max(1, Math.min(60, Number(fps) || 12));
  const delay = 1000 / frameRate;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Preload images
  let loadedCount = 0;
  const images = (
    await Promise.all(
      frames.map(async (frame, i) => {
        const src = typeof frame === 'string' ? frame : frame.image_data;
        try {
          const img = await loadImage(src);
          loadedCount++;
          if (onProgress) onProgress(loadedCount / (frames.length * 2));
          return img;
        } catch (e) {
          console.warn('Failed to load frame image for rendering:', i, e);
          return null;
        }
      })
    )
  ).filter((img): img is HTMLImageElement => Boolean(img));

  if (!images.length) {
    throw new Error('Failed to load frame images.');
  }

  let mimeType = 'video/webm;codecs=vp9';
  if (typeof MediaRecorder !== 'undefined') {
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
  }

  const stream = (canvas as any).captureStream(frameRate);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 3500000,
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          blob,
          dataUrl: reader.result as string,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };

    recorder.onerror = reject;
    recorder.start();

    // Loop at least 2-3 times or minimum 24 frames so animations look complete
    const totalLoops = Math.max(1, Math.ceil(24 / images.length));
    let currentFrameIdx = 0;
    let loopCount = 0;

    const interval = setInterval(() => {
      const img = images[currentFrameIdx];
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      if (img) {
        ctx.drawImage(img, 0, 0, W, H);
      }

      currentFrameIdx++;
      if (currentFrameIdx >= images.length) {
        currentFrameIdx = 0;
        loopCount++;
        if (loopCount >= totalLoops) {
          clearInterval(interval);
          setTimeout(() => {
            recorder.stop();
          }, delay + 100);
        }
      }

      if (onProgress) {
        const totalFramesToPlay = images.length * totalLoops;
        const currentProgressFrame = loopCount * images.length + currentFrameIdx;
        onProgress(0.5 + (currentProgressFrame / totalFramesToPlay) * 0.5);
      }
    }, delay);
  });
}

export async function extractFramesFromVideo(
  file: File,
  targetFps: number = 12,
  onProgress?: (progress: number) => void
): Promise<{ frames: string[]; fps: number; name: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 1;
        const fps = Math.max(6, Math.min(30, targetFps));
        const frameInterval = 1 / fps;
        const totalFrames = Math.max(1, Math.min(180, Math.floor(duration * fps)));

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        const extractedFrames: string[] = [];

        for (let i = 0; i < totalFrames; i++) {
          const time = Math.min(duration - 0.05, i * frameInterval);
          await seekVideo(video, time);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);

          const vW = video.videoWidth || W;
          const vH = video.videoHeight || H;
          const scale = Math.min(W / vW, H / vH);
          const dW = vW * scale;
          const dH = vH * scale;
          const dx = (W - dW) / 2;
          const dy = (H - dH) / 2;

          ctx.drawImage(video, dx, dy, dW, dH);
          extractedFrames.push(canvas.toDataURL('image/png'));

          if (onProgress) {
            onProgress((i + 1) / totalFrames);
          }
        }

        URL.revokeObjectURL(url);
        resolve({
          frames: extractedFrames,
          fps,
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Remixed Video Animation',
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read and decode video file.'));
    };
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, time);
  });
}

export function downloadVideoFile(videoSrc: string, filename = 'animation.webm') {
  const a = document.createElement('a');
  a.href = videoSrc;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
