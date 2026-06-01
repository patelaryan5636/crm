import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

// Use relative /api path — works via Vite proxy in dev.
// In production, set VITE_API_URL to your backend's public URL.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Public payment result page — no auth required.
 * Razorpay redirects the client here after payment via:
 *   GET /payment-success?prospectId=...&status=paid&razorpay_payment_id=...
 *
 * We poll the backend for up to 30 seconds to confirm the webhook has
 * updated the payment status, then show the final result.
 */
export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState('checking'); // checking | success | failed | pending
  const [payment, setPayment] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const pollRef = useRef(null);

  const prospectId = searchParams.get('prospectId');
  const razorpayStatus = searchParams.get('status'); // 'paid' | 'cancelled' | undefined
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');

  // If Razorpay says cancelled, show failure immediately
  useEffect(() => {
    if (razorpayStatus === 'cancelled') {
      setPhase('failed');
    }
  }, [razorpayStatus]);

  // Poll backend for payment confirmation
  useEffect(() => {
    if (razorpayStatus === 'cancelled') return;
    if (!prospectId) {
      setPhase(razorpayPaymentId ? 'success' : 'failed');
      return;
    }

    const MAX_ATTEMPTS = 6; // 6 × 5s = 30 seconds
    const INTERVAL_MS = 5000;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/payments/status/${prospectId}`);
        const json = await res.json();
        const data = json?.data;

        setAttempts((a) => a + 1);

        if (data?.status === 'SUCCESS') {
          setPayment(data.payment);
          setPhase('success');
          clearInterval(pollRef.current);
          return;
        }

        if (data?.status === 'FAILED') {
          setPayment(data.payment);
          setPhase('failed');
          clearInterval(pollRef.current);
          return;
        }

        // Still pending — keep polling
        if (attempts + 1 >= MAX_ATTEMPTS) {
          // Webhook hasn't arrived yet — show optimistic success if Razorpay
          // told us it was paid, otherwise show pending message
          setPayment(data?.payment || null);
          setPhase(razorpayStatus === 'paid' ? 'success' : 'pending');
          clearInterval(pollRef.current);
        }
      } catch {
        // Network error — keep trying
        if (attempts + 1 >= MAX_ATTEMPTS) {
          setPhase(razorpayStatus === 'paid' ? 'success' : 'failed');
          clearInterval(pollRef.current);
        }
      }
    };

    // First check immediately
    poll();
    pollRef.current = setInterval(poll, INTERVAL_MS);

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId, razorpayStatus, razorpayPaymentId]);

  const amountDisplay = payment?.amount
    ? `₹${Number(payment.amount).toLocaleString('en-IN')}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
        {/* Logo / Brand */}
        <div className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
          Graphura CRM
        </div>

        {/* Checking */}
        {phase === 'checking' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-slate-800">Confirming Payment</h1>
            <p className="text-slate-500 text-sm">
              Please wait while we verify your transaction…
            </p>
            <div className="flex justify-center gap-1 pt-2">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < attempts ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Success */}
        {phase === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-emerald-600">Payment Successful!</h1>
            <p className="text-slate-500 text-sm">
              Thank you! Your payment has been received and confirmed.
            </p>

            {(amountDisplay || razorpayPaymentId || payment?.razorpayPaymentId) && (
              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm border border-slate-100">
                {amountDisplay && (
                  <Row label="Amount" value={amountDisplay} />
                )}
                {(razorpayPaymentId || payment?.razorpayPaymentId) && (
                  <Row
                    label="Payment ID"
                    value={
                      <span className="font-mono text-xs break-all">
                        {razorpayPaymentId || payment?.razorpayPaymentId}
                      </span>
                    }
                  />
                )}
                <Row label="Status" value={<span className="text-emerald-600 font-semibold">Confirmed</span>} />
              </div>
            )}

            <p className="text-slate-400 text-xs">
              You can safely close this window. Our team will be in touch shortly.
            </p>
          </>
        )}

        {/* Pending (webhook delayed) */}
        {phase === 'pending' && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                <RefreshCw className="w-12 h-12 text-amber-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-amber-600">Payment Received</h1>
            <p className="text-slate-500 text-sm">
              Your payment was received. Confirmation is being processed — this
              usually takes a few seconds. You can close this window.
            </p>
            {razorpayPaymentId && (
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm border border-slate-100">
                <Row
                  label="Payment ID"
                  value={<span className="font-mono text-xs break-all">{razorpayPaymentId}</span>}
                />
              </div>
            )}
          </>
        )}

        {/* Failed */}
        {phase === 'failed' && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-rose-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-rose-600">Payment Not Completed</h1>
            <p className="text-slate-500 text-sm">
              {razorpayStatus === 'cancelled'
                ? 'The payment was cancelled. Please contact us if you need to retry.'
                : 'We could not confirm your payment. Please contact support if you believe this is an error.'}
            </p>
          </>
        )}

        {/* Support footer */}
        <p className="text-slate-400 text-xs pt-2 border-t border-slate-100">
          Need help?{' '}
          <a
            href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@graphura.com'}`}
            className="text-blue-500 hover:underline"
          >
            {import.meta.env.VITE_SUPPORT_EMAIL || 'support@graphura.com'}
          </a>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}
