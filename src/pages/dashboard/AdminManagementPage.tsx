import React, { useState } from 'react';
import axios from 'axios';
import { UserFollow } from '@carbon/icons-react';
import { motion } from 'framer-motion';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';

export const AdminManagementPage = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState('');
 const [error, setError] = useState('');

 const handleAddAdmin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setMessage('');
 setError('');

 try {
 await axios.post(`${API_URL}/add`, { email, password });
 setMessage('Admin added successfully! They must set up 2FA on their first login.');
 setEmail('');
 setPassword('');
 } catch (err: unknown) {
 const requestError = err as { response?: { data?: { message?: string } } };
 setError(requestError.response?.data?.message || 'Failed to add admin');
 } finally {
 setLoading(false);
 }
 };

 return (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-8 h-full overflow-y-auto"
 >
 <div className="max-w-2xl">
 <h2 className="text-3xl font-black text-carbon-gray-100 mb-2">Admin Management</h2>
 <p className="text-gray-500 font-medium mb-8">Add new administrators to the PrintFlow platform.</p>

 <div className="bg-white border border-[#e0e0e0] p-6">
 <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
 <div className="bg-gray-200 p-2 mr-4 text-carbon-gray-100">
 <UserFollow className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-carbon-gray-100">Add New Admin</h3>
 <p className="text-sm text-gray-500">Create a new admin account with a temporary password.</p>
 </div>
 </div>

 <form onSubmit={handleAddAdmin} className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full px-4 py-3 border border-[#8d8d8d] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-carbon-blue-60 focus:border-black font-medium transition-"
 placeholder="admin@example.com"
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Temporary Password</label>
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full px-4 py-3 border border-[#8d8d8d] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-carbon-blue-60 focus:border-black font-medium transition-"
 placeholder="Minimum 8 characters"
 minLength={8}
 />
 <p className="text-xs text-gray-500 mt-2">The new admin will use this to login and immediately set up their 2FA.</p>
 </div>

 {error && <div className="text-carbon-gray-100 text-sm font-bold bg-gray-100 p-3 border border-gray-300">{error}</div>}
 {message && <div className="text-green-600 text-sm font-bold bg-green-50 p-3 border border-green-100">{message}</div>}

 <button
 type="submit"
 disabled={loading}
 className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black text-white bg-carbon-blue-60 hover:bg-carbon-blue-70 focus:outline-none focus:outline focus:outline-2 focus:-outline-offset-2 focus:ring-offset-2 focus:outline-carbon-blue-60 transition-colors disabled:opacity-50"
 >
 {loading ? 'Creating...' : 'Create Admin Account'}
 </button>
 </form>
 </div>
 </div>
 </motion.div>
 );
};
