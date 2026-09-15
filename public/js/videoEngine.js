/**
 * VideoRecorder & VideoExtractor for OmniAnima
 * Handles rendering canvas frames to WebM video and extracting video frames into animation frames
 */
window.VideoEngine = (function() {
  'use strict';

  const W = 960;
  const H = 540;

  /**
   * Helper to load an image from DataURL/URL
   */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  /**
   * Render an array of frame image data into a WebM video DataURL / Blob
   * @param {Array<string|object>} frames - Array of frame data URLs or frame objects
   * @param {number} fps - Frame rate (default 12)
   * @param {function} onProgress - Progress callback (ratio 0..1)
   * @returns {Promise<{ blob: Blob, dataUrl: string }>}
   */
  async function renderFramesToVideo(frames, fps = 12, onProgress = null) {
    if (!frames || !frames.length) {
      throw new Error('No frames provided for video rendering.');
    }

    const frameRate = Math.max(1, Math.min(60, Number(fps) || 12));
    const delay = 1000 / frameRate;

    // Create offscreen rendering canvas
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Preload all frame images
    const images = [];
    for (let i = 0; i < frames.length; i++) {
      const src = frames[i]?.image_data || frames[i];
      try {
        const img = await loadImage(src);
        images.push(img);
      } catch (e) {
        console.warn('Failed to load frame image for rendering:', i, e);
      }
      if (onProgress) onProgress((i + 1) / (frames.length * 2));
    }

    if (!images.length) {
      throw new Error('Failed to load frame images.');
    }

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const stream = canvas.captureStream(frameRate);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: 3500000 // 3.5 Mbps for crisp lines
    });

    const recordedChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise(async (resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            blob,
            dataUrl: reader.result
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      recorder.onerror = reject;

      recorder.start();

      // Play through frames at least 2-3 loops or minimum 2.5 seconds so short animations look complete
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
          const currentProgressFrame = (loopCount * images.length) + currentFrameIdx;
          onProgress(0.5 + (currentProgressFrame / totalFramesToPlay) * 0.5);
        }
      }, delay);
    });
  }

  /**
   * Extract video frames from an uploaded Video file (MP4, WebM, etc.)
   * @param {File} file - Video file from file input
   * @param {number} targetFps - Sampling frame rate (default 12)
   * @param {function} onProgress - Progress callback
   * @returns {Promise<{ frames: string[], fps: number, name: string }>}
   */
  async function extractFramesFromVideo(file, targetFps = 12, onProgress = null) {
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
          const totalFrames = Math.max(1, Math.min(180, Math.floor(duration * fps))); // Cap at 180 frames for smooth editing

          const canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext('2d');

          const extractedFrames = [];

          for (let i = 0; i < totalFrames; i++) {
            const time = Math.min(duration - 0.05, i * frameInterval);
            await seekVideo(video, time);

            // Draw video centered with aspect ratio preserve
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
            name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Remixed Video Animation'
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

  function seekVideo(video, time) {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.max(0, time);
    });
  }

  /**
   * Trigger direct browser download for a video data URL or Blob
   */
  function downloadVideoFile(videoSrc, filename = 'animation.webm') {
    const a = document.createElement('a');
    a.href = videoSrc;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return {
    renderFramesToVideo,
    extractFramesFromVideo,
    downloadVideoFile
  };
})();
