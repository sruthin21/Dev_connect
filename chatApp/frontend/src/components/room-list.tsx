import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Hash, Plus, RefreshCw, Users } from "lucide-react"

const API_BASE_URL = "http://localhost:3001"

interface RoomListProps {
  rooms: any[]
  currentRoom: any
  onSelectRoom: (room: any) => void
  onRefresh: () => void
}

export function RoomList({ rooms, currentRoom, onSelectRoom, onRefresh }: RoomListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const user = JSON.parse(localStorage.getItem("chatUser") || "{}")

      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDescription,
          createdById: user.id,
        }),
      })

      if (response.ok) {
        setNewRoomName("")
        setNewRoomDescription("")
        setIsDialogOpen(false)
        onRefresh()
      }
    } catch (error) {
      console.error("Failed to create room:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Rooms</h3>
          <div className="flex space-x-1">
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Room</DialogTitle>
                </DialogHeader>
                <form onSubmit={createRoom} className="space-y-4">
                  <div>
                    <Label htmlFor="roomName" className="text-white">
                      Room Name
                    </Label>
                    <Input
                      id="roomName"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomDescription" className="text-white">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="roomDescription"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Enter room description"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreating || !newRoomName.trim()}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {rooms.map((room) => (
            <Button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              variant="ghost"
              className={`w-full justify-start text-left h-auto p-3 ${
                currentRoom?.id === room.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-start space-x-3 w-full">
                <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{room.name}</div>
                  {room.description && <div className="text-xs opacity-70 truncate">{room.description}</div>}
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{room.participants?.length || 0}</span>
                    </div>
                    {room.messages?.[0] && (
                      <div className="text-xs opacity-50 truncate">
                        {room.messages[0].sender.username}: {room.messages[0].content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
