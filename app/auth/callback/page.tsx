'use client';

import React, { useEffect, useState } from 'react';
import { supabase, isRealSupabaseConfigured } from '@/lib/supabase';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success'>('processing');

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const notifyAndFinish = (session?: any) => {
      // 1. Storage marker for cross-window / cross-tab synchronization
      try {
        localStorage.setItem('daejin_oauth_completed', String(Date.now()));
        if (session?.user) {
          localStorage.setItem('daejin_supabase_auth_sync', JSON.stringify({
            timestamp: Date.now(),
            user: session.user,
          }));
        }
      } catch (e) {}

      // 2. BroadcastChannel (works reliably across tabs and popups on the same origin)
      try {
        const bc = new BroadcastChannel('daejin_oauth');
        bc.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session });
        setTimeout(() => {
          try { bc.close(); } catch (e) {}
        }, 1000);
      } catch (e) {}

      // 3. postMessage to window.opener if available
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session }, '*');
        }
      } catch (e) {}

      setStatus('success');

      // 4. If this is a popup window, try to close it
      const isPopup = window.opener && window.opener !== window;
      if (isPopup) {
        try {
          window.close();
        } catch (e) {}
      }

      // 5. If window didn't close (or not a popup, or browser blocked window.close),
      // redirect to the dashboard immediately so user is never stranded
      timer = setTimeout(() => {
        window.location.replace('/');
      }, isPopup ? 400 : 200);
    };

    const handleAuth = async () => {
      try {
        // Exchange PKCE code if present in query params
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code && isRealSupabaseConfigured && supabase) {
            try {
              const { data } = await supabase.auth.exchangeCodeForSession(code);
              if (data?.session) {
                notifyAndFinish(data.session);
                return;
              }
            } catch (exchangeErr) {
              console.warn('PKCE exchange attempt:', exchangeErr);
            }
          }
        }

        if (isRealSupabaseConfigured && supabase) {
          // Listen for SIGNED_IN event (Supabase auto parses URL hash)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
              subscription.unsubscribe();
              notifyAndFinish(session);
            }
          });

          // Check current session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            subscription.unsubscribe();
            notifyAndFinish(session);
            return;
          }

          // Fallback after brief wait for hash parsing
          setTimeout(async () => {
            if (supabase) {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              notifyAndFinish(retrySession || undefined);
            } else {
              notifyAndFinish();
            }
          }, 600);
        } else {
          // Local sandbox mode
          notifyAndFinish();
        }
      } catch (err) {
        console.error('Callback error:', err);
        notifyAndFinish();
      }
    };

    handleAuth();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleGoToDashboard = () => {
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
        window.close();
      }
    } catch (e) {}
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        {status === 'processing' ? (
          <>
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-100">
              GitHub 로그인 처리 중...
            </h2>
            <p className="text-xs text-slate-400">
              인증 정보를 확인하고 대시보드로 이동합니다.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-100">
              GitHub 인증 완료!
            </h2>
            <p className="text-xs text-slate-300">
              대시보드로 자동 연결 중입니다...
            </p>
            <button
              onClick={handleGoToDashboard}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>대시보드로 바로 이동하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
