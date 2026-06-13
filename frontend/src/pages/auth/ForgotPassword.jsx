/**
 * ForgotPassword.jsx
 *
 * 3-step OTP-based password reset for Admin + Department Users.
 *
 * Step 1 — Email: POST /api/auth/forgot-password/send-otp
 * Step 2 — OTP:   POST /api/auth/forgot-password/verify-otp
 * Step 3 — Reset: POST /api/auth/forgot-password/reset
 *
 * Rules enforced by backend:
 *  - Max 2 password resets per calendar month
 *  - OTP: 6-digit, 10-minute TTL, max 5 wrong attempts
 *  - Resend cooldown: 2 minutes
 *  - Cannot reuse current or last 5 passwords
 */
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  KeyRound, Mail, ShieldCheck, Lock, Eye, EyeOff,
  ArrowLeft, CheckCircle2, RefreshCw, Fingerprint,
  ShieldAlert, Timer,
} from "lucide-react";
import GraphuraLogo from "../../assets/Logo/Graphura_Logo.webp";
import apiClient from "../../services/apiClient";

// ─── Floating background ────────────────────────────────────
const FloatingBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#063d66",
        opacity: "0.1",
        backgroundImage:
          "linear-gradient(#063d66 1.2px, transparent 1.2px), linear-gradient(90deg, #063d66 1.2px, transparent 1.2px), linear-gradient(#063d66 0.6px, transparent 0.6px), linear-gradient(90deg, #063d66 0.6px, #ffffff 0.6px)",
        backgroundSize: "30px 30px, 30px 30px, 6px 6px, 6px 6px",
        backgroundPosition: "-1.2px -1.2px, -1.2px -1.2px, -0.6px -0.6px, -0.6px -0.6px",
      }}
    />
    <div className="absolute inset-0 opacity-50">
      <KeyRound   className="w-20 h-20 text-slate-900 absolute top-10 left-10 animate-[spin_25s_linear_infinite]"   strokeWidth={1} />
      <ShieldAlert className="w-24 h-24 text-slate-900 absolute top-20 right-20 animate-[pulse_4s_ease-in-out_infinite]" strokeWidth={1} />
      <Fingerprint className="w-16 h-16 text-slate-900 absolute bottom-20 left-20 animate-[spin_22s_linear_infinite]" strokeWidth={1} />
      <Mail        className="w-28 h-28 text-slate-900 absolute top-[40%] left-[20%] animate-[spin_18s_linear_infinite]" strokeWidth={1} />
      <Lock        className="w-24 h-24 text-slate-900 absolute top-[45%] left-[5%] animate-[spin_30s_linear_infinite]"  strokeWidth={1} />
      <ShieldCheck className="w-24 h-24 text-slate-900 absolute bottom-20 right-20 animate-[pulse_3s_ease-in-out_infinite]" strokeWidth={1} />
      <Timer       className="w-24 h-24 text-slate-900 absolute top-[45%] right-10 animate-[spin_28s_linear_infinite]" strokeWidth={1} />
    </div>
  </div>
);

// ─── Status banner ──────────────────────────────────────────
const StatusBanner = ({ type, message }) => {
  if (!type || !message) return null;
  const styles = {
    success: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    alert:   "border border-yellow-200 bg-yellow-50 text-yellow-800",
    info:    "border border-blue-200 bg-blue-50 text-blue-800",
    error:   "border border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${styles[type] || styles.error}`}>
      {message}
    </div>
  );
};

// ─── Step indicator ─────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: "Email" },
    { num: 2, label: "Verify" },
    { num: 3, label: "Reset" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map(({ num, label }, idx) => (
        <React.Fragment key={num}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                currentStep > num
                  ? "bg-emerald-500 text-white scale-100"
                  : currentStep === num
                  ? "bg-[#2a465a] text-white scale-110 shadow-lg shadow-[#2a465a]/30"
                  : "bg-slate-100 text-slate-400 scale-100"
              }`}
            >
              {currentStep > num ? <CheckCircle2 size={18} /> : num}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= num ? "text-[#2a465a]" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`h-0.5 w-10 rounded-full transition-all duration-500 mb-5 ${currentStep > num ? "bg-emerald-500" : "bg-slate-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── OTP input ──────────────────────────────────────────────
const OTPInput = ({ otp, setOtp, otpError }) => {
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtp(next);
    const firstEmpty = next.findIndex((v) => !v);
    inputRefs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">
        Verification Code
      </label>
      <div className="flex gap-2 justify-center">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={idx === 0 ? handlePaste : undefined}
            className={`w-12 h-14 rounded-2xl border text-center text-xl font-black text-[#2a465a] bg-slate-50/90
              focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 focus:border-[#2a465a]/40 transition duration-200
              ${otpError ? "border-rose-300 bg-rose-50/50" : "border-slate-200"}
              ${digit ? "border-[#2a465a]/40 bg-white" : ""}
            `}
          />
        ))}
      </div>
      {otpError && <p className="text-xs text-rose-600 mt-1 px-1 text-center">{otpError}</p>}
    </div>
  );
};

