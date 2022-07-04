import React, { useMemo } from 'react'
const isBrowser = typeof window !== "undefined";
const instance = useMemo(() => isBrowser ? new WebSocket("ws://127.0.0.1:8000/ws") : null, []);

type SocketProviderState = {
    socket: WebSocket | null
}

const initialState = {
    socket: instance
}
const WebSocketProvider = (children: React.ReactNode) => {
    const SocketContext = React.createContext<SocketProviderState>(initialState)
  return (
    <SocketContext.Provider value={initialState}>
        {children}
    </SocketContext.Provider>
  )
}

export default WebSocketProvider