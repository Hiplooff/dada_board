/**
 * Process image to black and white with optional merzh effect
 * @param {string} imageData - Base64 image data
 * @param {boolean} isPreview - Whether to create a preview thumbnail
 * @param {boolean} applyMerzh - Whether to apply the merzh effect
 * @param {number} merzhWidth - Width of merzh lines (0 = no effect, 2 = 1/2, 4 = 1/4, 8 = 1/8, 16 = 1/16, etc.)
 * @param {string} direction - Direction of shuffling ('horizontal' or 'vertical')
 * @returns {Promise<string>} - Processed image data
 */
export async function processImageCollage(
  imageData,
  text,
  textSize,
  includePicture,
  applyMerzh,
  merzhWidth,
  direction = 'horizontal'
) {
  return new Promise((resolve, reject) => {
    if (!imageData) {
      reject(new Error('No image data provided'));
      return;
    }

    const img = new Image();

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSize = 800;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // Convert to black and white
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const bw = avg > 128 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = bw;
        }

        // Apply merzh effect
        if (applyMerzh && merzhWidth > 1) {
          const width = canvas.width;
          const height = canvas.height;
          const originalData = new Uint8ClampedArray(data); // copy

          const bandSize = Math.max(1, Math.floor((direction === 'horizontal' ? height : width) / merzhWidth));

          if (direction === 'vertical') {
            for (let x = 0; x < width; x += bandSize) {
              const currentBandWidth = Math.min(bandSize, width - x);
              const shift = Math.floor(Math.random() * height);

              for (let bandX = 0; bandX < currentBandWidth; bandX++) {
                for (let y = 0; y < height; y++) {
                  const sourceY = (y + shift) % height;
                  const sourceIndex = ((sourceY * width) + (x + bandX)) * 4;
                  const targetIndex = ((y * width) + (x + bandX)) * 4;

                  data[targetIndex] = originalData[sourceIndex];
                  data[targetIndex + 1] = originalData[sourceIndex + 1];
                  data[targetIndex + 2] = originalData[sourceIndex + 2];
                  data[targetIndex + 3] = originalData[sourceIndex + 3];
                }
              }
            }
          } else {
            for (let y = 0; y < height; y += bandSize) {
              const currentBandHeight = Math.min(bandSize, height - y);
              const shift = Math.floor(Math.random() * width);

              for (let bandY = 0; bandY < currentBandHeight; bandY++) {
                for (let x = 0; x < width; x++) {
                  const sourceX = (x + shift) % width;
                  const sourceIndex = (((y + bandY) * width) + sourceX) * 4;
                  const targetIndex = (((y + bandY) * width) + x) * 4;

                  data[targetIndex] = originalData[sourceIndex];
                  data[targetIndex + 1] = originalData[sourceIndex + 1];
                  data[targetIndex + 2] = originalData[sourceIndex + 2];
                  data[targetIndex + 3] = originalData[sourceIndex + 3];
                }
              }
            }
          }
        }

        ctx.putImageData(imageDataObj, 0, 0);
        const result = canvas.toDataURL('image/jpeg', 0.85);

        // Clean up
        canvas.width = 1;
        canvas.height = 1;

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.src = imageData;
  });
}

// Helper function to copy a block of pixels from one position to another
function copyBlock(sourceData, targetData, sourceX, sourceY, targetX, targetY, blockSize, width) {
  for (let y = 0; y < blockSize; y++) {
    for (let x = 0; x < blockSize; x++) {
      const sourceIndex = ((sourceY + y) * width + (sourceX + x)) * 4
      const targetIndex = ((targetY + y) * width + (targetX + x)) * 4
      
      if (sourceIndex < sourceData.length && targetIndex < targetData.length) {
        targetData[targetIndex] = sourceData[sourceIndex]
        targetData[targetIndex + 1] = sourceData[sourceIndex + 1]
        targetData[targetIndex + 2] = sourceData[sourceIndex + 2]
        targetData[targetIndex + 3] = sourceData[sourceIndex + 3]
      }
    }
  }
} 