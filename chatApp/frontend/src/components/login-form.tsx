import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, User, Mail } from "lucide-react"

const API_BASE_URL = "http://localhost:3001"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const email = formData.get("email") as string

    try {
      // Check if user exists first
      const usersResponse = await fetch(`${API_BASE_URL}/api/users`)
      const users = await usersResponse.json()

      let user = users.find((u: any) => u.username === username || u.email === email)

      if (!user) {
        // Create new user if doesn't exist
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email }),
        })

        if (!response.ok) {
          throw new Error("Failed to create user")
        }

        user = await response.json()
      }

      onLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (username: string, email: string) => {
    setIsLoading(true)
    setError("")

    try {
      const usersResponse = await fetch(`${API_BASE_URL}/api/users`)
      const users = await usersResponse.json()

      let user = users.find((u: any) => u.username === username)

      if (!user) {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email }),
        })

        if (!response.ok) {
          throw new Error("Failed to create user")
        }

        user = await response.json()
      }

      onLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MessageCircle className="h-12 w-12 text-cyan-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome to ChatApp</CardTitle>
          <CardDescription className="text-gray-300">Join the conversation and connect with others</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">
                Login
              </TabsTrigger>
              <TabsTrigger value="quick" className="text-white data-[state=active]:bg-white/20">
                Quick Start
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Enter your username"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login / Sign Up"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4">
              <div className="text-center text-gray-300 text-sm mb-4">Quick login with demo accounts</div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleQuickLogin("alice", "alice@example.com")}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  disabled={isLoading}
                >
                  Login as Alice
                </Button>

                <Button
                  onClick={() => handleQuickLogin("bob", "bob@example.com")}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isLoading}
                >
                  Login as Bob
                </Button>

                <Button
                  onClick={() => handleQuickLogin("charlie", "charlie@example.com")}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  disabled={isLoading}
                >
                  Login as Charlie
                </Button>
              </div>

              {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
