// components/LiveComments.tsx
import React, { useState } from 'react'

type Props = {
  comments: string[]
  onSend: (msg: string) => void
}

const LiveComments = ({ comments, onSend }: Props) => {
  console.log('LiveComments', comments)
  console.log('LiveComments', onSend)
  const [text, setText] = useState('')
  return (
    <div className="p-2">
      <div className="h-40 overflow-y-auto bg-white rounded p-2">
        {comments.map((c, i) => (
          <p key={i} className="text-sm text-gray-800">
            {c}
          </p>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          onSend(text)
          setText('')
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something..."
          className="w-full mt-1 p-1 border rounded"
        />
      </form>
    </div>
  )
}

export default LiveComments
