'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Database, Shield, Server, FileCode } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, isRealSupabaseConfigured } from '@/lib/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseGuideModal({ isOpen, onClose }: SupabaseGuideModalProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const envSample = `# .env.local 설정
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
NEIS_API_KEY="" # 선택사항 (나이스 오픈API 키)`;

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
                Supabase 환경변수 및 데이터베이스 설정 안내
              </h3>
              <p className="text-xs text-slate-500">
                실행 시 UI 입력 없이 시스템 환경변수(.env)로 고정하여 사용합니다.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
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
                1. .env.local 환경변수 설정
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
                <span>2. Supabase SQL 테이블 생성 쿼리 (profiles, assignments)</span>
              </label>
              <button
                onClick={handleCopySql}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '복사 완료!' : 'SQL 쿼리 복사'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
            <p className="text-[11px] text-slate-500 mt-1">
              Supabase 대시보드 &gt; <strong>SQL Editor</strong>에서 위 쿼리를 붙여넣고 <strong>Run</strong>을 누르면 테이블 및 RLS 보안 규칙이 자동 생성됩니다.
            </p>
          </div>
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
