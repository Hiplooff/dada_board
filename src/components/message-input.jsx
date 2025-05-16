import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Send, Image as ImageIcon, X, Loader2, Download } from 'lucide-react'
import { processImageCollage } from '../lib/image-processor'
import { supabase } from '../lib/supabase'

// Constants for validation
const MAX_AUTHOR_LENGTH = 50
const MAX_CONTENT_LENGTH = 1000
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
]

// Rate limiting
const RATE_LIMIT = {
  messages: 10, // messages per minute
  uploads: 5,   // uploads per minute
}

export function MessageInput({ onSubmit }) {
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [applyMerzh, setApplyMerzh] = useState(false)
  const [merzhWidth, setMerzhWidth] = useState(0)
  const [error, setError] = useState(null)
  const [merzhDirection, setMerzhDirection] = useState('horizontal')
  const [originalImageData, setOriginalImageData] = useState(null)

  // Rate limiting state
  const [messageCount, setMessageCount] = useState(0)
  const [uploadCount, setUploadCount] = useState(0)
  const [lastMessageTime, setLastMessageTime] = useState(0)
  const [lastUploadTime, setLastUploadTime] = useState(0)

  const sanitizeInput = (input) => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, MAX_AUTHOR_LENGTH) // Limit length
  }

  const validateFile = (file) => {
    if (!file) return false
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
      return false
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG`)
      return false
    }
    return true
  }

  const checkRateLimit = (type) => {
    const now = Date.now()
    const minuteAgo = now - 60000

    if (type === 'message') {
      if (now - lastMessageTime < 60000 && messageCount >= RATE_LIMIT.messages) {
        setError('Too many messages. Please wait a minute.')
        return false
      }
      if (now - lastMessageTime > 60000) {
        setMessageCount(0)
        setLastMessageTime(now)
      }
      setMessageCount(prev => prev + 1)
    } else if (type === 'upload') {
      if (now - lastUploadTime < 60000 && uploadCount >= RATE_LIMIT.uploads) {
        setError('Too many uploads. Please wait a minute.')
        return false
      }
      if (now - lastUploadTime > 60000) {
        setUploadCount(0)
        setLastUploadTime(now)
      }
      setUploadCount(prev => prev + 1)
    }
    return true
  }

  const uploadImage = async (imageData) => {
    try {
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteArrays = []
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' })
      const fileName = `image_${Date.now()}.jpg`
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    const sanitizedAuthor = sanitizeInput(author)
    const sanitizedContent = sanitizeInput(content)
    
    if (!sanitizedAuthor) {
      setError('Please enter your name')
      return
    }
    
    if (!sanitizedContent && !processedImage) {
      setError('Please enter a message or upload an image')
      return
    }

    if (!checkRateLimit('message')) return

    setIsProcessing(true)
    try {
      let imageUrl = null
      if (processedImage) {
        if (!checkRateLimit('upload')) {
          setIsProcessing(false)
          return
        }
        console.log('Uploading image...')
        imageUrl = await uploadImage(processedImage)
        console.log('Image uploaded:', imageUrl)
      }

      const messageData = {
        content: sanitizedContent,
        author: sanitizedAuthor,
        image_url: imageUrl,
        merzh_width: merzhWidth,
        merzh_direction: merzhDirection
      }
      
      console.log('Submitting message data:', messageData)
      await onSubmit(messageData)

      setContent('')
      setAuthor('')
      setSelectedImage(null)
      setProcessedImage(null)
      setPreviewImage(null)
      setApplyMerzh(false)
      setMerzhWidth(0)
    } catch (error) {
      console.error('Error submitting message:', error)
      setError(`Error posting message: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = async (imageData) => {
    try {
      // Pass direction to the processor
      const processed = await processImageCollage(imageData, '', 0, false, applyMerzh, merzhWidth, merzhDirection)
      
      // Create a preview by scaling down the processed image
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 600 // Increased from 150 to 600 (4x)
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = Math.floor(img.width * scale)
        canvas.height = Math.floor(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setPreviewImage(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = processed
      
      // Set the full processed image
      setProcessedImage(processed)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    }
  }

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 2000; // Max width or height
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality adjustment
          canvas.toBlob((blob) => {
            if (blob) {
              // If still too large, reduce quality
              if (blob.size > MAX_FILE_SIZE) {
                canvas.toBlob((compressedBlob) => {
                  if (compressedBlob) {
                    resolve(compressedBlob);
                  } else {
                    reject(new Error('Failed to compress image'));
                  }
                }, 'image/jpeg', 0.7);
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and GIF files are allowed');
      return;
    }

    setSelectedImage(file);
    setIsProcessing(true);
    setError(null);

    try {
      // Compress the image if it's too large
      const processedFile = file.size > MAX_FILE_SIZE ? 
        await compressImage(file) : 
        file;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result;
          setOriginalImageData(imageData);
          await processImage(imageData);
        } catch (error) {
          setError('Error processing image. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file. Please try again.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      setError('Error processing image. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleMerzhToggle = async () => {
    if (isProcessing || !selectedImage || !originalImageData) return
    setIsProcessing(true)
    const newApplyMerzh = !applyMerzh
    setApplyMerzh(newApplyMerzh)
    
    // Set a default width when enabling the effect
    if (newApplyMerzh && merzhWidth === 0) {
      setMerzhWidth(2)
    }
    
    try {
      await processImage(originalImageData)
    } catch (error) {
      console.error('Error toggling Merzh effect:', error)
      setError('Error toggling effect. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  let processingTimeout

  const handleMerzhWidthChange = async (e) => {
    if (isProcessing || !selectedImage || !applyMerzh) return
    
    const value = parseInt(e.target.value)
    // Convert slider value (0-100) to merzh width (1-32)
    const newWidth = Math.max(1, Math.min(32, value))
    setMerzhWidth(newWidth)
    
    // Debounce the image processing
    if (processingTimeout) {
      clearTimeout(processingTimeout)
    }
    
    processingTimeout = setTimeout(async () => {
      setIsProcessing(true)
      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const imageData = e.target.result
            await processImage(imageData)
          } catch (error) {
            console.error('Error processing image:', error)
            setError('Error processing image. Please try again.')
          } finally {
            setIsProcessing(false)
          }
        }
        reader.onerror = () => {
          console.error('Error reading file')
          setError('Error reading file. Please try again.')
          setIsProcessing(false)
        }
        reader.readAsDataURL(selectedImage)
      } catch (error) {
        console.error('Error reading file:', error)
        setError('Error reading file. Please try again.')
        setIsProcessing(false)
      }
    }, 150) // 150ms debounce
  }

  const handleDirectionToggle = async () => {
    if (isProcessing || !selectedImage || !originalImageData) return
    setIsProcessing(true)
    const newDirection = merzhDirection === 'horizontal' ? 'vertical' : 'horizontal'
    setMerzhDirection(newDirection)
    
    try {
      await processImage(originalImageData)
    } catch (error) {
      console.error('Error changing direction:', error)
      setError('Error changing direction. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setMerzhWidth(0)
    if (selectedImage && applyMerzh) {
      handleMerzhWidthChange({ target: { value: 0 } })
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a')
      link.href = processedImage
      link.download = `merzh-image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <form className="popup-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <input
        className="input"
        type="text"
        placeholder="NAME"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        maxLength={50}
        disabled={isProcessing}
        required
      />
      <textarea
        className="textarea"
        placeholder="WORDS..."
        value={content}
        onChange={e => setContent(e.target.value)}
        maxLength={1000}
        disabled={isProcessing}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="button secondary" style={{ margin: 0 }}>
            <ImageIcon style={{ verticalAlign: 'middle' }} />
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
              disabled={isProcessing}
            />
          </label>
        </div>
        {selectedImage && previewImage && (
          <div className="image-preview-container">
            <img src={previewImage} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="download-icon"
              onClick={handleDownload}
              title="Download image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        )}
        {selectedImage && (
          <div className="merzh-controls">
            <Button
              type="button"
              className={applyMerzh ? 'button' : 'button secondary'}
              onClick={handleMerzhToggle}
              disabled={isProcessing}
              style={{ marginRight: 8 }}
            >
              MERZH
            </Button>
            {applyMerzh && (
              <>
                <div className="merzh-label">MERZH DIRECTION</div>
                <div className="direction-toggle">
                  <button
                    type="button"
                    className={merzhDirection === 'horizontal' ? 'selected' : ''}
                    onClick={handleDirectionToggle}
                    disabled={isProcessing}
                  >
                    <span>H</span>
                  </button>
                  <button
                    type="button"
                    className={merzhDirection === 'vertical' ? 'selected' : ''}
                    onClick={handleDirectionToggle}
                    disabled={isProcessing}
                  >
                    <span>V</span>
                  </button>
                </div>
                <div className="merzh-label">PIXEL SIZE</div>
                <div className="merzh-slider">
                  <input
                    type="range"
                    min="1"
                    max="32"
                    step="1"
                    value={merzhWidth}
                    onChange={handleMerzhWidthChange}
                    disabled={isProcessing}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <button className="button" type="submit" disabled={isProcessing} style={{ marginTop: 12 }}>
        {isProcessing ? <Loader2 className="icon-spin" /> : <Send style={{ verticalAlign: 'middle' }} />} Post
      </button>
    </form>
  )
} 