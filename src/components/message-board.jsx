import React from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

export function MessageBoard({ messages, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  if (!messages?.length) {
    return (
      <div className="text-center py-8 text-white/50">
        No messages yet. Be the first to post!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="bg-black border border-white/30 p-4 shadow-lg backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-mono uppercase tracking-wider">{message.author}</h3>
              <time className="text-sm text-white/50">
                {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
            
            <p className="whitespace-pre-wrap font-serif">{message.content}</p>
            
            {message.image_url && (
              <div className="mt-4">
                <img
                  src={message.image_url}
                  alt="Message attachment"
                  className="max-w-full h-auto"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 