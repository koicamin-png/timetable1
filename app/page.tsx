'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile, Assignment, NotificationLog, AssignmentPriority } from '@/lib/types';
import { AuthUser, SupabaseService, isRealSupabaseConfigured, supabase } from '@/lib/supabase';
import { scanAssignmentsForDeadlines, sendBrowserPushNotification } from '@/lib/notifications';
import { Navbar } from '@/components/Navbar';
import { ProfileBanner } from '@/components/ProfileBanner';
import { ProfileModal } from '@/components/ProfileModal';
import { AuthModal } from '@/components/AuthModal';
import { TimetableSection } from '@/components/TimetableSection';
import { AssignmentSection } from '@/components/AssignmentSection';
import { PushNotificationManager } from '@/components/PushNotificationManager';
import { SchoolInfoCard } from '@/components/SchoolInfoCard';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { SupabaseGuideModal } from '@/components/SupabaseGuideModal';
import { 
  Calendar, 
  CheckSquare, 
  Bell, 
  School, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Navigation and Modals
  const [activeTab, setActiveTab] = useState<'timetable' | 'assignments' | 'notifications' | 'school'>('timetable');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);

  // Assignment Modal
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [presetSubject, setPresetSubject] = useState('');

  // 1. Load User Profile & Assignments
  const loadUserData = React.useCallback(async (userId: string) => {
    try {
      const userProfile = await SupabaseService.getProfile(userId);
      setProfile(userProfile);

      const userAssignments = await SupabaseService.getAssignments(userId);
      setAssignments(userAssignments);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // 2. Initial Load: Check auth, broadcast channels, and register service worker
  useEffect(() => {
    // Register Service Worker for Push Notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          console.log('Service Worker registered successfully');
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    }

    // Helper to apply authenticated user, close modals, and show dashboard
    const applyAuthUser = async (currentUser: AuthUser) => {
      setUser(currentUser);
      setIsAuthModalOpen(false);
      setIsProfileModalOpen(false);
      await loadUserData(currentUser.id);
    };

    // Load initial user
    const initAuth = async () => {
      const currentUser = await SupabaseService.getCurrentUser();
      if (currentUser) {
        await applyAuthUser(currentUser);
      }
    };

    initAuth();

    // If this window is the OAuth popup itself, notify opener and close self immediately
    if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
      try {
        window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
        setTimeout(() => {
          window.close();
        }, 300);
      } catch (e) {}
    }

    // Listen for postMessage from popup callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS' || event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const currentUser = await SupabaseService.getCurrentUser();
        if (currentUser) {
          await applyAuthUser(currentUser);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // Listen for BroadcastChannel from OAuth callback
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('daejin_oauth');
      bc.onmessage = async (event) => {
        if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
          const currentUser = await SupabaseService.getCurrentUser();
          if (currentUser) {
            await applyAuthUser(currentUser);
          }
        }
      };
    } catch (e) {}

    // Listen for localStorage changes across windows
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === 'daejin_oauth_completed' || e.key === 'daejin_supabase_auth_sync') {
        const currentUser = await SupabaseService.getCurrentUser();
        if (currentUser) {
          await applyAuthUser(currentUser);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Listen for Supabase OAuth return events
    let sub: { unsubscribe: () => void } | null = null;
    if (isRealSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          };
          await applyAuthUser(authUser);
        }
      });
      sub = data.subscription;
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      try {
        bc?.close();
      } catch (e) {}
      if (sub) sub.unsubscribe();
    };
  }, [loadUserData]);

  // 3. Periodic Deadline Scanning for Push Notifications
  useEffect(() => {
    if (!user || assignments.length === 0) return;

    // Run immediate scan
    scanAssignmentsForDeadlines(assignments, (log) => {
      setNotificationLogs((prev) => [log, ...prev]);
    });

    // Check every 60 seconds
    const interval = setInterval(() => {
      scanAssignmentsForDeadlines(assignments, (log) => {
        setNotificationLogs((prev) => [log, ...prev]);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [user, assignments]);

  // Auth Handlers
  const handleLoginSuccess = async (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(false);
    await loadUserData(loggedInUser.id);
  };

  const handleSignOut = async () => {
    await SupabaseService.signOut();
    setUser(null);
    setProfile(null);
    setAssignments([]);
  };

  // Profile Save Handler
  const handleProfileSave = (updated: UserProfile) => {
    setProfile(updated);
  };

  // Assignment Handlers
  const handleAddAssignment = async (data: {
    title: string;
    subject: string;
    dueDate: string;
    description: string;
    priority: AssignmentPriority;
  }) => {
    if (!user) return;
    const created = await SupabaseService.createAssignment({
      userId: user.id,
      title: data.title,
      subject: data.subject,
      dueDate: data.dueDate,
      description: data.description,
      priority: data.priority,
      status: 'pending',
    });

    setAssignments((prev) => [...prev, created]);

    // Rescan deadline for the new assignment
    scanAssignmentsForDeadlines([created], (log) => {
      setNotificationLogs((prevLogs) => [log, ...prevLogs]);
    });
  };

  const handleUpdateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const updated = await SupabaseService.updateAssignment(id, updates);
    if (updated) {
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    const ok = await SupabaseService.deleteAssignment(id);
    if (ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Quick Action: Add assignment with pre-filled subject from timetable card
  const handleAddAssignmentFromTimetable = (subject: string) => {
    setPresetSubject(subject);
    setIsAddAssignmentOpen(true);
    setActiveTab('assignments');
  };

  const unreadNotifCount = notificationLogs.filter((l) => !l.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        profile={profile}
        unreadCount={unreadNotifCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotifCenterOpen(true)}
        onSignOut={handleSignOut}
        onOpenSupabaseGuide={() => setIsSupabaseGuideOpen(true)}
      />

      {/* Profile Warning Banner for Logged-in students */}
      {user && (
        <ProfileBanner
          profile={profile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user ? (
          /* ================= Authenticated Student Dashboard ================= */
          <div className="space-y-6">
            {/* Student Welcome Strip */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-indigo-100 shrink-0">
                  <Image
                    src="/images/avatar_student_default_1791256196104.jpg"
                    alt="학생 아바타"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    {profile?.name ? `${profile.name} 학생` : '대진전자통신고 재학생'} 환영합니다!
                  </h1>
                  <p className="text-xs text-slate-500">
                    {profile?.grade && profile?.classNum
                      ? `대진전자통신고등학교 · ${profile.grade}학년 ${profile.classNum}반 (${profile.major || '전자통신과'})`
                      : '대진전자통신고등학교 · 학년/반 정보를 등록해주세요.'}
                  </p>
                </div>
              </div>

              {/* Quick tab switcher on mobile / header */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('timetable')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'timetable'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  시간표 조회
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'assignments'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  과제 관리 ({assignments.length})
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'notifications'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  푸시 알림
                </button>
                <button
                  onClick={() => setActiveTab('school')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'school'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  학교 정보
                </button>
              </div>
            </div>

            {/* Active Tab View */}
            {activeTab === 'timetable' && (
              <TimetableSection
                profile={profile}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onAddAssignmentWithSubject={handleAddAssignmentFromTimetable}
              />
            )}

            {activeTab === 'assignments' && (
              <AssignmentSection
                assignments={assignments}
                profile={profile}
                onAddAssignment={handleAddAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onOpenNotifications={() => setActiveTab('notifications')}
                presetSubject={presetSubject}
                isAddModalOpen={isAddAssignmentOpen}
                setIsAddModalOpen={setIsAddAssignmentOpen}
              />
            )}

            {activeTab === 'notifications' && (
              <PushNotificationManager
                assignments={assignments}
                logs={notificationLogs}
                onClearLogs={() => setNotificationLogs([])}
                onAddLog={(newLog) => setNotificationLogs((prev) => [newLog, ...prev])}
              />
            )}

            {activeTab === 'school' && <SchoolInfoCard />}
          </div>
        ) : (
          /* ================= Landing / Guest Welcome Section ================= */
          <div className="space-y-12 py-4">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-400/30">
                  <School className="w-3.5 h-3.5" />
                  <span>대진전자통신고등학교 공식 NEIS 시간표 & 과제 포털</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-balance">
                  스마트 시간표 조회 및<br className="hidden sm:inline" /> 과제 마감 기한 푸시 알림
                </h1>

                <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
                  NEIS 공공데이터로 본인 학년과 반의 실시간 수업 시간표를 자동 동기화하고,
                  과제 일정을 등록하여 마감 D-Day 및 D-1에 브라우저 푸시 알림을 받아보세요.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-black active:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-slate-900/40 inline-flex items-center gap-2.5 border border-slate-700"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub 계정으로 시작하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={async () => {
                      const demoUser = await SupabaseService.quickDemoLogin('existing');
                      handleLoginSuccess(demoUser);
                    }}
                    className="px-5 py-3 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 active:bg-white/15 rounded-xl transition-colors border border-white/10 backdrop-blur-xs"
                  >
                    2학년 3반 재학생 1초 체험하기
                  </button>
                </div>
              </div>

              {/* Decorative Background Glow */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* 3 Core Mechanisms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  NEIS 공공데이터 시간표 연동
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  나이스 교육정보 개방포털 OpenAPI를 통해 대진전자통신고(7150597) 본인 학년과 반의 주간 및 일일 수업 시간표를 실시간으로 조회합니다.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  원클릭 과제 등록 & D-Day 관리
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  시간표의 과목(전자회로, 프로그래밍 등)에서 원클릭으로 과제를 등록하고 마감 기한 및 진행 상태를 직관적인 대시보드로 관리합니다.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  마감 기한 브라우저 푸시 알림
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  과제 제출 마감 D-Day 및 D-1 시점에 Web Notification과 Service Worker 기반으로 화면에 즉시 알림을 띄워 제출을 놓치지 않게 돕습니다.
                </p>
              </div>
            </div>

            {/* School Overview Card */}
            <SchoolInfoCard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">대진전자통신고등학교</span>
            <span>·</span>
            <span>부산광역시 금정구 수림로 92</span>
            <span>·</span>
            <span className="font-mono">행정표준코드 7150597</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Supabase 환경 설정
            </button>
            <a
              href="https://open.neis.go.kr"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <span>나이스 교육정보 개방포털</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          profile={profile}
          onSaveSuccess={handleProfileSave}
        />
      )}

      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        logs={notificationLogs}
        onClearLogs={() => setNotificationLogs([])}
        onMarkAllAsRead={() => {
          setNotificationLogs((prev) => prev.map((l) => ({ ...l, read: true })));
        }}
        onOpenNotificationsTab={() => setActiveTab('notifications')}
      />

      <SupabaseGuideModal
        isOpen={isSupabaseGuideOpen}
        onClose={() => setIsSupabaseGuideOpen(false)}
      />
    </div>
  );
}
