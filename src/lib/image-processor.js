/**
 * Process image to black and white with optional merzh effect
 * @param {string} imageData - Base64 image data
 * @param {boolean} isPreview - Whether to create a preview thumbnail
 * @param {boolean} applyMerzh - Whether to apply the merzh effect
 * @param {number} merzhWidth - Width of merzh lines (0 = no effect, 2 = 1/2, 4 = 1/4, 8 = 1/8, 16 = 1/16, etc.)
 * @param {string} direction - Direction of shuffling ('horizontal' or 'vertical')
 * @returns {Promise<string>} - Processed image data
 */
export async function processImageCollage(imageData, text, textSize, includePicture, applyMerzh, merzhWidth, direction = 'horizontal') {
  return new Promise((resolve, reject) => {
    if (!imageData) {
      reject(new Error('No image data provided'))
      return
    }

    const img = new Image()
    
    // Set up error handling
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.onload = () => {
      try {
        // Create canvas with proper scaling
        const canvas = document.createElement('canvas')
        const maxSize = 800 // Maintain good quality while limiting size
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = Math.floor(img.width * scale)
        canvas.height = Math.floor(img.height * scale)
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Draw and convert to black and white
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Convert to true black and white (not grayscale)
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          const bw = avg > 128 ? 255 : 0
          data[i] = data[i + 1] = data[i + 2] = bw
        }

        // Apply merzh effect if requested
        if (applyMerzh && merzhWidth > 1) {
          const width = canvas.width
          const height = canvas.height
          
          // Calculate band size based on merzhWidth
          const bandSize = direction === 'vertical' 
            ? Math.floor(width / merzhWidth)
            : Math.floor(height / merzhWidth)
          
          // Create a copy of the data for safe manipulation
          const originalData = new Uint8ClampedArray(data)
          
          if (direction === 'vertical') {
            // Process vertical bands
            for (let x = 0; x < width; x += bandSize) {
              const currentBandWidth = Math.min(bandSize, width - x)
              const offset = Math.floor(Math.random() * height)
              
              // Shift each pixel in the band
              for (let bandX = 0; bandX < currentBandWidth; bandX++) {
                const sourceX = x + bandX
                for (let y = 0; y < height; y++) {
                  const sourceY = (y + offset) % height
                  const sourceIndex = (sourceY * width + sourceX) * 4
                  const targetIndex = (y * width + sourceX) * 4
                  
                  // Copy all RGBA values
                  data[targetIndex] = originalData[sourceIndex]
                  data[targetIndex + 1] = originalData[sourceIndex + 1]
                  data[targetIndex + 2] = originalData[sourceIndex + 2]
                  data[targetIndex + 3] = originalData[sourceIndex + 3]
                }
              }
            }
          } else {
            // Process horizontal bands
            for (let y = 0; y < height; y += bandSize) {
              const currentBandHeight = Math.min(bandSize, height - y)
              const offset = Math.floor(Math.random() * width)
              
              // Shift each pixel in the band
              for (let bandY = 0; bandY < currentBandHeight; bandY++) {
                const sourceY = y + bandY
                for (let x = 0; x < width; x++) {
                  const sourceX = (x + offset) % width
                  const sourceIndex = (sourceY * width + sourceX) * 4
                  const targetIndex = (sourceY * width + x) * 4
                  
                  // Copy all RGBA values
                  data[targetIndex] = originalData[sourceIndex]
                  data[targetIndex + 1] = originalData[sourceIndex + 1]
                  data[targetIndex + 2] = originalData[sourceIndex + 2]
                  data[targetIndex + 3] = originalData[sourceIndex + 3]
                }
              }
            }
          }
        }
        
        // Put the processed data back on the canvas
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to JPEG with 85% quality
        const result = canvas.toDataURL('image/jpeg', 0.85)
        
        // Clean up
        canvas.width = 1
        canvas.height = 1
        ctx.clearRect(0, 0, 1, 1)
        
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    // Load the image
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