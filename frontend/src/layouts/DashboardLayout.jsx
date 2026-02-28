import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOffline } from '../contexts/OfflineContext'
import { getUnreadCount, getStorageBreakdown } from '../services/drive.service'
import { formatFileSize } from '../utils/fileIcons'
import {
    HiOutlineHome,
    HiOutlineShare,
    HiOutlineTrash,
    HiOutlineClock,
    HiOutlineSearch,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineStar,
    HiOutlineBell,
    HiOutlineUser,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineRefresh,
    HiOutlineWifi,
} from 'react-icons/hi'

const navItems = [
    { path: '/', icon: HiOutlineHome, label: 'My Drive' },
    { path: '/starred', icon: HiOutlineStar, label: 'Starred' },
    { path: '/recent', icon: HiOutlineClock, label: 'Recent' },
    { path: '/shared', icon: HiOutlineShare, label: 'Shared with me' },
    { path: '/trash', icon: HiOutlineTrash, label: 'Trash' },
    { path: '/activity', icon: HiOutlineClock, label: 'Activity' },
]

export default function DashboardLayout() {
    const { user, logoutUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const searchRef = useRef(null)
    const { isOnline, pendingCount, isSyncing, drain } = useOffline()
    const [sidebarOpen, setSidebarOpen] = useState(false) // mobile slide-in
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // desktop collapse
    const [searchQuery, setSearchQuery] = useState('')
    const [unreadCount, setUnreadCount] = useState(0)
    const [storageUsed, setStorageUsed] = useState(0)
    const [storageLimit, setStorageLimit] = useState(20 * 1024 * 1024)

    useEffect(() => {
        fetchUnreadCount()
        fetchStorage()
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        fetchStorage()
    }, [location.pathname])

    const fetchUnreadCount = async () => {
        try {
            const { data } = await getUnreadCount()
            setUnreadCount(data.data?.count || 0)
        } catch {
            // ignore
        }
    }

    const fetchStorage = async () => {
        try {
            const { data } = await getStorageBreakdown()
            setStorageUsed(data.data?.storageUsed ?? 0)
            setStorageLimit(data.data?.storageLimit || 20 * 1024 * 1024)
        } catch {
            // ignore
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const handleLogout = () => {
        logoutUser()
        navigate('/login')
    }

    // Keyboard shortcut: / or Ctrl+K → focus search
    useEffect(() => {
        const onKey = (e) => {
            const el = document.activeElement
            const inInput =
                el?.tagName === 'INPUT' ||
                el?.tagName === 'TEXTAREA' ||
                el?.isContentEditable
            if (inInput) return
            if (
                e.key === '/' ||
                ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
            ) {
                e.preventDefault()
                searchRef.current?.focus()
                searchRef.current?.select()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const storagePercent = Math.min(100, (storageUsed / storageLimit) * 100)

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 bg-white border-r border-gray-200
                    transform transition-all duration-200 ease-in-out flex flex-col
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
            >
                {/* Logo + collapse button */}
                <div
                    className={`flex items-center border-b border-gray-100 h-14
                    ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}
                >
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-sm">
                                    FD
                                </span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                FileDrive
                            </span>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                FD
                            </span>
                        </div>
                    )}
                    {/* Collapse toggle — desktop only */}
                    <button
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        className={`hidden lg:flex p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer
                            ${sidebarCollapsed ? 'absolute right-0 top-3 translate-x-1/2 bg-white border border-gray-200 shadow-sm z-40' : ''}`}
                        title={
                            sidebarCollapsed
                                ? 'Expand sidebar'
                                : 'Collapse sidebar'
                        }
                    >
                        {sidebarCollapsed ? (
                            <HiOutlineChevronRight className="w-4 h-4" />
                        ) : (
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1 overflow-auto">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            onClick={() => setSidebarOpen(false)}
                            title={sidebarCollapsed ? label : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                                ${sidebarCollapsed ? 'justify-center' : ''}
                                ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!sidebarCollapsed && label}
                        </NavLink>
                    ))}
                </nav>

                {/* Storage usage */}
                {!sidebarCollapsed && (
                    <div className="px-4 py-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>Storage</span>
                            <span>
                                {formatFileSize(storageUsed)} /{' '}
                                {formatFileSize(storageLimit)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all ${
                                    storagePercent > 90
                                        ? 'bg-red-500'
                                        : storagePercent > 70
                                          ? 'bg-yellow-500'
                                          : 'bg-blue-600'
                                }`}
                                style={{ width: `${storagePercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* User section */}
                <div className="border-t border-gray-200 p-3">
                    {sidebarCollapsed ? (
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition"
                                title={user?.name || 'Profile'}
                            >
                                <span className="text-blue-700 font-semibold text-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() ||
                                        'U'}
                                </span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                                title="Logout"
                            >
                                <HiOutlineLogout className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition shrink-0"
                            >
                                <span className="text-blue-700 font-semibold text-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() ||
                                        'U'}
                                </span>
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                                title="Logout"
                            >
                                <HiOutlineLogout className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                    {/* Mobile burger */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer shrink-0"
                    >
                        <HiOutlineMenu className="w-5 h-5" />
                    </button>

                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.currentTarget.blur()
                                        setSearchQuery('')
                                    }
                                }}
                                placeholder="Search files and folders..."
                                className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-transparent rounded-lg
                                    focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none transition"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-gray-400 border border-gray-300 rounded px-1 py-px pointer-events-none hidden sm:block">
                                /
                            </kbd>
                        </div>
                    </form>

                    {/* Notification bell */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer transition shrink-0"
                        title="Notifications"
                    >
                        <HiOutlineBell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Profile */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer transition shrink-0"
                        title="Profile"
                    >
                        <HiOutlineUser className="w-5 h-5" />
                    </button>
                </header>

                {/* Offline banner */}
                {!isOnline && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-100 text-sm">
                        <HiOutlineWifi className="w-4 h-4 shrink-0 opacity-60" />
                        <span className="flex-1">
                            You&apos;re <strong>offline</strong>. File uploads are paused. Other changes will be queued and synced automatically when you reconnect.
                        </span>
                        {pendingCount > 0 && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-600 text-xs font-semibold">
                                {pendingCount} queued
                            </span>
                        )}
                    </div>
                )}

                {/* Syncing banner */}
                {isOnline && (isSyncing || pendingCount > 0) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm">
                        <HiOutlineRefresh
                            className={`w-4 h-4 shrink-0 ${
                                isSyncing ? 'animate-spin' : ''
                            }`}
                        />
                        <span className="flex-1">
                            {isSyncing
                                ? `Syncing ${pendingCount} queued operation${pendingCount !== 1 ? 's' : ''}…`
                                : `${pendingCount} operation${pendingCount !== 1 ? 's' : ''} pending sync.`}
                        </span>
                        {!isSyncing && (
                            <button
                                onClick={drain}
                                className="shrink-0 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-semibold transition cursor-pointer"
                            >
                                Sync now
                            </button>
                        )}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
