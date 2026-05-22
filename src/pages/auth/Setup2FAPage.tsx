import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000/admin';

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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Set up Two-Factor Authentication</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">
                Scan this QR code with your Authenticator app (e.g. Google Authenticator, Authy).
            </p>

            <div className="flex justify-center mb-6">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 border rounded p-2 bg-white" />
            </div>

            <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-2 rounded">
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
                        className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm text-center tracking-widest font-mono text-lg"
                        maxLength={6}
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || token.length < 6}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-black text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
                >
                    {loading ? 'Verifying...' : 'Verify and Complete Setup'}
                </button>
            </form>
        </div>
    );
};
