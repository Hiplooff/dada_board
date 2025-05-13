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
    <div className="message-board">
      {messages.map((message) => (
        <div key={message.id} className="message-card">
          <div className="message-content">
            <div className="message-header">
              <h3 className="message-author">{message.author}</h3>
              <time className="message-time">
                {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
            {message.content && (
              <p className="message-text">{message.content}</p>
            )}
            {message.image_url && (
              <div className="message-image-container">
                <img
                  src={message.image_url}
                  alt="Message attachment"
                  className="message-image"
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