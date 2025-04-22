"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/* ---------- Types ------------------------------------------------------ */
type User = {
  id: string            // <-- Supabase UUID
  email: string
  name?: string | null
}

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

/* ---------- Provider --------------------------------------------------- */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  /* Restore saved session */
  useEffect(() => {
    const stored = localStorage.getItem("trackit_user")
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  /* Redirect logic */
  useEffect(() => {
    if (loading) return
    const publicRoutes = ["/", "/login", "/signup"]
    const isPublic = publicRoutes.includes(pathname)

    if (!user && !isPublic) router.push("/login")
    if (user && isPublic) router.push("/dashboard")
  }, [user, loading, pathname, router])

  /* ---------------- API helpers ---------------- */
  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error("Login failed")
      const data: User = await res.json()
      setUser(data)
      localStorage.setItem("trackit_user", JSON.stringify(data))
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) throw new Error("Signup failed")
      const data: User = await res.json()
      setUser(data)
      localStorage.setItem("trackit_user", JSON.stringify(data))
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("trackit_user")
    router.push("/login")
  }

  /* ------------------------------------------------ */
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ---------- Hook ------------------------------------------------------- */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
