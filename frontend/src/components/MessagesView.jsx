import React, { useState } from 'react'

const MessagesView = ({ messages }) => {
  return (
    <ul
      style={{
        width: '100%',
        minHeight: '70vh',
        // height: '80%',
        backgroundColor: 'orange',
        // overflowY: 'scroll',
      }}
    >
      {messages.map((mess) => (
        <li key={mess.id}>{mess.content}</li>
      ))}
    </ul>
  )
}

export default MessagesView
