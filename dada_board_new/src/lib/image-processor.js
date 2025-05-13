/**
 * Process image to black and white with optional merzh effect
 * @param {string} imageData - Base64 image data
 * @param {boolean} isPreview - Whether to create a preview thumbnail
 * @param {boolean} applyMerzh - Whether to apply the merzh effect
 * @param {number} merzhWidth - Width of merzh lines in pixels
 * @param {string} direction - Direction of merzh effect ('horizontal' or 'vertical')
 * @returns {Promise<string>} - Processed image data
 */
export async function processImageCollage(imageData, pattern, pixelSize, isPreview = false, applyMerzh = false, merzhWidth = 10, direction = 'horizontal') {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxSize = isPreview ? 150 : 400
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = Math.floor(img.width * scale)
      canvas.height = Math.floor(img.height * scale)
      const ctx = canvas.getContext('2d')
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Convert to black and white
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const bw = avg > 128 ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = bw
      }

      // Apply merzh effect if requested
      if (applyMerzh) {
        const width = canvas.width
        const height = canvas.height
        const lineWidth = Math.max(1, Math.min(merzhWidth, direction === 'vertical' ? width : height)) // Ensure line width/height is valid
        
        // Create a copy of the data
        const originalData = new Uint8ClampedArray(data)
        
        if (direction === 'vertical') {
          // Shuffle vertical columns
          for (let x = 0; x < width; x += lineWidth) {
            const currentLineWidth = Math.min(lineWidth, width - x)
            const offset = Math.floor(Math.random() * height)
            for (let lineX = 0; lineX < currentLineWidth; lineX++) {
              const sourceX = x + lineX
              const targetX = x + lineX
              for (let y = 0; y < height; y++) {
                const sourceY = (y + offset) % height
                const targetY = y
                const sourceIndex = (sourceY * width + sourceX) * 4
                const targetIndex = (targetY * width + targetX) * 4
                data[targetIndex] = originalData[sourceIndex]
                data[targetIndex + 1] = originalData[sourceIndex + 1]
                data[targetIndex + 2] = originalData[sourceIndex + 2]
                data[targetIndex + 3] = originalData[sourceIndex + 3]
              }
            }
          }
        } else {
          // Shuffle horizontal lines (default)
          for (let y = 0; y < height; y += lineWidth) {
            const currentLineHeight = Math.min(lineWidth, height - y)
            const offset = Math.floor(Math.random() * width)
            for (let lineY = 0; lineY < currentLineHeight; lineY++) {
              const sourceY = y + lineY
              const targetY = y + lineY
              for (let x = 0; x < width; x++) {
                const sourceX = (x + offset) % width
                const targetX = x
                const sourceIndex = (sourceY * width + sourceX) * 4
                const targetIndex = (targetY * width + targetX) * 4
                data[targetIndex] = originalData[sourceIndex]
                data[targetIndex + 1] = originalData[sourceIndex + 1]
                data[targetIndex + 2] = originalData[sourceIndex + 2]
                data[targetIndex + 3] = originalData[sourceIndex + 3]
              }
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = imageData
  })
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