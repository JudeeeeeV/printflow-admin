import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = 'https://printflow-backend-wen3.onrender.com/admin';

export const AdminManagementPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('admin_access_token');

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await axios.post(`${API_URL}/add`, { email, password }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Admin added successfully! They must set up 2FA on their first login.');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add admin');
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
                <h2 className="text-3xl font-black text-gray-900 mb-2">Admin Management</h2>
                <p className="text-gray-500 font-medium mb-8">Add new administrators to the PrintFlow platform.</p>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
                        <div className="bg-red-100 p-2 rounded-full mr-4 text-red-600">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Add New Admin</h3>
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black font-medium transition-shadow"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black font-medium transition-shadow"
                                placeholder="Minimum 8 characters"
                                minLength={8}
                            />
                            <p className="text-xs text-gray-500 mt-2">The new admin will use this to login and immediately set up their 2FA.</p>
                        </div>

                        {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
                        {message && <div className="text-green-600 text-sm font-bold bg-green-50 p-3 rounded-md border border-green-100">{message}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-black text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Admin Account'}
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};
