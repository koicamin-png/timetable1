'use client';

import React from 'react';
import { UserProfile, NotificationLog } from '@/lib/types';
import { AuthUser, isRealSupabaseConfigured } from '@/lib/supabase';
import { 
  Bell, 
  LogOut, 
  User, 
  Calendar, 
  CheckSquare, 
  School, 
  Settings, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  unreadCount: number;
  activeTab: 'timetable' | 'assignments' | 'notifications' | 'school';
  setActiveTab: (tab: 'timetable' | 'assignments' | 'notifications' | 'school') => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onSignOut: () => void;
  onOpenSupabaseGuide: () => void;
}

export function Navbar({
  user,
  profile,
  unreadCount,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenProfile,
  onOpenNotifications,
  onSignOut,
  onOpenSupabaseGuide,
}: NavbarProps) {
  const isProfileComplete = profile && profile.grade && profile.classNum;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('timetable')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-indigo-700 transition-colors">
                대
              </div>
              <div>
                <span className="text-base font-semibold text-slate-900 tracking-tight block">
                  대진전자통신고
                </span>
                <span className="text-[11px] text-slate-500 font-mono tracking-tight block -mt-0.5">
                  시간표 & 과제 알리미
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean text with subtle active states) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'timetable'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              시간표
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              과제 관리
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              푸시 알림
            </button>
            <button
              onClick={() => setActiveTab('school')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'school'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              학교 정보
            </button>
          </nav>

          {/* Zone 3: Primary Actions & User State */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase status badge / button */}
            <button
              onClick={onOpenSupabaseGuide}
              title="Supabase 환경 설정 안내"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRealSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="font-mono">Supabase DB</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden"
              aria-label="알림 확인"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Profile Button */}
                <button
                  onClick={onOpenProfile}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                    !isProfileComplete
                      ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {isProfileComplete
                      ? `${profile?.grade}학년 ${profile?.classNum}반 ${profile?.name || ''}`
                      : '학생 정보 등록 필요'}
                  </span>
                  {!isProfileComplete && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>

                {/* Sign Out */}
                <button
                  onClick={onSignOut}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="로그아웃"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                로그인 / 인증
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
