import React from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

export function MessageBoard({ messages, isLoading }) {
  if (isLoading) {
    return (
      <div className="loader-center">
        <Loader2 className="icon-spin" />
      </div>
    )
  }

  if (!messages?.length) {
    return (
      <div className="empty-message">
        No messages yet. Be the first to post!
      </div>
    )
  }

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id} className="message-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3>{message.author}</h3>
              <time>
                {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
            <p>{message.content}</p>
            {message.image_url && (
              <div>
                <img
                  src={message.image_url}
                  alt="Message attachment"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 