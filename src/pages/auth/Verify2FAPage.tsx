import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000/admin';

export const Verify2FAPage = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const tempToken = React.useRef(localStorage.getItem('admin_temp_token')).current;
    
    if (!tempToken) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/verify-2fa`, { token }, {
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Two-Factor Authentication</h2>
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
                        className="appearance-none block w-full px-3 py-4 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm text-center tracking-[0.5em] font-mono text-2xl"
                        maxLength={6}
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || token.length < 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-black text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>
            </form>
        </div>
    );
};
