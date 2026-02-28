import api from './api'

export const login = (data) => api.post('/users/login', data)
export const register = (data) => api.post('/users/register', data)
export const verifyOtp = (data) => api.post('/users/verify-otp', data)
export const resendOtp = (data) => api.post('/users/resend-otp', data)
export const logout = () => api.post('/users/logout')
