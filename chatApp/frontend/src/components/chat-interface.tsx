import type React from "react"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { Send, LogOut, Hash } from "lucide-react"
import { RoomList } from "./room-list"
import { UserList } from "./user-list"
import { MessageList } from "./message-list"

const API_BASE_URL = "http://localhost:3001"

interface ChatInterfaceProps {
  user: any
  onLogout: () => void
}

export function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [rooms, setRooms] = useState<any>([])
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any>([])
  const [newMessage, setNewMessage] = useState<any>("")
  const [onlineUsers, setOnlineUsers] = useState<any>([])
  const [typingUsers, setTypingUsers] = useState<any>([])
  const [isConnected, setIsConnected] = useState<any>(false)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_BASE_URL)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to server")
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    newSocket.on("new_message", (message) => {
      setMessages((prev:any) => [...prev, message])
    })

    newSocket.on("user_joined", (data) => {
      console.log("User joined:", data)
    })

    newSocket.on("user_left", (data) => {
      console.log("User left:", data)
    })

    newSocket.on("user_typing", (data) => {
      setTypingUsers((prev:any) => {
        if (!prev.find((u:any) => u.userId === data.userId)) {
          return [...prev, data]
        }
        return prev
      })
    })

    newSocket.on("user_stopped_typing", (data) => {
      setTypingUsers((prev:any) => prev.filter((u:any) => u.userId !== data.userId))
    })

    // Load initial data
    loadRooms()
    loadUsers()

    return () => {
      newSocket.close()
    }
  }, [])

  const loadRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`)
      const roomsData = await response.json()
      setRooms(roomsData)

      // Auto-select first room
      if (roomsData.length > 0 && !currentRoom) {
        selectRoom(roomsData[0])
      }
    } catch (error) {
      console.error("Failed to load rooms:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`)
      const usersData = await response.json()
      setOnlineUsers(usersData.filter((u:any) => u.isOnline))
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const selectRoom = async (room:any) => {
    if (currentRoom) {
      socket?.emit("leave_room", {
        roomId: currentRoom.id,
        userId: user.id,
      })
    }

    setCurrentRoom(room)
    setMessages([])

    // Join new room
    socket?.emit("join_room", {
      roomId: room.id,
      userId: user.id,
    })

    // Load messages for the room
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${room.id}/messages`)
      const messagesData = await response.json()
      setMessages(messagesData)
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentRoom || !socket) return

    socket.emit("send_message", {
      roomId: currentRoom.id,
      senderId: user.id,
      content: newMessage.trim(),
      messageType: "TEXT",
    })

    setNewMessage("")

    // Stop typing indicator
    socket.emit("typing_stop", {
      roomId: currentRoom.id,
      userId: user.id,
    })
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)

    if (!currentRoom || !socket) return

    // Send typing indicator
    socket.emit("typing_start", {
      roomId: currentRoom.id,
      userId: user.id,
      username: user.username,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    //@ts-ignore
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        roomId: currentRoom.id,
        userId: user.id,
      })
    }, 1000)
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col">
        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user.username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="text-white font-medium">{user.username}</div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
                  <span className="text-xs text-gray-300">{isConnected ? "Online" : "Offline"}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-hidden">
          <RoomList rooms={rooms} currentRoom={currentRoom} onSelectRoom={selectRoom} onRefresh={loadRooms} />
        </div>

        {/* Online Users */}
        <div className="border-t border-white/10">
          <UserList users={onlineUsers} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <Hash className="h-5 w-5 text-cyan-400" />
                <div>
                  <h2 className="text-white font-semibold">{currentRoom.name}</h2>
                  {currentRoom.description && <p className="text-gray-300 text-sm">{currentRoom.description}</p>}
                </div>
                <Badge variant="secondary" className="ml-auto bg-white/10 text-white">
                  {currentRoom.participants?.length || 0} members
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} currentUser={user} typingUsers={typingUsers} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder={`Message #${currentRoom.name}`}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  disabled={!isConnected}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-300">
              <Hash className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">Welcome to ChatApp</h3>
              <p>Select a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
