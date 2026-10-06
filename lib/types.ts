export interface UserProfile {
  id: string;
  email: string;
  name: string;
  grade: number; // 1, 2, 3
  classNum: number; // 1 ~ 8
  major?: string; // 전자통신과, 스마트전자과, AI소프트웨어과 등
  studentNum?: string; // 번호 (예: 15번)
  schoolName: string; // 대진전자통신고등학교
  schoolCode: string; // 7150597
  officeCode: string; // C10
  notificationsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentPriority = 'urgent' | 'high' | 'medium' | 'low';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  subject: string;
  dueDate: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  description: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastNotifiedAt?: string; // to prevent duplicate spam notifications
}

export interface TimetablePeriod {
  perio: number; // 1 ~ 7
  subject: string;
  teacher?: string;
  classroom?: string;
  startTime: string; // "08:50"
  endTime: string;   // "09:40"
}

export interface DayTimetable {
  date: string; // YYYYMMDD
  formattedDate: string; // "10월 5일 (월)"
  dayOfWeek: number; // 1 (Mon) ~ 5 (Fri)
  dayName: string; // "월", "화", "수", "목", "금"
  periods: TimetablePeriod[];
  isToday?: boolean;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  assignmentId?: string;
  type: 'deadline_urgent' | 'deadline_d1' | 'deadline_dday' | 'system' | 'test';
  read: boolean;
}
