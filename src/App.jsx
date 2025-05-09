import React, { useState, useEffect } from 'react'
import { MessageBoard } from './components/message-board'
import { MessageInput } from './components/message-input'
import { supabase } from './lib/supabase'

export function App() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

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
    } catch (error) {
      setError('Error posting message')
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-mono uppercase tracking-wider text-center">
          DADA BOARD
        </h1>
        {error && (
          <div className="text-red-500 text-center font-mono">
            {error}
          </div>
        )}
        <MessageInput onSubmit={handleSubmit} />
        <MessageBoard messages={messages} />
      </div>
    </div>
  )
}