// ─── Password strength ──────────────────────────────────────
const getPasswordStrength = (pwd) => {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)         score++;
  if (/[A-Z]/.test(pwd))       score++;
  if (/[a-z]/.test(pwd))       score++;
  if (/\d/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { level: score, label: "Weak",   color: "bg-rose-500" };
  if (score <= 3) return { level: score, label: "Fair",   color: "bg-yellow-500" };
  if (score <= 4) return { level: score, label: "Good",   color: "bg-blue-500" };
  return           { level: score, label: "Strong", color: "bg-emerald-500" };
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1
  const [email,      setEmail]      = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2
  const [otp,          setOtp]          = useState(["", "", "", "", "", ""]);
  const [otpError,     setOtpError]     = useState("");
  const [resendTimer,  setResendTimer]  = useState(60);
  const [canResend,    setCanResend]    = useState(false);
  const [resetToken,   setResetToken]   = useState("");   // session token from Step 2

  // Step 3
  const [newPassword,          setNewPassword]          = useState("");
  const [confirmPassword,      setConfirmPassword]      = useState("");
  const [showNewPassword,      setShowNewPassword]      = useState(false);
  const [showConfirmPassword,  setShowConfirmPassword]  = useState(false);
  const [passwordError,        setPasswordError]        = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Shared
  const [statusType,    setStatusType]    = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const setStatus = (type, message) => { setStatusType(type); setStatusMessage(message); };
  const clearStatus = () => { setStatusType(""); setStatusMessage(""); };

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const passwordStrength = getPasswordStrength(newPassword);

  // Auto-clear banner after 6 s
  useEffect(() => {
    if (!statusType) return;
    const t = setTimeout(clearStatus, 6000);
    return () => clearTimeout(t);
  }, [statusType, statusMessage]);

  // OTP countdown
  useEffect(() => {
    if (step !== 2) return;
    if (resendTimer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [step, resendTimer]);

  // ── Shared API error extractor ──────────────────────────────
  const extractError = (err) =>
    err?.message ||
    err?.response?.data?.message ||
    "Something went wrong. Please try again.";

  // ── STEP 1: Send OTP ────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim())           { setEmailError("Email address is required.");      return; }
    if (!validateEmail(email))   { setEmailError("Please enter a valid email.");     return; }
    setEmailError("");

    try {
      setIsSubmitting(true);
      setStatus("info", "Sending verification code to your email…");

      await apiClient.post("/auth/forgot-password/send-otp", { email: email.trim().toLowerCase() });

      setStatus("success", `Verification code sent to ${email}`);
      setResendTimer(60);
      setCanResend(false);

      setTimeout(() => { clearStatus(); setStep(2); }, 800);
    } catch (err) {
      setStatus("error", extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── STEP 2: Verify OTP ──────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }
    setOtpError("");

    try {
      setIsSubmitting(true);
      setStatus("info", "Verifying your code…");

      const { data } = await apiClient.post("/auth/forgot-password/verify-otp", {
        email: email.trim().toLowerCase(),
        otp:   code,
      });

      setResetToken(data.data.resetToken);
      setStatus("success", "Email verified! You can now set your new password.");

      setTimeout(() => { clearStatus(); setStep(3); }, 800);
    } catch (err) {
      const msg = extractError(err);
      setOtpError(msg);
      setStatus("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── STEP 2: Resend OTP ──────────────────────────────────────
  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setStatus("info", "Resending verification code…");
      await apiClient.post("/auth/forgot-password/send-otp", { email: email.trim().toLowerCase() });
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setResendTimer(60);
      setCanResend(false);
      setStatus("success", "A new code has been sent to your email.");
    } catch (err) {
      setStatus("error", extractError(err));
    }
  };

  // ── STEP 3: Reset Password ──────────────────────────────────
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    let valid = true;

    if (!newPassword.trim()) {
      setPasswordError("New password is required."); valid = false;
    } else if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters."); valid = false;
    } else if (passwordStrength.level < 3) {
      setPasswordError("Password is too weak. Add uppercase, numbers, or symbols."); valid = false;
    } else { setPasswordError(""); }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your new password."); valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match."); valid = false;
    } else { setConfirmPasswordError(""); }

    if (!valid) { setStatus("alert", "Please fix the errors below."); return; }

    try {
      setIsSubmitting(true);
      setStatus("info", "Resetting your password…");

      await apiClient.post("/auth/forgot-password/reset", {
        resetToken:  resetToken,
        newPassword: newPassword,
      });

      setStatus("success", "Password reset successfully! Redirecting to sign in…");
      setStep(4);

      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setStatus("error", extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-crm-off-white flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingBackground />

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden z-10 min-h-[600px]">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex w-5/12 bg-slate-50 p-12 flex-col justify-between border-r border-slate-100">
          <div>
            <div className="mb-10">
              <img src={GraphuraLogo} alt="Graphura" className="h-20" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-[11px] font-bold tracking-widest mb-6">
              <KeyRound size={11} /> PASSWORD RECOVERY
            </div>
            <h2 className="text-3xl font-extrabold text-[#2a465a] leading-tight mb-4" style={{ fontFamily: "'Gugi', cursive" }}>
              Secure Recovery.<br />Quick Access.<br />Stay Protected.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Reset your password securely with email OTP verification. A 6-digit code is sent to your registered email.
              Maximum 2 resets per month are allowed per account.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Mail,        text: "6-digit OTP to your email" },
                { icon: ShieldCheck, text: "Secure password reset" },
                { icon: Lock,        text: "Max 2 resets per month" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-[#2a465a] text-sm">
                  <div className="w-7 h-7 rounded-full bg-[#2a465a]/10 flex items-center justify-center">
                    <Icon size={14} className="text-[#2a465a]" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-auto pt-8">
            <span className="text-[11px] font-bold px-4 py-2 bg-white rounded-full border border-slate-200 text-slate-600">Terms of Service</span>
            <span className="text-[11px] font-bold px-4 py-2 bg-white rounded-full border border-slate-200 text-slate-600">Privacy Policy</span>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full -mt-6">

            {/* Mobile logo */}
            <div className="lg:hidden mb-8 mx-auto text-center">
              <img src={GraphuraLogo} alt="Graphura" className="w-40 h-15 mx-auto" />
            </div>

            {/* ── Step 4 — Success ── */}
            {step === 4 && (
              <div className="flex flex-col items-center gap-5 py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={44} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-[#2a465a] text-center">Password Reset!</h2>
                <p className="text-slate-500 text-sm text-center leading-relaxed">
                  Your password has been reset successfully.<br />
                  Redirecting you to sign in…
                </p>
                <div className="w-8 h-8 border-2 border-[#2a465a] border-t-transparent rounded-full animate-spin mt-2" />
              </div>
            )}

            {step < 4 && (
              <>
                <h1 className="text-3xl font-black text-crm-navy mb-4 text-center tracking-tight" style={{ fontFamily: "'Gugi', cursive" }}>
                  {step === 1 && "Forgot Password? 🔑"}
                  {step === 2 && "Verify Your Email 📧"}
                  {step === 3 && "Create New Password 🔒"}
                </h1>
                <p className="text-slate-400 text-sm text-center mb-5">
                  {step === 1 && "Enter your registered email to receive a 6-digit OTP."}
                  {step === 2 && `Enter the 6-digit code sent to ${email}`}
                  {step === 3 && "Choose a strong password for your account."}
                </p>

                <StepIndicator currentStep={step} />

                <StatusBanner type={statusType} message={statusMessage} />
                {statusType && <div className="h-4" />}

                {/* ══ STEP 1: Email ══ */}
                {step === 1 && (
                  <form className="space-y-5" onSubmit={handleEmailSubmit}>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">
                        Registered Email
                      </label>
                      <div className="relative mt-1.5 rounded-2xl border border-slate-200 bg-slate-50/90 focus-within:ring-2 focus-within:ring-[#2a465a]/20 focus-within:border-[#2a465a]/40 transition">
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          autoComplete="email"
                          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                          className="w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-4 text-[#2a465a] placeholder:text-slate-400 text-sm font-medium focus:outline-none"
                        />
                      </div>
                      {emailError && <p className="text-xs text-rose-600 mt-1 px-1">{emailError}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-[#2a465a] hover:bg-[#1e3a52] text-white font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Sending OTP…" : "Send Verification Code →"}
                    </button>

                    <p className="text-center text-slate-500 text-sm">
                      Remember your password?{" "}
                      <Link to="/login" className="text-crm-navy font-bold hover:underline">Back to Sign In</Link>
                    </p>
                  </form>
                )}

                {/* ══ STEP 2: OTP ══ */}
                {step === 2 && (
                  <form className="space-y-5" onSubmit={handleOtpSubmit}>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Mail size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Check your inbox</p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            6-digit code sent to <strong>{email}</strong>. Valid for 10 minutes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <OTPInput otp={otp} setOtp={setOtp} otpError={otpError} />

                    <div className="flex items-center justify-center gap-2 text-xs">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-crm-navy font-bold hover:underline flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} /> Resend Code
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Timer size={13} />
                          Resend in <span className="text-[#2a465a] font-bold ml-1">{resendTimer}s</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-[#2a465a] hover:bg-[#1e3a52] text-white font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Verifying…" : "Verify Email →"}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(["","","","","",""]); setOtpError(""); clearStatus(); }}
                      className="w-full text-center text-slate-500 text-sm hover:text-crm-navy transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Change email address
                    </button>
                  </form>
                )}

                {/* ══ STEP 3: New Password ══ */}
                {step === 3 && (
                  <form className="space-y-5" onSubmit={handlePasswordReset}>

                    {/* New password */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">New Password</label>
                      <div className="relative mt-1.5 rounded-2xl border border-slate-200 bg-slate-50/90 focus-within:ring-2 focus-within:ring-[#2a465a]/20 focus-within:border-[#2a465a]/40 transition">
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={newPassword}
                          autoComplete="new-password"
                          onChange={(e) => { setNewPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                          className="w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-14 text-[#2a465a] placeholder:text-slate-400 text-sm font-medium focus:outline-none"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-crm-navy transition">
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordError && <p className="text-xs text-rose-600 mt-1 px-1">{passwordError}</p>}

                      {/* Strength meter */}
                      {newPassword && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : "bg-slate-200"}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-semibold ${
                            passwordStrength.level <= 2 ? "text-rose-600" :
                            passwordStrength.level <= 3 ? "text-yellow-600" :
                            passwordStrength.level <= 4 ? "text-blue-600" : "text-emerald-600"
                          }`}>{passwordStrength.label}</p>
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">Confirm Password</label>
                      <div className="relative mt-1.5 rounded-2xl border border-slate-200 bg-slate-50/90 focus-within:ring-2 focus-within:ring-[#2a465a]/20 focus-within:border-[#2a465a]/40 transition">
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                          <ShieldCheck size={18} />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your new password"
                          value={confirmPassword}
                          autoComplete="new-password"
                          onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPasswordError) setConfirmPasswordError(""); }}
                          className="w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-14 text-[#2a465a] placeholder:text-slate-400 text-sm font-medium focus:outline-none"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-crm-navy transition">
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {confirmPasswordError && <p className="text-xs text-rose-600 mt-1 px-1">{confirmPasswordError}</p>}
                      {confirmPassword && !confirmPasswordError && newPassword === confirmPassword && (
                        <p className="text-xs text-emerald-600 mt-1 px-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Passwords match
                        </p>
                      )}
                    </div>

                    {/* Requirements */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Requirements</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { text: "8+ characters",   met: newPassword.length >= 8 },
                          { text: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
                          { text: "Lowercase letter", met: /[a-z]/.test(newPassword) },
                          { text: "Number",           met: /\d/.test(newPassword) },
                          { text: "Special character",met: /[^A-Za-z0-9]/.test(newPassword) },
                        ].map(({ text, met }) => (
                          <div key={text} className={`flex items-center gap-1.5 text-xs font-medium ${met ? "text-emerald-600" : "text-slate-400"}`}>
                            <CheckCircle2 size={11} className={met ? "text-emerald-500" : "text-slate-300"} />
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-[#2a465a] hover:bg-[#1e3a52] text-white font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Resetting Password…" : "Reset Password →"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
