import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface MessageListProps {
  messages: any[]
  currentUser: any
  typingUsers: any[]
}

export function MessageList({ messages, currentUser, typingUsers }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, typingUsers])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMessageColor = (messageType: string) => {
    switch (messageType) {
      case "SYSTEM":
        return "text-yellow-400"
      default:
        return "text-white"
    }
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender.id === currentUser.id
          const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id
          const isSystem = message.messageType === "SYSTEM"

          if (isSystem) {
            return (
              <div key={message.id} className="flex justify-center">
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {message.content}
                </Badge>
              </div>
            )
          }

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${showAvatar ? "mt-4" : "mt-1"}`}
            >
              <div className={`flex max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                {showAvatar && !isCurrentUser && (
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`${isCurrentUser ? "mr-3" : showAvatar ? "" : "ml-11"}`}>
                  {showAvatar && (
                    <div
                      className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-sm font-medium text-gray-300">{message.sender.username}</span>
                      <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isCurrentUser ? "bg-cyan-500 text-white" : "bg-white/10 backdrop-blur-sm text-white"
                    } ${getMessageColor(message.messageType)}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>

                  {!showAvatar && (
                    <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                      {formatTime(message.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-300">
                {typingUsers.map((u) => u.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
