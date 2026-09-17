import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';

export const Verify2FAPage = () => {
 const navigate = useNavigate();
 const [token, setToken] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 await axios.post(`${API_URL}/auth/verify-2fa`, { token });
 // Go to dashboard
 navigate('/');
 } catch (err: unknown) {
 const requestError = err as { response?: { data?: { message?: string } } };
 setError(requestError.response?.data?.message || 'Verification failed. Please check the code.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="text-center">
 <h2 className="text-xl font-bold text-carbon-gray-100 mb-4">Two-Factor Authentication</h2>
 <p className="text-sm text-gray-500 mb-8 font-medium">
 Enter the 6-digit code from your Authenticator app.
 </p>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div>
 <input
 type="text"
 placeholder="000000"
 required
 value={token}
 onChange={(e) => setToken(e.target.value)}
 className="appearance-none block w-full px-3 py-4 border border-[#8d8d8d] placeholder-gray-400 focus:outline-none focus:outline-carbon-blue-60 focus:border-black sm:text-sm text-center tracking-[0.5em] font-mono text-2xl"
 maxLength={6}
 />
 </div>

 {error && (
 <div className="text-carbon-gray-100 text-sm font-bold bg-gray-100 p-3 border border-gray-300">
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={loading || token.length < 6}
 className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black text-white bg-carbon-blue-60 hover:bg-carbon-blue-70 focus:outline-none focus:outline focus:outline-2 focus:-outline-offset-2 focus:ring-offset-2 focus:outline-carbon-blue-60 transition-colors disabled:opacity-50"
 >
 {loading ? 'Verifying...' : 'Verify'}
 </button>
 </form>
 </div>
 );
};
