import React from 'react'
import { formatDistanceToNow } from 'date-fns'

export function Message({ message }) {
  return (
    <div
      className="bg-black border border-white/30 rounded-none p-3 sm:p-4 transform hover:rotate-1 transition-transform"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
        marginBottom: '1.5rem'
      }}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1 sm:mb-2">
            <h3 className="font-mono text-white uppercase tracking-wider text-sm sm:text-base">{message.author}</h3>
            <span className="text-xs text-gray-400 font-mono">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
          {message.content && (
            <p className="mt-1 text-gray-200 font-serif text-sm sm:text-base" style={{ lineHeight: "1.7" }}>
              {message.content}
            </p>
          )}
          {message.imageData && (
            <div
              className="message-image-frame"
              style={{
                border: '2px solid #fff',
                background: '#000',
                width: '100%',
                maxWidth: '100%',
                maxHeight: '70vh',
                overflow: 'hidden',
                marginTop: '0.75rem',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={message.imageData}
                alt="Message attachment"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  border: 'none',
                  borderRadius: 0,
                  background: '#000'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
