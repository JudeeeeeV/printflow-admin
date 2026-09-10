import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CheckCircle2, XCircle, ChevronRight, FileText } from 'lucide-react';

const API_URL = 'https://printflow-backend-wen3.onrender.com/admin';

export const DashboardPage = () => {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState<any | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const token = localStorage.getItem('admin_access_token');

    const fetchShops = async () => {
        try {
            const res = await axios.get(`${API_URL}/shops/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShops(res.data);
        } catch (err) {
            console.error('Failed to fetch pending shops', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
        if (status === 'REJECTED' && !rejectReason) {
            setShowRejectInput(true);
            return;
        }

        setIsVerifying(true);
        try {
            await axios.post(`${API_URL}/shops/${selectedShop.id}/verify`, { status, reason: rejectReason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Remove shop from list
            setShops(prev => prev.filter(s => s.id !== selectedShop.id));
            setSelectedShop(null);
            setRejectReason('');
            setShowRejectInput(false);
        } catch (err) {
            alert('Failed to process verification request');
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading requests..." />;

    return (
        <div className="flex h-full relative">
            {/* Main Queue List */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Verification Requests</h2>
                    <p className="text-gray-500 font-medium mb-8">Review print shops waiting for business permit verification.</p>

                    {shops.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">You're all caught up!</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {shops
                                        .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                                        .map((shop, i) => (
                                        <motion.div
                                            key={shop.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedShop(shop)}
                                            className={`bg-white border p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between ${
                                                selectedShop?.id === shop.id ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900">{shop.name}</h3>
                                                <p className="text-sm text-gray-500 font-medium mt-1">
                                                    Submitted: {new Date(shop.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                {shop.ai_suggestion && (
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        shop.ai_suggestion === 'ACCEPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        AI: {shop.ai_suggestion}
                                                    </div>
                                                )}
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            {/* Pagination */}
                            {Math.ceil(shops.length / PAGE_SIZE) > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-xs font-medium text-gray-500">Page {currentPage} of {Math.ceil(shops.length / PAGE_SIZE)} · {shops.length} total</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >Prev</button>
                                        {Array.from({ length: Math.ceil(shops.length / PAGE_SIZE) }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-gray-900 text-white border-gray-900'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >{page}</button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(shops.length / PAGE_SIZE), p + 1))}
                                            disabled={currentPage === Math.ceil(shops.length / PAGE_SIZE)}
                                            className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >Next</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Slide-over Review Panel */}
            <AnimatePresence>
                {selectedShop && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedShop(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                        />
                        <motion.div
                            initial={{ x: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0)' }}
                            animate={{ x: 0, boxShadow: '-20px 0 40px rgba(0,0,0,0.1)' }}
                            exit={{ x: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0)' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-40 overflow-y-auto flex flex-col border-l border-gray-200"
                        >
                            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">{selectedShop.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">Verification Review</p>
                                </div>
                                <button onClick={() => setSelectedShop(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 flex-1 space-y-8">
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 flex items-center mb-4">
                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                        Business Permit
                                    </h4>
                                    {selectedShop.business_permit_url ? (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 relative aspect-[3/4]">
                                            {/* Ideally use an iframe or PDF viewer here if it's a PDF */}
                                            <embed src={selectedShop.business_permit_url} className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                                            <p className="text-sm text-gray-500 italic">No document uploaded.</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 mb-2">Agentic AI Analysis</h4>
                                    <div className={`p-4 rounded-lg border shadow-inner ${
                                        selectedShop.ai_suggestion === 'ACCEPT' ? 'bg-green-50 border-green-200' : 
                                        selectedShop.ai_suggestion === 'DENY' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                            {selectedShop.ai_reasoning || 'No AI reasoning provided yet.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 bg-gray-50 mt-auto">
                                <button
                                    onClick={() => handleVerify('VERIFIED')}
                                    disabled={isVerifying}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-md shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 mb-4"
                                >
                                    Approve Shop
                                </button>

                                <AnimatePresence>
                                    {showRejectInput && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mb-4"
                                        >
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Rejection Reason</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm"
                                                rows={3}
                                                placeholder="Explain why the permit is rejected..."
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={() => handleVerify('REJECTED')}
                                    disabled={isVerifying}
                                    className="w-full py-3 bg-white hover:bg-red-50 text-red-600 font-bold border-2 border-red-200 hover:border-red-600 transition-colors disabled:opacity-50 rounded-md"
                                >
                                    {showRejectInput ? 'Confirm Rejection' : 'Reject Shop'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
