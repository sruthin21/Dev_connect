import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem("chatUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (userData:any) => {
    setUser(userData)
    localStorage.setItem("chatUser", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("chatUser")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center chat-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen chat-gradient">
      {user ? <ChatInterface user={user} onLogout={handleLogout} /> : <LoginForm onLogin={handleLogin} />}
    </div>
  )
}

