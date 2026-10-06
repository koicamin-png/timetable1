'use client';

import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, X, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AuthUser, SupabaseService, isRealSupabaseConfigured } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input_email' | 'input_otp'>('input_email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  // Handle Email Magic Link / OTP submission
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ text: '올바른 이메일 주소를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await SupabaseService.signInWithEmail(email.trim());
      if (res.success) {
        setMessage({ text: res.message, type: 'success' });
        setStep('input_otp');
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || '인증 메일 전송 실패', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setMessage({ text: '6자리 인증코드를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await SupabaseService.verifyEmailOtp(email.trim(), otpCode.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setMessage({ text: res.message || '인증코드가 올바르지 않습니다.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || '인증 확인 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await SupabaseService.signInWithGoogle();
      if (res.url) {
        window.location.href = res.url;
      } else {
        // Mock fallback login
        const user = await SupabaseService.getCurrentUser();
        if (user) {
          onLoginSuccess(user);
          onClose();
        }
      }
    } catch (err: any) {
      setMessage({ text: err?.message || '구글 로그인 오류', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for instant review
  const handleQuickDemo = async (type: 'existing' | 'new') => {
    setLoading(true);
    try {
      const user = await SupabaseService.quickDemoLogin(type);
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Supabase 인증 시스템</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              대진전자통신고 포털 로그인
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              이메일 인증 또는 구글 계정으로 로그인하여 시간표와 과제를 확인하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {message && (
            <div
              className={`p-3 text-xs rounded-lg border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : message.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {step === 'input_email' ? (
            /* Step 1: Email Input */
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학교 또는 개인 이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@pdj.hs.kr 또는 개인 메일"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  입력하신 이메일로 Supabase 1회용 인증코드(OTP)가 전송됩니다.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>메일 발송 중...</span>
                ) : (
                  <>
                    <span>인증 메일 발송하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    인증코드 (6자리)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input_email');
                      setMessage(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    이메일 다시 입력
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest text-center border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  {email} 주소로 발송된 6자리 번호를 입력하세요.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>인증 확인 중...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>인증 완료 및 로그인</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-xs text-slate-400">또는</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Google Auth Button */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2.5 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google 계정으로 계속하기</span>
            </button>
          </div>

          {/* Instant Sandbox / Demo Experience */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 mb-2 text-center font-medium">
              빠른 기능 평가용 1초 원클릭 로그인
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDemo('existing')}
                className="py-1.5 px-2.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors text-center"
              >
                2학년 3반 재학생 체험
              </button>
              <button
                onClick={() => handleQuickDemo('new')}
                className="py-1.5 px-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-center"
              >
                신규 학생 (정보 미등록)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRealSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isRealSupabaseConfigured ? 'Supabase 연동 활성화됨' : '로컬 Supabase 샌드박스 작동중'}</span>
          </div>
          <span className="text-slate-400">대진전자통신고 포털</span>
        </div>
      </div>
    </div>
  );
}
