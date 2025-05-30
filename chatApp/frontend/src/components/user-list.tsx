import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Circle } from "lucide-react"

interface UserListProps {
  users: any[]
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Users className="h-4 w-4 text-gray-300" />
        <span className="text-sm font-medium text-gray-300">Online Users</span>
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
          {users.length}
        </Badge>
      </div>

      <ScrollArea className="h-32">
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{user.username}</div>
              </div>

              <div className="flex items-center space-x-1">
                <Circle className={`h-2 w-2 ${user.isOnline ? "text-green-400 fill-current" : "text-gray-500"}`} />
              </div>
            </div>
          ))}

          {users.length === 0 && <div className="text-center text-gray-500 text-sm py-4">No users online</div>}
        </div>
      </ScrollArea>
    </div>
  )
}
