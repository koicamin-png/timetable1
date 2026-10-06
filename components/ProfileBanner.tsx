'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ProfileBannerProps {
  profile: UserProfile | null;
  onOpenProfileModal: () => void;
}

export function ProfileBanner({ profile, onOpenProfileModal }: ProfileBannerProps) {
  // If user has already registered both grade and classNum, we don't show the warning banner
  if (profile && profile.grade && profile.classNum && profile.name) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-300/60 text-amber-900 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500 text-white rounded-md shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-950">
              대진전자통신고 학년 및 반 등록이 필요합니다!
            </p>
            <p className="text-xs text-amber-800">
              본인의 학년과 반 정보를 등록해야 NEIS 공식 시간표와 과제 알림이 정상적으로 연동됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>지금 학생 정보 등록하기</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
