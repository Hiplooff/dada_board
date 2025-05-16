import React, { useState, useEffect } from 'react'
import { MessageBoard } from './components/message-board'
import { MessageInput } from './components/message-input'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [showInput, setShowInput] = useState(false)

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (showInput) {
        event.preventDefault()
        setShowInput(false)
        // Push a new state to prevent the browser from going back
        window.history.pushState(null, '', window.location.href)
      }
    }

    // Push initial state when input is shown
    if (showInput) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [showInput])

  // Initial messages
  const initialMessages = [
    {
      content: "DADA IS NOTHING",
      author: "TRISTAN TZARA",
      created_at: new Date().toISOString(),
      image_url: null,
      merzh_width: 0
    },
    {
      content: "I HAVE FORCED MYSELF TO CONTRADICT MYSELF IN ORDER TO AVOID CONFORMING TO MY OWN TASTE",
      author: "MARCEL DUCHAMP",
      created_at: new Date().toISOString(),
      image_url: null,
      merzh_width: 0
    },
    {
      content: "HOW CAN ONE GET RID OF EVERYTHING THAT SMACKS OF JOURNALISM, WIT, POSTERITY, ELEPHANT, ZINC, SOFT, TIN, RESTAURANT, STOMACHIC, SYPHILIS, PRESS, PEOPLE, AND OTHER THINGS?",
      author: "HUGO BALL",
      created_at: new Date().toISOString(),
      image_url: null,
      merzh_width: 0
    }
  ]

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        if (data.length === 0) {
          // If no messages, insert initial messages
          const { error: insertError } = await supabase
            .from('messages')
            .insert(initialMessages)

          if (insertError) throw insertError

          setMessages(initialMessages)
        } else {
          setMessages(data)
        }
      } catch (error) {
        setError('Error loading messages')
        console.error('Error:', error)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          setMessages(current => [payload.new, ...current])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (message) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: message.content,
          author: message.author,
          image_url: message.image_url,
          merzh_width: message.merzh_width
        })
        .select()

      if (error) throw error

      setMessages(current => [data[0], ...current])
      setShowInput(false)
    } catch (error) {
      setError('Error posting message')
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <h1>THIS IS NOT A MESSAGE BOARD</h1>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="board-container">
        <MessageBoard messages={messages} />
      </div>
      {!showInput && (
        <button className="fab" onClick={() => setShowInput(true)} title="Post a message">
          <span>+</span>
        </button>
      )}
      {showInput && (
        <div className="popup-input">
          <MessageInput onSubmit={handleSubmit} />
          <button className="button secondary" onClick={() => setShowInput(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default App
