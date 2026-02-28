import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'

// Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'

// Pages
import Drive from './pages/drive/Drive'
import Trash from './pages/trash/Trash'
import Search from './pages/search/Search'
import SharedWithMe from './pages/shared/SharedWithMe'
import SharedByMe from './pages/shared/SharedByMe'
import SharedLink from './pages/shared/SharedLink'
import Activity from './pages/activity/Activity'
import Starred from './pages/starred/Starred'
import Recent from './pages/recent/Recent'
import Notifications from './pages/notifications/Notifications'
import Profile from './pages/profile/Profile'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route
                        path="/shared/link/:token"
                        element={<SharedLink />}
                    />

                    {/* Protected routes */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Drive />} />
                        <Route path="folder/:folderId" element={<Drive />} />
                        <Route path="starred" element={<Starred />} />
                        <Route path="recent" element={<Recent />} />
                        <Route path="shared" element={<SharedWithMe />} />
                        <Route path="shared/by-me" element={<SharedByMe />} />
                        <Route path="trash" element={<Trash />} />
                        <Route path="search" element={<Search />} />
                        <Route path="activity" element={<Activity />} />
                        <Route
                            path="notifications"
                            element={<Notifications />}
                        />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster position="bottom-right" />
        </AuthProvider>
    )
}
