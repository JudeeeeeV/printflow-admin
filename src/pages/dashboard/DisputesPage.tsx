import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from '../../components/common/TableSkeleton';

const API_URL = 'https://printflow-backend-wen3.onrender.com/admin';

export const DisputesPage = () => {
 const [disputes, setDisputes] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');
 const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const PAGE_SIZE = 10;

 const fetchDisputes = async () => {
 setIsLoading(true);
 try {
 const token = localStorage.getItem('admin_access_token');
 const res = await axios.get(`${API_URL}/disputes`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 setDisputes(res.data);
 } catch (err: any) {
 setError(err.response?.data?.message || 'Failed to fetch disputes');
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchDisputes();
 }, []);

 const handleAction = async (orderId: string, action: 'force-approve' | 'uphold-rejection') => {
 setIsActionLoading(true);
 try {
 const token = localStorage.getItem('admin_access_token');
 await axios.post(`${API_URL}/orders/${orderId}/${action}`, {}, {
 headers: { Authorization: `Bearer ${token}` }
 });
 alert('Action completed successfully.');
 setSelectedDispute(null);
 fetchDisputes();
 } catch (err: any) {
 alert(err.response?.data?.message || 'Action failed.');
 } finally {
 setIsActionLoading(false);
 }
 };

 if (isLoading) {
 return <TableSkeleton columns={5} rows={5} />;
 }

 if (error) {
 return <div className="p-8 font-sans font-bold text-carbon-gray-100">{error}</div>;
 }

 return (
 <div className="h-full flex flex-col font-sans">
 <div className="bg-white border-b border-[#e0e0e0] px-8 py-6 shrink-0 z-10">
 <h1 className="text-3xl font-black text-carbon-gray-100 tracking-tight">Payment Disputes</h1>
 <p className="text-sm font-medium text-gray-500 mt-1">Review escalated payments and make binding decisions.</p>
 </div>

 <div className="flex-1 overflow-y-auto p-8 bg-carbon-gray-10">
 {disputes.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
 <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 <h2 className="text-xl font-bold text-carbon-gray-100 mb-2">No active disputes</h2>
 <p className="text-gray-500 font-medium">All escalated payment issues have been resolved.</p>
 </div>
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {disputes
 .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
 .map(dispute => (
 <div key={dispute.id} className="bg-white border border-[#e0e0e0] p-6 flex flex-col hover: transition-">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-black text-carbon-gray-100 text-lg">Order #{String(dispute.id).slice(0, 8)}</h3>
 <p className="text-xs text-gray-500 font-bold">{dispute.shops?.name}</p>
 </div>
 <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
 ESCALATED
 </span>
 </div>
 <div className="space-y-2 mb-6 flex-1">
 <div className="flex justify-between text-sm">
 <span className="text-gray-500 font-medium">Total:</span>
 <span className="font-bold text-carbon-gray-100">₱{dispute.total}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-gray-500 font-medium">Escalated On:</span>
 <span className="font-semibold text-gray-700">{new Date(dispute.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 <button 
 onClick={() => setSelectedDispute(dispute)}
 className="w-full py-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white font-bold text-sm transition-colors"
 >
 Review Case
 </button>
 </div>
 ))}
 </div>
 {/* Pagination */}
 {Math.ceil(disputes.length / PAGE_SIZE) > 1 && (
 <div className="flex items-center justify-between mt-6">
 <span className="text-xs font-medium text-gray-500">Page {currentPage} of {Math.ceil(disputes.length / PAGE_SIZE)} · {disputes.length} total</span>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3 py-1.5 text-xs font-bold border border-[#8d8d8d] bg-white text-gray-700 hover:bg-carbon-gray-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >Prev</button>
 {Array.from({ length: Math.ceil(disputes.length / PAGE_SIZE) }, (_, i) => i + 1).map(page => (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
 currentPage === page
 ? 'bg-gray-900 text-white border-gray-900'
 : 'bg-white text-gray-700 border-[#8d8d8d] hover:bg-carbon-gray-10'
 }`}
 >{page}</button>
 ))}
 <button
 onClick={() => setCurrentPage(p => Math.min(Math.ceil(disputes.length / PAGE_SIZE), p + 1))}
 disabled={currentPage === Math.ceil(disputes.length / PAGE_SIZE)}
 className="px-3 py-1.5 text-xs font-bold border border-[#8d8d8d] bg-white text-gray-700 hover:bg-carbon-gray-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >Next</button>
 </div>
 </div>
 )}
 </>
 )}
 </div>

 {/* Modal */}
 <AnimatePresence>
 {selectedDispute && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedDispute(null)}
 className="absolute inset-0 bg-carbon-blue-100/40 backdrop-blur-sm"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="relative w-full max-w-4xl bg-white flex flex-col max-h-[90vh] z-10"
 >
 <div className="flex justify-between items-center p-6 border-b border-[#e0e0e0] shrink-0">
 <div>
 <h3 className="text-2xl font-black text-carbon-gray-100">Dispute Review</h3>
 <p className="text-sm font-medium text-gray-500">Order #{selectedDispute.id}</p>
 </div>
 <button onClick={() => setSelectedDispute(null)} className="p-2 text-gray-400 hover:text-carbon-gray-100 transition-colors hover:bg-gray-100">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
 <div className="flex-1 space-y-6">
 <div>
 <h4 className="font-bold text-carbon-gray-100 border-b border-[#e0e0e0] pb-2 mb-3">Shop's Rejection Reason</h4>
 <div className="bg-gray-100 border border-gray-300 p-4 text-carbon-gray-100 font-medium text-sm">
 {selectedDispute.shop_rejection_reason || 'No reason provided by shop.'}
 </div>
 </div>
 <div>
 <h4 className="font-bold text-carbon-gray-100 border-b border-[#e0e0e0] pb-2 mb-3">Student's Dispute Explanation</h4>
 <div className="bg-blue-50 border border-blue-100 p-4 text-blue-800 font-medium text-sm">
 {selectedDispute.dispute_reason || 'No explanation provided by student.'}
 </div>
 </div>
 <div>
 <h4 className="font-bold text-carbon-gray-100 border-b border-[#e0e0e0] pb-2 mb-3">Order Details</h4>
 <div className="bg-carbon-gray-10 p-4 text-sm space-y-2 font-medium text-gray-700 border border-[#e0e0e0]">
 <p><strong>Shop:</strong> {selectedDispute.shops?.name}</p>
 <p><strong>Amount Due:</strong> ₱{selectedDispute.total}</p>
 <p><strong>Ref Number:</strong> {(Array.isArray(selectedDispute.payment_receipts) ? selectedDispute.payment_receipts[0] : selectedDispute.payment_receipts)?.reference_number || 'N/A'}</p>
 </div>
 </div>
 </div>
 
 <div className="flex-1 flex flex-col">
 <h4 className="font-bold text-carbon-gray-100 border-b border-[#e0e0e0] pb-2 mb-3">Uploaded Receipt</h4>
 <div className="flex-1 border border-[#e0e0e0] bg-carbon-gray-10 flex items-center justify-center p-2 min-h-[300px]">
 {(Array.isArray(selectedDispute.payment_receipts) ? selectedDispute.payment_receipts[0] : selectedDispute.payment_receipts)?.receipt_url ? (
 <img 
 src={(Array.isArray(selectedDispute.payment_receipts) ? selectedDispute.payment_receipts[0] : selectedDispute.payment_receipts).receipt_url} 
 alt="Receipt" 
 className="max-w-full max-h-full object-contain"
 />
 ) : (
 <span className="text-gray-400 font-medium text-sm italic">No receipt image found</span>
 )}
 </div>
 </div>
 </div>

 <div className="p-6 border-t border-[#e0e0e0] bg-carbon-gray-10 shrink-0 flex justify-end space-x-4">
 <button
 onClick={() => handleAction(selectedDispute.id, 'uphold-rejection')}
 disabled={isActionLoading}
 className="px-6 py-3 font-bold text-carbon-gray-100 bg-white border border-gray-300 hover:bg-gray-100 hover:border-carbon-gray-100 transition-colors disabled:opacity-50"
 >
 Uphold Rejection
 </button>
 <button
 onClick={() => handleAction(selectedDispute.id, 'force-approve')}
 disabled={isActionLoading}
 className="px-6 py-3 font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
 >
 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
 Force Approve Payment
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};
