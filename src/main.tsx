import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

axios.defaults.withCredentials = true
axios.interceptors.response.use(
 response => response,
 error => {
 const authenticationRoutes = ['/login', '/setup-2fa', '/verify-2fa']
 const isAuthRoute = authenticationRoutes.some(route => window.location.pathname.startsWith(route))
 if (
 error?.response?.status === 401 &&
 !isAuthRoute
 ) {
 window.dispatchEvent(new Event('printflow:admin-session-expired'))
 }
 return Promise.reject(error)
 },
)
createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <App />
 </StrictMode>,
)
