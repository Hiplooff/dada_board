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
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

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
      setError('File size must be less than 5MB')
      return false
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and GIF files are allowed')
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
        const maxSize = 150
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!validateFile(file)) return
    setSelectedImage(file)
    setIsProcessing(true)
    setError(null)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result
          setOriginalImageData(imageData)
          await processImage(imageData)
        } catch (error) {
          setError('Error processing image. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      }
      reader.onerror = () => {
        setError('Error reading file. Please try again.')
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setError('Error reading file. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleMerzhToggle = async () => {
    if (isProcessing || !selectedImage) return
    setIsProcessing(true)
    setApplyMerzh(!applyMerzh)
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result
          await processImage(imageData)
        } catch (error) {
          console.error('Error processing image:', error)
          alert('Error processing image. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      }
      reader.onerror = () => {
        console.error('Error reading file')
        alert('Error reading file. Please try again.')
        setIsProcessing(false)
      }
      reader.readAsDataURL(selectedImage)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleMerzhWidthChange = async (e) => {
    const value = parseInt(e.target.value)
    // Convert slider value (0-100) to merzh width (0,2,4,8,16...)
    const newWidth = value === 0 ? 0 : Math.pow(2, Math.floor(value / 20))
    setMerzhWidth(newWidth)
    
    if (isProcessing || !selectedImage || !applyMerzh) return
    setIsProcessing(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result
          await processImage(imageData)
        } catch (error) {
          console.error('Error processing image:', error)
          alert('Error processing image. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      }
      reader.onerror = () => {
        console.error('Error reading file')
        alert('Error reading file. Please try again.')
        setIsProcessing(false)
      }
      reader.readAsDataURL(selectedImage)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again.')
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
        placeholder="Your name"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        maxLength={50}
        disabled={isProcessing}
        required
      />
      <textarea
        className="textarea"
        placeholder="Write your message..."
        value={content}
        onChange={e => setContent(e.target.value)}
        maxLength={1000}
        disabled={isProcessing}
      />
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
        {selectedImage && previewImage && (
          <img src={previewImage} alt="Preview" className="image-preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
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
                <div className="merzh-label">PIXEL SIZE</div>
                <div className="merzh-slider">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    step="2"
                    value={merzhWidth}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      setMerzhWidth(v)
                      if (originalImageData) processImage(originalImageData)
                    }}
                    disabled={isProcessing}
                  />
                </div>
                <div className="merzh-label">MERZH DIRECTION</div>
                <div className="direction-toggle">
                  <button
                    type="button"
                    className={merzhDirection === 'horizontal' ? 'selected' : ''}
                    onClick={() => { setMerzhDirection('horizontal'); if (originalImageData) processImage(originalImageData); }}
                    disabled={isProcessing}
                  >
                    <span>H</span>
                  </button>
                  <button
                    type="button"
                    className={merzhDirection === 'vertical' ? 'selected' : ''}
                    onClick={() => { setMerzhDirection('vertical'); if (originalImageData) processImage(originalImageData); }}
                    disabled={isProcessing}
                  >
                    <span>V</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    setApplyMerzh(false)
                    setMerzhWidth(0)
                    if (originalImageData) {
                      setIsProcessing(true)
                      try {
                        // Re-process with applyMerzh: false
                        const processed = await processImageCollage(originalImageData, '', 0, false, false, 0, merzhDirection)
                        setPreviewImage(processed)
                        setProcessedImage(processed)
                      } catch (error) {
                        setError('Error processing image. Please try again.')
                      } finally {
                        setIsProcessing(false)
                      }
                    }
                  }}
                  disabled={isProcessing}
                  style={{ marginTop: 8 }}
                >
                  RESET
                </button>
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