import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Assignment } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isRealSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon')
);

// Real client or mock client
let supabaseInstance: SupabaseClient | null = null;

if (isRealSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Supabase initialization error, falling back to local client:', err);
  }
}

export const supabase = supabaseInstance;

// Local Storage Keys for Mock / Offline Persistence
const LOCAL_STORAGE_USER_KEY = 'daejin_supabase_auth_user';
const LOCAL_STORAGE_PROFILE_KEY = 'daejin_supabase_profiles';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'daejin_supabase_assignments';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    user_name?: string;
    avatar_url?: string;
    provider?: string;
  };
}

// Client helper that works seamlessly with either real Supabase or local sandbox
export class SupabaseService {
  // Check auth user
  static async getCurrentUser(): Promise<AuthUser | null> {
    if (isRealSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        };
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata,
      };
    }

    // Local sandbox
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  // Sign in with GitHub OAuth
  static async signInWithGithub(): Promise<{ success: boolean; url?: string; message?: string }> {
    if (isRealSupabaseConfigured && supabase) {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error) return { success: false, message: error.message };
      return { success: true, url: data.url };
    }

    // Local Sandbox Simulation
    if (typeof window !== 'undefined') {
      const mockGithubUser: AuthUser = {
        id: 'github-user-7150597',
        email: 'daejin.tech@github.com',
        user_metadata: {
          full_name: '김대진 (GitHub)',
          user_name: 'daejin-electronics',
          provider: 'github',
          avatar_url: '/images/avatar_student_default_1791256196104.jpg',
        },
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockGithubUser));
      return { success: true, message: 'GitHub 계정으로 로그인되었습니다.' };
    }

    return { success: false, message: '로그인 실패' };
  }

  // Quick Demo / Reviewer Login
  static async quickDemoLogin(type: 'new' | 'existing' = 'existing'): Promise<AuthUser> {
    const demoUser: AuthUser = {
      id: type === 'new' ? `student-gh-${Date.now()}` : 'student-daejin-github',
      email: type === 'new' ? 'newbie.gh@pdj.hs.kr' : 'student.gh@pdj.hs.kr',
      user_metadata: {
        full_name: type === 'new' ? '신규 학생 (GitHub)' : '이민우 (2학년 3반)',
        user_name: 'minwoo-daejin',
        provider: 'github',
      },
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
      if (type === 'existing') {
        // Seed default profile if not exists
        const profiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY) || '{}');
        if (!profiles[demoUser.id]) {
          profiles[demoUser.id] = {
            id: demoUser.id,
            email: demoUser.email,
            name: '이민우',
            grade: 2,
            classNum: 3,
            major: '전자통신과',
            studentNum: '18번',
            schoolName: '대진전자통신고등학교',
            schoolCode: '7150597',
            officeCode: 'C10',
            notificationsEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profiles));
        }

        // Seed initial assignments for Daejin High School
        const allAssignments = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '[]');
        if (allAssignments.filter((a: Assignment) => a.userId === demoUser.id).length === 0) {
          const now = new Date();
          const todayPlus1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const todayPlus3 = new Date(now.getTime() + 72 * 60 * 60 * 1000);
          const sampleAssignments: Assignment[] = [
            {
              id: 'assign-1',
              userId: demoUser.id,
              title: '전자회로 R-L-C 과도현상 오실로스코프 파형 측정 보고서',
              subject: '전자회로',
              dueDate: todayPlus1.toISOString().split('T')[0] + 'T23:59:00',
              description: '실습 3실 브레드보드 측정값 표 작성 및 주파수 응답 파형 캡처 제출',
              priority: 'urgent',
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'assign-2',
              userId: demoUser.id,
              title: 'C언어 포인터와 구조체 배열 활용 통신 패킷 파서 구현',
              subject: '프로그래밍',
              dueDate: todayPlus3.toISOString().split('T')[0] + 'T18:00:00',
              description: 'CRC 체크섬 함수 및 소스코드 주석 작성하여 e-학습터에 압축파일 제출',
              priority: 'high',
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'assign-3',
              userId: demoUser.id,
              title: '정보통신망 OSI 7계층과 TCP/IP 모델 비교 서술형 과제',
              subject: '정보통신',
              dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:00',
              description: '라우팅 프로토콜(RIP vs OSPF) 특징 요약 정리',
              priority: 'medium',
              status: 'completed',
              completedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ];
          localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify([...allAssignments, ...sampleAssignments]));
        }
      }
    }
    return demoUser;
  }

  // Sign Out
  static async signOut(): Promise<void> {
    if (isRealSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }

  // Get Profile
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        grade: Number(data.grade),
        classNum: Number(data.class_num),
        major: data.major,
        studentNum: data.student_num,
        schoolName: data.school_name || '대진전자통신고등학교',
        schoolCode: data.school_code || '7150597',
        officeCode: data.office_code || 'C10',
        notificationsEnabled: data.notifications_enabled ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Local Sandbox
    if (typeof window === 'undefined') return null;
    const profiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY) || '{}');
    return profiles[userId] || null;
  }

  // Upsert Profile
  static async saveProfile(profile: Partial<UserProfile> & { id: string; email: string }): Promise<UserProfile> {
    const updated: UserProfile = {
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      grade: profile.grade || 1,
      classNum: profile.classNum || 1,
      major: profile.major || '전자통신과',
      studentNum: profile.studentNum || '',
      schoolName: '대진전자통신고등학교',
      schoolCode: '7150597',
      officeCode: 'C10',
      notificationsEnabled: profile.notificationsEnabled ?? true,
      updatedAt: new Date().toISOString(),
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    if (isRealSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        grade: updated.grade,
        class_num: updated.classNum,
        major: updated.major,
        student_num: updated.studentNum,
        school_name: updated.schoolName,
        school_code: updated.schoolCode,
        office_code: updated.officeCode,
        notifications_enabled: updated.notificationsEnabled,
        updated_at: updated.updatedAt,
      });
      return updated;
    }

    // Local Sandbox
    if (typeof window !== 'undefined') {
      const profiles = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY) || '{}');
      profiles[profile.id] = updated;
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profiles));
    }
    return updated;
  }

  // Get Assignments
  static async getAssignments(userId: string): Promise<Assignment[]> {
    if (isRealSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        subject: d.subject,
        dueDate: d.due_date,
        description: d.description || '',
        priority: d.priority || 'medium',
        status: d.status || 'pending',
        completedAt: d.completed_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }

    // Local Sandbox
    if (typeof window === 'undefined') return [];
    const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '[]');
    return all.filter((a: Assignment) => a.userId === userId);
  }

  // Create Assignment
  static async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> {
    const newId = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullAssignment: Assignment = {
      ...assignment,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isRealSupabaseConfigured && supabase) {
      const { data } = await supabase.from('assignments').insert({
        user_id: fullAssignment.userId,
        title: fullAssignment.title,
        subject: fullAssignment.subject,
        due_date: fullAssignment.dueDate,
        description: fullAssignment.description,
        priority: fullAssignment.priority,
        status: fullAssignment.status,
        completed_at: fullAssignment.completedAt || null,
      }).select().single();

      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          subject: data.subject,
          dueDate: data.due_date,
          description: data.description,
          priority: data.priority,
          status: data.status,
          completedAt: data.completed_at,
          createdAt: data.created_at,
        };
      }
    }

    // Local Sandbox
    if (typeof window !== 'undefined') {
      const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '[]');
      all.push(fullAssignment);
      localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(all));
    }
    return fullAssignment;
  }

  // Update Assignment
  static async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
    if (isRealSupabaseConfigured && supabase) {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

      const { data } = await supabase.from('assignments').update(dbUpdates).eq('id', id).select().single();
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        subject: data.subject,
        dueDate: data.due_date,
        description: data.description,
        priority: data.priority,
        status: data.status,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Local Sandbox
    if (typeof window === 'undefined') return null;
    const all: Assignment[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '[]');
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(all));
    return all[index];
  }

  // Delete Assignment
  static async deleteAssignment(id: string): Promise<boolean> {
    if (isRealSupabaseConfigured && supabase) {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      return !error;
    }

    if (typeof window === 'undefined') return false;
    const all: Assignment[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY) || '[]');
    const filtered = all.filter((a) => a.id !== id);
    localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(filtered));
    return true;
  }
}

// SQL Schema string for user documentation
export const SUPABASE_SQL_SCHEMA = `-- 대진전자통신고등학교 스마트 대시보드 Supabase SQL 스키마
-- Supabase 대시보드 -> SQL Editor 에서 아래 코드를 실행해주세요.

-- 1. 학생 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  grade INT DEFAULT 1,
  class_num INT DEFAULT 1,
  major TEXT DEFAULT '전자통신과',
  student_num TEXT DEFAULT '',
  school_name TEXT DEFAULT '대진전자통신고등학교',
  school_code TEXT DEFAULT '7150597',
  office_code TEXT DEFAULT 'C10',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 과제 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security(RLS) 보안 정책 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자 본인 프로필 조회 및 수정" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "사용자 본인 과제 등록 및 관리" ON public.assignments
  FOR ALL USING (auth.uid() = user_id);
`;
