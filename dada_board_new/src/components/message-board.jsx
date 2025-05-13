import React from 'react'
import { formatDistanceToNow } from "date-fns"
import { Message } from './message'

export function MessageBoard({ messages }) {
  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
      </div>
    </div>
  )
} 