import { Assignment, NotificationLog } from './types';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// Play gentle dual-tone notification chime using Web Audio API
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Tone 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: A5 (880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Audio context may be restricted by autoplay policy
  }
}

// Check notification permission
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

// Request permission
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

// Send browser push notification
export async function sendBrowserPushNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    sound?: boolean;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  if (options.sound !== false) {
    playNotificationChime();
  }

  try {
    // Try via service worker registration first
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: options.badge || '/badge.png',
          tag: options.tag || 'daejin-assignment',
          data: { url: options.url || '/' },
        });
        return true;
      }
    }

    // Direct Notification constructor fallback
    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag || 'daejin-assignment',
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (err) {
    console.error('Failed to send browser notification:', err);
    return false;
  }
}

// Calculate remaining hours and D-Day string
export function getDeadlineInfo(dueDateIso: string): {
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  hoursRemaining: number;
  dDayText: string;
  badgeColor: string;
  severity: 'urgent' | 'warning' | 'normal' | 'overdue';
} {
  const now = new Date();
  const due = new Date(dueDateIso);
  const diffMs = due.getTime() - now.getTime();
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  // Reset hours to compare calendar days
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const dayDiff = Math.round((dueDayStart - todayStart) / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return {
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      hoursRemaining,
      dDayText: `기한초과 (${Math.abs(hoursRemaining)}시간 전)`,
      badgeColor: 'text-red-600 bg-red-50 border-red-200',
      severity: 'overdue',
    };
  }

  if (dayDiff === 0) {
    return {
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      hoursRemaining,
      dDayText: hoursRemaining <= 3 ? `D-DAY (${hoursRemaining}시간 남음!)` : 'D-DAY (오늘 마감)',
      badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
      severity: 'urgent',
    };
  }

  if (dayDiff === 1) {
    return {
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      hoursRemaining,
      dDayText: `D-1 (내일 마감)`,
      badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
      severity: 'warning',
    };
  }

  return {
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    hoursRemaining,
    dDayText: `D-${dayDiff}`,
    badgeColor: 'text-slate-600 bg-slate-50 border-slate-200',
    severity: 'normal',
  };
}

// Scan assignments and trigger notification for upcoming deadlines
export function scanAssignmentsForDeadlines(
  assignments: Assignment[],
  onNotify: (log: NotificationLog) => void
): void {
  const pendingAssignments = assignments.filter((a) => a.status !== 'completed');

  for (const assign of pendingAssignments) {
    const info = getDeadlineInfo(assign.dueDate);

    // Only notify if within 24 hours (today) or 48 hours (tomorrow)
    if (info.severity === 'urgent' || info.severity === 'warning') {
      const storageKey = `daejin_notified_${assign.id}_${info.isToday ? 'dday' : 'd1'}`;
      const alreadyNotified = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;

      if (!alreadyNotified) {
        const title = info.isToday
          ? `⏰ [마감임박] ${assign.subject} 과제 마감 안내`
          : `📢 [내일마감] ${assign.subject} 과제 알림`;

        const body = `"${assign.title}" - ${info.dDayText}. 제출을 잊지 마세요!`;

        // Send browser push notification
        sendBrowserPushNotification(title, {
          body,
          tag: `assignment-${assign.id}`,
        });

        // Add to notification center log
        const log: NotificationLog = {
          id: `log-${Date.now()}-${assign.id}`,
          title,
          message: body,
          timestamp: new Date().toISOString(),
          assignmentId: assign.id,
          type: info.isToday ? 'deadline_dday' : 'deadline_d1',
          read: false,
        };
        onNotify(log);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, 'true');
        }
      }
    }
  }
}
