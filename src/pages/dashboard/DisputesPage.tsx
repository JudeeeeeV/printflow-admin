import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from '../../components/common/TableSkeleton';
import { AlertModal } from '../../components/common/AlertModal';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';
import { useDataEvents } from '../../hooks/useDataEvents';
import { cachedGet, invalidateAdminCache } from '../../services/cachedGet';

interface PaymentReceipt {
 id: string | number;
 reference_number?: string | null;
 receipt_url?: string | null;
}

interface Dispute {
 state: string;
 current_receipt_id?: string | null;
 acceptance_status?: string;
 payment_method?: string;
 payment_status?: string;
 id: string;
 total: number;
 created_at: string;
 shop_rejection_reason?: string | null;
 dispute_reason?: string | null;
 shops?: { name?: string | null } | null;
 payment_receipts?: PaymentReceipt[] | null;
}

const errorMessage = (error: unknown, fallback: string) => {
 if (axios.isAxiosError<{ message?: string }>(error)) {
 return error.response?.data?.message || fallback;
 }
 return error instanceof Error ? error.message : fallback;
};

export const DisputesPage = () => {
 const [disputes, setDisputes] = useState<Dispute[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');
 const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
 const selectedDispute = disputes.find(item => item.id === selectedDisputeId) ?? null;
 const selectedReceipt = selectedDispute?.payment_receipts?.find(receipt => String(receipt.id) === selectedDispute.current_receipt_id);
 // A renewed signed URL is still the same evidence. Financial/context changes
 // require a new confirmation, even if the image URL itself is unchanged.
 const evidenceKey = selectedDispute ? JSON.stringify([
  selectedDispute.id, selectedDispute.current_receipt_id, selectedReceipt?.reference_number,
  selectedDispute.total, selectedDispute.state, selectedDispute.payment_method,
  selectedDispute.payment_status, selectedDispute.acceptance_status,
 ]) : null;
 const imageKey = evidenceKey && selectedReceipt?.receipt_url
  ? JSON.stringify([evidenceKey, selectedReceipt.receipt_url]) : null;
 const setSelectedDispute = (item: Dispute | null) => setSelectedDisputeId(item?.id ?? null);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
 const PAGE_SIZE = 10;
 const [confirmedEvidence, setConfirmedEvidence] = useState<string | null>(null);
 const confirmed = evidenceKey !== null && confirmedEvidence === evidenceKey;
 const [reviewReason, setReviewReason] = useState('');
 const pending = useRef(false);
 const reviewDialog = useRef<HTMLDivElement>(null);
 const loaded = useRef(false);
 const refreshGeneration = useRef(0);
 const noticeOpen = useRef(false);
 noticeOpen.current = Boolean(notice);
 const [loadedImage, setLoadedImage] = useState<string | null>(null);
 const receiptImageLoaded = imageKey !== null && loadedImage === imageKey;
 const currentImageKey = useRef(imageKey);
 currentImageKey.current = imageKey;

 const fetchDisputes = useCallback(async () => {
  const generation = ++refreshGeneration.current;
  try {
   const latest = await cachedGet<Dispute[]>(`${API_URL}/disputes`);
   if (generation !== refreshGeneration.current) return;
   setDisputes(latest);
   setCurrentPage(page => Math.max(1, Math.min(page, Math.ceil(latest.length / 10) || 1)));
   setError('');
  } catch (requestError: unknown) {
   if (generation !== refreshGeneration.current) return;
   const message = errorMessage(requestError, 'Failed to fetch disputes');
   if (!loaded.current) setError(message);
   else setNotice(previous => previous ?? { title: 'Refresh failed', message });
  } finally {
   if (generation === refreshGeneration.current) {
    loaded.current = true;
    setIsLoading(false);
   }
  }
 }, []);

 useEffect(() => {
 const timer = window.setTimeout(() => void fetchDisputes(), 0);
 return () => { window.clearTimeout(timer); refreshGeneration.current++; };
 }, [fetchDisputes]);

 useDataEvents(['orders', 'receipts'], () => void fetchDisputes());

 const handleAction = async (orderId: string, action: 'force-approve' | 'uphold-rejection') => {
 if (pending.current) return;
 if (!selectedDispute?.current_receipt_id || !selectedReceipt || (action === 'force-approve' ? !confirmed || !receiptImageLoaded || !selectedReceipt.receipt_url || !selectedReceipt.reference_number?.trim() : !reviewReason.trim())) {
 setNotice({ title: 'Review required', message: 'Confirm the current receipt, reference and amount, or provide the rejection reason.' }); return;
 }
 pending.current = true;
 setIsActionLoading(true);
 try {
 await axios.post(`${API_URL}/orders/${orderId}/${action}`, { receiptId: selectedDispute.current_receipt_id, confirmed, reason: reviewReason.trim() || undefined });
 invalidateAdminCache();
 setNotice({ title: 'Action completed', message: 'The dispute decision was saved successfully.' });
 setSelectedDispute(null);
 void fetchDisputes();
 } catch (requestError: unknown) {
 invalidateAdminCache();
 void fetchDisputes();
 setNotice({
 title: 'Action failed',
 message: errorMessage(requestError, 'The dispute decision could not be saved.'),
 });
 } finally {
 pending.current = false;
 setIsActionLoading(false);
 }
 };

 const reviewOpen = Boolean(selectedDispute);
 useEffect(() => {
  setConfirmedEvidence(null);
  setReviewReason('');
 }, [evidenceKey]);

 useEffect(() => {
 if (!reviewOpen) return;
 const previous = document.activeElement as HTMLElement | null;
 const overflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 reviewDialog.current?.focus();
 const handleKey = (event: KeyboardEvent) => {
 if (event.key === 'Escape' && !pending.current && !noticeOpen.current) { event.preventDefault(); setSelectedDispute(null); }
 if (event.key !== 'Tab') return;
 const controls = Array.from(reviewDialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]') || []);
 const first = controls[0], last = controls[controls.length - 1];
 if (event.shiftKey && (document.activeElement === first || document.activeElement === reviewDialog.current)) { event.preventDefault(); last?.focus(); }
 else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
 };
 document.addEventListener('keydown', handleKey);
 return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
 }, [reviewOpen]);

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
 onClick={() => { invalidateAdminCache(); void fetchDisputes(); setSelectedDispute(dispute); setConfirmedEvidence(null); setReviewReason(''); setLoadedImage(null); }}
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
 onClick={() => { if (!pending.current) setSelectedDispute(null); }}
 className="absolute inset-0 bg-carbon-blue-100/40 backdrop-blur-sm"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 ref={reviewDialog}
 role="dialog" aria-modal="true" aria-labelledby="dispute-review-title" aria-busy={isActionLoading} tabIndex={-1}
 className="relative w-full max-w-4xl bg-white flex flex-col max-h-[90vh] overflow-y-auto z-10"
 >
 <div className="flex justify-between items-center p-6 border-b border-[#e0e0e0] shrink-0">
 <div>
 <h3 id="dispute-review-title" className="text-2xl font-black text-carbon-gray-100">Dispute Review</h3>
 <p className="text-sm font-medium text-gray-500">Order #{selectedDispute.id}</p>
 </div>
 <button aria-label="Close dispute review" disabled={isActionLoading} onClick={() => { if (!pending.current) setSelectedDispute(null); }} className="min-h-11 min-w-11 p-2 text-gray-400 hover:text-carbon-gray-100 transition-colors hover:bg-gray-100 disabled:opacity-50">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>

 <div className="min-h-0 flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
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
 <p><strong>Order status:</strong> {selectedDispute.state.replaceAll('_', ' ')}</p>
 {!['CANCELLED', 'REJECTED', 'EXPIRED', 'COMPLETED'].includes(selectedDispute.state) && <p>Verifying an eligible GCash payment authorizes production when the document is valid and the shop is verified.</p>}
 {['CANCELLED', 'REJECTED', 'EXPIRED'].includes(selectedDispute.state) && <p className="text-amber-800">This order is closed. Verifying payment creates a manual refund obligation without reopening production.</p>}
 <p><strong>Ref Number:</strong> {selectedReceipt?.reference_number || 'N/A'}</p>
 </div>
 </div>
 </div>
 
 <div className="flex-1 flex flex-col">
 <h4 className="font-bold text-carbon-gray-100 border-b border-[#e0e0e0] pb-2 mb-3">Uploaded Receipt</h4>
 <div className="flex-1 border border-[#e0e0e0] bg-carbon-gray-10 flex items-center justify-center p-2 min-h-[300px]">
 {selectedReceipt?.receipt_url ? (
 <img 
 key={imageKey}
 src={selectedReceipt.receipt_url}
 alt="Receipt" 
 onLoad={() => { if (currentImageKey.current === imageKey) setLoadedImage(imageKey); }}
 onError={() => setLoadedImage(previous => previous === imageKey ? null : previous)}
 className="max-w-full max-h-full object-contain"
 />
 ) : (
 <span className="text-gray-400 font-medium text-sm italic">No receipt image found</span>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-3 border-t border-gray-300 bg-carbon-gray-10 p-4 sm:p-6">
 <label className="flex min-h-11 items-start gap-2 text-sm font-medium"><input type="checkbox" checked={confirmed} onChange={event => setConfirmedEvidence(event.target.checked ? evidenceKey : null)} disabled={isActionLoading} className="mt-1 h-5 w-5 shrink-0" /><span>I confirmed the current receipt, reference and full amount against shop transaction records.</span></label>
 <label className="block text-sm font-bold">Reason for upholding rejection<textarea value={reviewReason} onChange={event => setReviewReason(event.target.value)} maxLength={500} disabled={isActionLoading} className="mt-1 min-h-16 w-full border border-gray-500 bg-white p-2 font-normal focus:outline-carbon-blue-60" /></label>
 </div>
 <div className="p-4 sm:p-6 border-t border-[#e0e0e0] bg-carbon-gray-10 shrink-0 flex flex-wrap justify-end gap-3">
 <button
 onClick={() => handleAction(selectedDispute.id, 'uphold-rejection')}
 disabled={isActionLoading || !selectedReceipt || !reviewReason.trim()}
 className="px-6 py-3 font-bold text-carbon-gray-100 bg-white border border-gray-300 hover:bg-gray-100 hover:border-carbon-gray-100 transition-colors disabled:opacity-50"
 >
 Uphold Rejection
 </button>
 <button
 onClick={() => handleAction(selectedDispute.id, 'force-approve')}
 disabled={isActionLoading || !selectedReceipt?.receipt_url || !receiptImageLoaded || !selectedReceipt?.reference_number?.trim() || !confirmed}
 className="px-6 py-3 font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
 >
 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
 Verify disputed payment
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 <AlertModal
 isOpen={Boolean(notice)}
 title={notice?.title || ''}
 message={notice?.message || ''}
 onClose={() => setNotice(null)}
 />
 </div>
 );
};
