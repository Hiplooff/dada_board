import React, { useState } from 'react'
import { MessageBoard } from './components/message-board'
import { MessageInput } from './components/message-input'
import { Plus } from 'lucide-react'
import { Button } from './components/ui/button'

// Initial sample messages with Dada-inspired content
const INITIAL_MESSAGES = [
  {
    id: "1",
    author: "TRISTAN TZARA",
    content:
      "To make a Dadaist poem, take a newspaper. Take a pair of scissors. Choose an article as long as you are planning to make your poem.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    includePicture: true,
  },
  {
    id: "2",
    author: "MARCEL DUCHAMP",
    content: "I have forced myself to contradict myself in order to avoid conforming to my own taste.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    includePicture: false,
  },
  {
    id: "3",
    author: "HUGO BALL",
    content:
      "For us, art is not an end in itself, but it is an opportunity for the true perception and criticism of the times we live in.",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    includePicture: true,
  },
]

function App() {
  const [showInput, setShowInput] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)

  const handleSubmit = (message) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [newMessage, ...prev])
    setShowInput(false)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/30 py-3 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-5 left-10 w-20 h-20 border-4 border-white rotate-45"></div>
            <div className="absolute top-10 right-20 w-10 h-10 bg-white rounded-full"></div>
            <div className="absolute bottom-5 left-1/3 w-40 h-1 bg-white"></div>
            <div className="absolute top-1/2 right-1/4 w-1 h-20 bg-white"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-widest relative z-10 text-center">
          THIS IS NOT A MESSAGE BOARD
        </h1>
      </header>

      <div className="p-4">
        <MessageBoard messages={messages} />
      </div>
      
      {!showInput && (
        <Button
          onClick={() => setShowInput(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-none bg-white text-black hover:bg-white/80 transform rotate-45"
        >
          <Plus className="h-8 w-8 transform -rotate-45" />
        </Button>
      )}

      {showInput && (
        <div className="fixed inset-x-0 bottom-0 bg-black border-t border-white/30 transform transition-transform duration-300 ease-in-out">
          <div className="max-w-4xl mx-auto p-4">
            <MessageInput onSubmit={handleSubmit} />
            <Button
              onClick={() => setShowInput(false)}
              variant="ghost"
              className="mt-4 w-full text-white/50 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
