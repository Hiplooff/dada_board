import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { processImageCollage } from '../lib/image-processor'

export function MessageInput({ onSubmit }) {
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [applyMerzh, setApplyMerzh] = useState(false)
  const [merzhWidth, setMerzhWidth] = useState(10)
  const [merzhDirection, setMerzhDirection] = useState('horizontal')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!author.trim()) {
      alert('Please enter your name')
      return
    }
    
    if (!content.trim() && !processedImage) {
      alert('Please enter a message or upload an image')
      return
    }

    const message = {
      content: content.trim(),
      author: author.trim(),
      timestamp: new Date().toISOString(),
      includePicture: !!processedImage,
      imageData: processedImage
    }

    onSubmit(message)
    setContent('')
    setAuthor('')
    setSelectedImage(null)
    setProcessedImage(null)
    setPreviewImage(null)
    setApplyMerzh(false)
    setMerzhWidth(10)
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
    if (file) {
      setSelectedImage(file)
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
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error reading file:', error)
        alert('Error reading file. Please try again.')
        setIsProcessing(false)
      }
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
    const newWidth = parseInt(e.target.value) || 1
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

  return (
    <div className="bg-black border border-white/50 p-4 shadow-lg backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
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
                    <>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={merzhWidth}
                        onChange={handleMerzhWidthChange}
                        className="w-20 h-8 bg-black border-white/50 text-white font-mono text-sm"
                        disabled={isProcessing}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={merzhDirection === 'horizontal' ? 'default' : 'outline'}
                          size="sm"
                          className="font-mono px-3 py-1"
                          onClick={() => setMerzhDirection('horizontal')}
                          disabled={isProcessing}
                        >
                          H
                        </Button>
                        <Button
                          type="button"
                          variant={merzhDirection === 'vertical' ? 'default' : 'outline'}
                          size="sm"
                          className="font-mono px-3 py-1"
                          onClick={() => setMerzhDirection('vertical')}
                          disabled={isProcessing}
                        >
                          V
                        </Button>
                      </div>
                    </>
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
                    setMerzhWidth(10)
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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