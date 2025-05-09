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
        merzh_width: merzhWidth
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
      // Process image once at full size
      const processed = await processImageCollage(imageData, '', 0, false, applyMerzh, merzhWidth)
      
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
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error reading file:', error)
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
    <div className="bg-black border border-white/50 p-4 shadow-lg backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="text-red-500 text-sm font-mono">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="author" className="text-sm font-mono uppercase tracking-wider text-white/80 block mb-1">
              FROM:
            </label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="..."
              className="mt-1 bg-black border-white/50 text-white font-mono"
              required
            />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-upload').click()}
              className="gap-2"
              disabled={isProcessing}
            >
              <ImageIcon className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-mono uppercase tracking-wider text-white/80 block mb-1">
            LETTERS
          </label>
          <Textarea
            id="message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="..."
            className="mt-1 min-h-[80px] bg-black border-white/50 text-white font-serif"
          />
        </div>

        {selectedImage && (
          <div className="space-y-3">
            <div className="relative">
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-40 object-contain border border-white/50"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={applyMerzh ? "default" : "outline"}
                    size="sm"
                    onClick={handleMerzhToggle}
                    className="font-mono"
                    disabled={isProcessing}
                  >
                    merzh
                  </Button>
                  {applyMerzh && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={merzhWidth === 0 ? 0 : Math.log2(merzhWidth) * 20}
                          onChange={handleMerzhWidthChange}
                          className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          disabled={isProcessing}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="font-mono"
                        disabled={isProcessing}
                      >
                        reset
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedImage(null)
                    setProcessedImage(null)
                    setPreviewImage(null)
                    setApplyMerzh(false)
                    setMerzhWidth(0)
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {processedImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="absolute bottom-2 right-2"
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="gap-2 bg-white text-black hover:bg-white/80 font-mono uppercase tracking-wider"
            disabled={isProcessing || (!content.trim() && !processedImage)}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isProcessing ? 'PROCESSING...' : 'SEND'}
          </Button>
        </div>
      </form>
    </div>
  )
} 