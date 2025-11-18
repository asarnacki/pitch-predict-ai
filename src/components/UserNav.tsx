import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus, LogOut, User as UserIcon, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface UserNavProps {
  user: User | null
}

export function UserNav({ user }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      toast.success('Wylogowano pomyślnie')
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      toast.error('Nie udało się wylogować. Spróbuj ponownie.')
      setIsLoggingOut(false)
    }
  }

  // If user is not logged in, show login and register buttons
  if (!user) {
    return (
      <nav className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm"
        >
          <a href="/login">
            <LogIn className="sm:mr-2 size-4" />
            <span className="hidden sm:inline">Zaloguj się</span>
          </a>
        </Button>
        <Button
          variant="default"
          size="sm"
          asChild
          className="text-xs sm:text-sm"
        >
          <a href="/register">
            <UserPlus className="sm:mr-2 size-4" />
            <span className="hidden sm:inline">Zarejestruj się</span>
          </a>
        </Button>
      </nav>
    )
  }

  // If user is logged in, show user info, predictions link, and logout button
  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs sm:text-sm"
      >
        <a href="/predictions">
          <Bookmark className="sm:mr-2 size-4" />
          <span className="hidden sm:inline">Zapisane</span>
        </a>
      </Button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-md">
        <UserIcon className="size-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">
          {user.email}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-xs sm:text-sm"
      >
        <LogOut className="sm:mr-2 size-4" />
        <span className="hidden sm:inline">
          {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
        </span>
      </Button>
    </nav>
  )
}
