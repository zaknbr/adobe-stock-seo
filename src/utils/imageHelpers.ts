/**
 * Reads a File and produces a lightweight scaled-down base64 string for Gemini Vision AI,
 * properly preserving alpha channel transparency for PNG images so they aren't turned into black backgrounds.
 */
export async function fileToOptimizedBase64(file: File): Promise<{ base64: string; mimeType: string; isTransparent: boolean }> {
  return new Promise((resolve, reject) => {
    const isPngFile = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    // If it's a video file, generate a video thumbnail frame
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1024;
          let width = video.videoWidth || 640;
          let height = video.videoHeight || 360;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(url);
            resolve({
              base64: dataUrl.split('base64,')[1] || dataUrl,
              mimeType: 'image/jpeg',
              isTransparent: false
            });
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Canvas context failure on video'));
          }
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      video.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      return;
    }

    // Standard image processing with resizing canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context could not be created'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Detect if image contains transparency
        let hasTransparency = isPngFile;
        if (isPngFile) {
          try {
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;
            // Sample pixels to confirm transparency (alpha channel < 250)
            for (let i = 3; i < data.length; i += 16) {
              if (data[i] < 250) {
                hasTransparency = true;
                break;
              }
            }
          } catch (e) {
            // Ignore security/CORS error if any and default to true for PNG
            hasTransparency = true;
          }
        }

        let dataUrl: string;
        let mimeType: string;

        if (hasTransparency) {
          // Export as PNG so transparency is 100% preserved
          dataUrl = canvas.toDataURL('image/png');
          mimeType = 'image/png';
        } else {
          // Export as high quality JPEG for non-transparent images
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          mimeType = 'image/jpeg';
        }

        URL.revokeObjectURL(objectUrl);
        resolve({
          base64: dataUrl.split('base64,')[1] || dataUrl,
          mimeType,
          isTransparent: hasTransparency
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}
