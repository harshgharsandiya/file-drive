import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { verifyOtp, resendOtp } from '../../services/auth.service'
import toast from 'react-hot-toast'

export default function VerifyOtp() {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const { loginUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const userId = location.state?.userId
    const email = location.state?.email

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">
                    Invalid access. Please register first.
                </p>
            </div>
        )
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await verifyOtp({ userId, otp })
            loginUser(data.data.accessToken, { id: userId })
            toast.success('Email verified!')
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        try {
            await resendOtp({ email })
            toast.success('OTP resent to your email')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Verify Email
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Enter the 6-digit code sent to <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-5">
                    <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="000000"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <button
                    onClick={handleResend}
                    className="w-full mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                    Resend OTP
                </button>
            </div>
        </div>
    )
}
