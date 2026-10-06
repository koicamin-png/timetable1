'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';
import { AuthUser, SupabaseService } from '@/lib/supabase';
import { X, Check, School, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  profile: UserProfile | null;
  onSaveSuccess: (updatedProfile: UserProfile) => void;
}

const MAJORS = [
  '전자통신과',
  '스마트전자과',
  'IT전자통신과',
  '인공지능(AI)소프트웨어과',
  '정보통신망과',
  '전자기기과',
];

function ProfileModalForm({
  onClose,
  user,
  profile,
  onSaveSuccess,
}: {
  onClose: () => void;
  user: AuthUser;
  profile: UserProfile | null;
  onSaveSuccess: (updatedProfile: UserProfile) => void;
}) {
  const [name, setName] = useState(profile?.name || user.user_metadata?.full_name || '');
  const [grade, setGrade] = useState<number>(profile?.grade || 2);
  const [classNum, setClassNum] = useState<number>(profile?.classNum || 1);
  const [major, setMajor] = useState<string>(profile?.major || '전자통신과');
  const [studentNum, setStudentNum] = useState<string>(profile?.studentNum || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('학생 이름을 입력해주세요.');
      return;
    }
    if (!grade || grade < 1 || grade > 3) {
      setError('올바른 학년(1~3학년)을 선택해주세요.');
      return;
    }
    if (!classNum || classNum < 1) {
      setError('올바른 반을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const saved = await SupabaseService.saveProfile({
        id: user.id,
        email: user.email,
        name: name.trim(),
        grade,
        classNum,
        major,
        studentNum: studentNum.trim(),
        schoolName: '대진전자통신고등학교',
        schoolCode: '7150597',
        officeCode: 'C10',
      });

      onSaveSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                학생 정보 등록 및 수정
              </h3>
              <p className="text-xs text-slate-500">
                대진전자통신고등학교 시간표 연동을 위한 필수 정보입니다.
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

        {/* Notice for new users */}
        {(!profile?.grade || !profile?.classNum) && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              본인의 <strong>학년</strong>과 <strong>반</strong>을 등록해야 NEIS 공식 시간표가 맞춤형으로 제공됩니다.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* School (Fixed) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              소속 학교 (고정)
            </label>
            <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center justify-between">
              <span>대진전자통신고등학교 (부산광역시교육청)</span>
              <span className="text-[11px] font-mono text-slate-500">코드 7150597</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              학생 이름 *
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Grade and Class (Two columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학년 *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              >
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                반 *
              </label>
              <select
                value={classNum}
                onChange={(e) => setClassNum(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                  <option key={c} value={c}>
                    {c}반
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Major and Student Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                전공 학과
              </label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                출석 번호 (선택)
              </label>
              <input
                type="text"
                value={studentNum}
                onChange={(e) => setStudentNum(e.target.value)}
                placeholder="예: 12번"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              {loading ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>정보 저장 및 시간표 동기화</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProfileModal(props: ProfileModalProps) {
  if (!props.isOpen) return null;
  return (
    <ProfileModalForm
      key={props.profile?.id || props.user.id}
      {...props}
    />
  );
}
