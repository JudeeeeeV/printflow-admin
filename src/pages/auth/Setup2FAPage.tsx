import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';

export const Setup2FAPage = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const [token, setToken] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 // If navigated without state, redirect to login
 if (!location.state?.qrCodeUrl) {
 return <Navigate to="/login" replace />;
 }

 const { qrCodeUrl, secret } = location.state;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const tempToken = localStorage.getItem('admin_temp_token');
 const res = await axios.post(`${API_URL}/auth/setup-2fa`, { token }, {
 headers: { Authorization: `Bearer ${tempToken}` }
 });

 // Store full access token
 localStorage.setItem('admin_access_token', res.data.access_token);
 localStorage.removeItem('admin_temp_token');

 // Go to dashboard
 navigate('/');
 } catch (err: any) {
 setError(err.response?.data?.message || 'Verification failed. Please check the code.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="text-center">
 <h2 className="text-xl font-bold text-carbon-gray-100 mb-4">Set up Two-Factor Authentication</h2>
 <p className="text-sm text-gray-500 mb-6 font-medium">
 Scan this QR code with your Authenticator app (e.g. Google Authenticator, Authy).
 </p>

 <div className="flex justify-center mb-6">
 <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 border p-2 bg-white" />
 </div>

 <p className="text-xs text-gray-400 mb-6 font-mono bg-carbon-gray-10 p-2 ">
 Secret: {secret}
 </p>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <input
 type="text"
 placeholder="Enter 6-digit code"
 required
 value={token}
 onChange={(e) => setToken(e.target.value)}
 className="appearance-none block w-full px-3 py-3 border border-[#8d8d8d] placeholder-gray-400 focus:outline-none focus:outline-carbon-blue-60 focus:border-black sm:text-sm text-center tracking-widest font-mono text-lg"
 maxLength={6}
 />
 </div>

 {error && (
 <div className="text-carbon-gray-100 text-sm font-bold bg-gray-100 p-2 border border-gray-300">
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={loading || token.length < 6}
 className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-black text-white bg-carbon-blue-60 hover:bg-carbon-blue-70 focus:outline-none focus:outline focus:outline-2 focus:-outline-offset-2 focus:ring-offset-2 focus:outline-carbon-blue-60 transition-colors disabled:opacity-50"
 >
 {loading ? 'Verifying...' : 'Verify and Complete Setup'}
 </button>
 </form>
 </div>
 );
};
