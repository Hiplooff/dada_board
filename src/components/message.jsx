import React from 'react'
import { formatDistanceToNow } from 'date-fns'

export function Message({ message }) {
  return (
    <div
      className="bg-black border border-white/30 rounded-none p-4 transform hover:rotate-1 transition-transform"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)"
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-mono text-white uppercase tracking-wider">{message.author}</h3>
            <span className="text-xs text-gray-400 font-mono">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
          {message.content && (
            <p className="mt-1 text-gray-200 font-serif" style={{ lineHeight: "1.7" }}>
              {message.content}
            </p>
          )}
          {message.imageData && (
            <div className="mt-3 overflow-hidden border border-white/50">
              <div className="relative aspect-[4/3] max-h-[400px]">
                <img
                  src={message.imageData}
                  alt="Message attachment"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 