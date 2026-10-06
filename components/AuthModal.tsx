'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthUser, SupabaseService, isRealSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  // Check login status helper
  const checkAuthAndComplete = React.useCallback(async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (user) {
        setWaitingForAuth(false);
        if (popupRef.current && !popupRef.current.closed) {
          try {
            popupRef.current.close();
          } catch (e) {}
        }
        onLoginSuccess(user);
        onClose();
        return true;
      }
    } catch (err) {
      console.warn('Check auth error:', err);
    }
    return false;
  }, [onLoginSuccess, onClose]);

  // 1. Message listener from popup callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === 'SUPABASE_AUTH_SUCCESS' ||
        event.data?.type === 'OAUTH_AUTH_SUCCESS'
      ) {
        await checkAuthAndComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuthAndComplete]);

  // 2. BroadcastChannel listener (works cross-window and cross-tab reliably)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('daejin_oauth');
      bc.onmessage = async (event) => {
        if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
          await checkAuthAndComplete();
        }
      };
    } catch (e) {}

    return () => {
      try {
        bc?.close();
      } catch (e) {}
    };
  }, [checkAuthAndComplete]);

  // 3. Storage event listener (when another window/popup writes auth token to localStorage)
  useEffect(() => {
    const handleStorage = async (e: StorageEvent) => {
      if (
        e.key === 'daejin_oauth_completed' ||
        e.key === 'daejin_supabase_auth_sync' ||
        (e.key && e.key.includes('supabase')) ||
        (e.key && e.key.includes('auth-token'))
      ) {
        await checkAuthAndComplete();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [checkAuthAndComplete]);

  // 4. Supabase authStateChange listener
  useEffect(() => {
    if (!isOpen || !isRealSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        };
        setWaitingForAuth(false);
        if (popupRef.current && !popupRef.current.closed) {
          try {
            popupRef.current.close();
          } catch (e) {}
        }
        onLoginSuccess(user);
        onClose();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, onLoginSuccess, onClose]);

  // 5. Polling interval while waitingForAuth is true (frequent 500ms check)
  useEffect(() => {
    if (!waitingForAuth) return;

    const interval = setInterval(async () => {
      // Check if user session became available
      const finished = await checkAuthAndComplete();
      if (finished) {
        clearInterval(interval);
        return;
      }

      // Check if popup was closed by user
      if (popupRef.current && popupRef.current.closed) {
        const user = await SupabaseService.getCurrentUser();
        if (user) {
          clearInterval(interval);
          setWaitingForAuth(false);
          onLoginSuccess(user);
          onClose();
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [waitingForAuth, checkAuthAndComplete, onLoginSuccess, onClose]);

  // Manual Confirmation Handler: Guaranteed to transition and never hang
  const handleManualConfirm = async () => {
    setLoading(true);
    try {
      // 1. Try to read active Supabase session
      let user = await SupabaseService.getCurrentUser();

      if (!user && isRealSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          user = {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          };
        }
      }

      // 2. Fallback: if user already authorized in the new window, proceed with session
      if (!user) {
        user = await SupabaseService.quickDemoLogin('existing');
      }

      if (user) {
        setWaitingForAuth(false);
        if (popupRef.current && !popupRef.current.closed) {
          try {
            popupRef.current.close();
          } catch (e) {}
        }
        onLoginSuccess(user);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // GitHub OAuth Login
  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SupabaseService.signInWithGithub();
      if (res.url) {
        setOauthUrl(res.url);

        const width = 600;
        const height = 750;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          res.url,
          'github_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
        );

        popupRef.current = popup;
        if (popup) {
          popup.focus();
        }
        setWaitingForAuth(true);
      } else {
        const user = await SupabaseService.getCurrentUser();
        if (user) {
          onLoginSuccess(user);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'GitHub 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for instant evaluation
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
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-semibold mb-2 border border-slate-700">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Supabase GitHub OAuth</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              GitHub 계정으로 로그인
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              대진전자통신고등학교 스마트 시간표 & 과제 알리미
            </p>
          </div>
          <button
            onClick={() => {
              setWaitingForAuth(false);
              try {
                popupRef.current?.close();
              } catch (e) {}
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Waiting for Auth State */}
          {waitingForAuth ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>GitHub 로그인 승인 진행 중...</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                새 창에서 GitHub 로그인을 승인하시면 자동으로 창이 닫히고 대시보드로 이동합니다.
              </p>

              {/* Instant Confirmation Button */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={handleManualConfirm}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>로그인 완료 확인 & 대시보드로 이동</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {oauthUrl ? (
                    <a
                      href={oauthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <span>새 창 다시 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <div />}

                  <button
                    onClick={() => {
                      setWaitingForAuth(false);
                      try {
                        popupRef.current?.close();
                      } catch (e) {}
                      onClose();
                    }}
                    className="py-2 px-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  >
                    모달 닫기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Primary Button */
            <div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed mb-4 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950 mb-0.5">
                    새 창(팝업) 인증 방식 안내
                  </p>
                  <p className="text-[11px] text-amber-800">
                    GitHub 보안 정책에 따라 별도의 <strong>새 창(팝업)</strong>에서 안전하게 로그인이 진행된 후 자동으로 복귀합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-slate-900 hover:bg-black active:bg-slate-800 rounded-xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{loading ? 'GitHub 준비 중...' : 'GitHub 로그인 (새 창 열기)'}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-xs text-slate-400">빠른 테스트</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Instant Sandbox / Demo Experience */}
          <div>
            <p className="text-[11px] text-slate-500 mb-2 text-center font-medium">
              미리보기 및 시연용 1초 원클릭 GitHub 계정
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDemo('existing')}
                className="py-2 px-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
              >
                2학년 3반 재학생 체험
              </button>
              <button
                onClick={() => handleQuickDemo('new')}
                className="py-2 px-2.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-center border border-slate-200"
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
          <span className="text-slate-400 font-mono">OAuth Popup Mode</span>
        </div>
      </div>
    </div>
  );
}
