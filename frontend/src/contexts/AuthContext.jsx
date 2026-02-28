import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be inside AuthProvider')
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    const loginUser = (accessToken, userData) => {
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
        setToken(accessToken)
        setUser(userData)
    }

    const logoutUser = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    const isAuthenticated = !!token

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated,
                loginUser,
                logoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
