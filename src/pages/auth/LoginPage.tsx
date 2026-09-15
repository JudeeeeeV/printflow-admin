import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';

export const LoginPage = () => {
 const navigate = useNavigate();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const res = await axios.post(`${API_URL}/auth/login`, { email, password });
 const { requires_setup, requires_2fa, temp_token, qr_code_url, secret } = res.data;

 // Store temp token
 localStorage.setItem('admin_temp_token', temp_token);

 if (requires_setup) {
 // Pass QR code data to setup page
 navigate('/setup-2fa', { state: { qrCodeUrl: qr_code_url, secret } });
 } else if (requires_2fa) {
 navigate('/verify-2fa');
 }
 } catch (err: unknown) {
 const error = err as { response?: { data?: { message?: string } } };
 setError(error.response?.data?.message || 'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div>
 <form className="space-y-6" onSubmit={handleSubmit}>
 <div>
 <label className="block text-sm font-bold text-gray-700">Email address</label>
 <div className="mt-1">
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="appearance-none block w-full px-3 py-2 border border-[#8d8d8d] placeholder-gray-400 focus:outline-none focus:outline-carbon-blue-60 focus:border-black sm:text-sm font-medium"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700">Password</label>
 <div className="mt-1">
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="appearance-none block w-full px-3 py-2 border border-[#8d8d8d] placeholder-gray-400 focus:outline-none focus:outline-carbon-blue-60 focus:border-black sm:text-sm font-medium"
 />
 </div>
 </div>

 {error && (
 <div className="text-carbon-gray-100 text-sm font-bold bg-gray-100 p-3 border border-gray-300">
 {error}
 </div>
 )}

 <div>
 <button
 type="submit"
 disabled={loading}
 className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-black text-white bg-carbon-gray-100 hover:bg-black focus:outline-none focus:outline focus:outline-2 focus:-outline-offset-2 focus:ring-offset-2 focus:outline-carbon-gray-100 transition-colors"
 >
 {loading ? 'Authenticating...' : 'Sign in'}
 </button>
 </div>
 </form>
 </div>
 );
};
