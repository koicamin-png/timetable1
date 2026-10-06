'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Database, Shield, Server, FileCode } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, isRealSupabaseConfigured } from '@/lib/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseGuideModal({ isOpen, onClose }: SupabaseGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'env_db' | 'google_oauth'>('env_db');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  if (!isOpen) return null;

  const envSample = `# .env.local 설정
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
NEIS_API_KEY="" # 선택사항 (나이스 오픈API 키)`;

  const callbackUrl = `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supabase & 구글 인증 설정 가이드
              </h3>
              <p className="text-xs text-slate-500">
                환경변수(.env), DB 테이블 스키마 및 Google OAuth 연동 방법
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-4">
          <button
            onClick={() => setActiveTab('env_db')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'env_db'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. 환경변수 & DB 스키마
          </button>
          <button
            onClick={() => setActiveTab('google_oauth')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'google_oauth'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>2. 깃허브(GitHub) 로그인 연동 절차</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white">단일 인증</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {activeTab === 'env_db' ? (
            <>
              {/* Status Alert */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isRealSupabaseConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Server className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">
                    {isRealSupabaseConfigured
                      ? 'Supabase 실시간 백엔드가 정상 연결되어 있습니다.'
                      : '현재 로컬 Supabase 샌드박스 모드로 작동 중입니다.'}
                  </h4>
                  <p className="text-[11px] mt-0.5">
                    {isRealSupabaseConfigured
                      ? '환경변수에 등록된 Supabase 프로젝트로 인증 및 데이터베이스 쿼리가 전송됩니다.'
                      : '환경변수가 아직 설정되지 않아도 브라우저 내장 저장소를 통해 100% 동일하게 로그인, 시간표, 과제 등록 및 푸시 알림을 테스트할 수 있습니다.'}
                  </p>
                </div>
              </div>

              {/* Env Vars */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    .env.local 환경변수 설정
                  </label>
                  <button
                    onClick={handleCopyEnv}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnv ? '복사됨!' : '환경변수 복사'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {envSample}
                </pre>
              </div>

              {/* SQL Schema */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span>Supabase SQL 테이블 생성 쿼리 (profiles, assignments)</span>
                  </label>
                  <button
                    onClick={handleCopySql}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? '복사 완료!' : 'SQL 쿼리 복사'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supabase 대시보드 &gt; <strong>SQL Editor</strong>에서 위 쿼리를 붙여넣고 <strong>Run</strong>을 누르면 테이블 및 RLS 보안 규칙이 자동 생성됩니다.
                </p>
              </div>
            </>
          ) : (
            /* GitHub OAuth Guide Tab */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl">
                <span className="font-bold block mb-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub OAuth 단일 인증 연동 요약</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  GitHub 계정으로만 로그인할 수 있도록 단일 설정합니다. <strong>GitHub Developer Settings</strong>에서 OAuth App을 생성하고 <strong>Supabase Auth &gt; Providers &gt; GitHub</strong>에 연결합니다.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">1</span>
                  <span className="font-bold text-slate-900">GitHub에서 새 OAuth App 등록</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  1. <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">GitHub Developer Settings (github.com/settings/developers)</a>로 이동합니다.<br />
                  2. 좌측 <strong>OAuth Apps</strong> &gt; 우측 상단 <strong>New OAuth App</strong> 버튼을 클릭합니다.<br />
                  3. <strong>Application name</strong>: <code>대진전자통신고 포털</code><br />
                  4. <strong>Homepage URL</strong>: <code>https://ais-dev-fy4tx42gxkvskhtijf6eoa-330592399340.asia-northeast1.run.app</code>
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">2</span>
                  <span className="font-bold text-slate-900">Authorization callback URL 설정</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  <strong>Authorization callback URL</strong> 입력란에 아래 Supabase 콜백 주소를 붙여넣습니다:
                </p>
                <div className="flex items-center gap-2 bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]">
                  <span className="truncate flex-1">{callbackUrl}</span>
                  <button
                    onClick={handleCopyCallback}
                    className="text-xs text-white bg-indigo-600 px-2.5 py-1 rounded-md shrink-0 hover:bg-indigo-700"
                  >
                    {copiedCallback ? '복사됨!' : 'URL 복사'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  * <code>&lt;YOUR-PROJECT-ID&gt;</code> 부분에 본인의 Supabase Project ID(Ref)를 입력하세요.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">3</span>
                  <span className="font-bold text-slate-900">Client Secret 발급 및 Supabase Provider 등록</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  1. 생성 완료 화면에서 <strong>Client ID</strong>를 복사하고, <strong>Generate a new client secret</strong>을 눌러 비밀키를 생성 후 복사합니다.<br />
                  2. <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">Supabase Dashboard</a> &gt; 프로젝트 선택 &gt; <strong>Authentication &gt; Providers</strong>로 이동합니다.<br />
                  3. <strong>GitHub</strong>를 찾아 <strong>Enable Sign in with GitHub</strong>를 <strong>ON</strong>으로 켭니다.<br />
                  4. 복사한 <strong>Client ID</strong>와 <strong>Client Secret</strong>을 붙여넣고 <strong>Save</strong>를 클릭합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
