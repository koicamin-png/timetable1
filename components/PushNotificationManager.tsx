'use client';

import React, { useState, useEffect } from 'react';
import { Assignment, NotificationLog } from '@/lib/types';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  sendBrowserPushNotification,
  playNotificationChime,
  getDeadlineInfo,
  NotificationPermissionStatus
} from '@/lib/notifications';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Volume2, 
  Send, 
  Clock, 
  Trash2, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

interface PushNotificationManagerProps {
  assignments: Assignment[];
  logs: NotificationLog[];
  onClearLogs: () => void;
  onAddLog: (log: NotificationLog) => void;
}

export function PushNotificationManager({
  assignments,
  logs,
  onClearLogs,
  onAddLog,
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => getNotificationPermissionStatus());
  const [testSent, setTestSent] = useState(false);

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermission(status);
    if (status === 'granted') {
      sendBrowserPushNotification('대진전자통신고 알림 설정 완료', {
        body: '과제 마감 기한 푸시 알림이 정상적으로 활성화되었습니다.',
      });
      onAddLog({
        id: `log-perm-${Date.now()}`,
        title: '알림 권한 승인 완료',
        message: '브라우저 푸시 알림 수신이 활성화되었습니다.',
        timestamp: new Date().toISOString(),
        type: 'system',
        read: false,
      });
    }
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    playNotificationChime();

    const testTitle = '⏰ [테스트 알림] 전자회로 실습과제 마감 임박!';
    const testBody = '대진전자통신고 포털: 마감까지 2시간 남았습니다. 제출을 확인하세요.';

    await sendBrowserPushNotification(testTitle, {
      body: testBody,
      tag: 'test-notification',
    });

    onAddLog({
      id: `log-test-${Date.now()}`,
      title: testTitle,
      message: testBody,
      timestamp: new Date().toISOString(),
      type: 'test',
      read: false,
    });

    setTimeout(() => setTestSent(false), 2000);
  };

  // Impending assignments
  const impendingList = assignments.filter((a) => {
    if (a.status === 'completed') return false;
    const info = getDeadlineInfo(a.dueDate);
    return info.severity === 'urgent' || info.severity === 'warning';
  });

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              permission === 'granted'
                ? 'bg-emerald-50 text-emerald-600'
                : permission === 'denied'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  과제 마감 기한 푸시 알림 엔진
                </h3>
                {permission === 'granted' && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>실시간 알림 켜짐</span>
                  </span>
                )}
                {permission === 'denied' && (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>브라우저에서 차단됨</span>
                  </span>
                )}
                {permission === 'default' && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>권한 승인 대기중</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                웹 브라우저의 Web Notification API 및 Service Worker를 통해 과제 마감 D-Day 및 D-1 시점에 바탕화면 푸시를 전송합니다.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                브라우저 알림 권한 켜기
              </button>
            )}

            <button
              onClick={handleSendTestNotification}
              disabled={testSent}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>{testSent ? '발송 완료!' : '알림 즉시 테스트'}</span>
            </button>

            <button
              onClick={() => playNotificationChime()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="알림 사운드 효과음 미리듣기"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* How it works info */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="font-bold text-slate-800 block mb-1">1. D-1 사전 알림</span>
            <p className="text-slate-500 text-[11px]">
              마감일 24시간 전에 미리 제출 준비를 할 수 있도록 자동 알림을 발송합니다.
            </p>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
            <span className="font-bold text-rose-800 block mb-1">2. D-Day 긴급 알림</span>
            <p className="text-rose-600 text-[11px]">
              오늘 마감되는 과제를 우선 강조하며 소리 및 팝업으로 전달합니다.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="font-bold text-slate-800 block mb-1">3. 서비스워커 지원</span>
            <p className="text-slate-500 text-[11px]">
              백그라운드 서비스 워커(sw.js)와 연동되어 클릭 시 해당 과제로 바로 이동합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Impending Target Assignments List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>현재 알림 감시대상 과제 (마감 임박)</span>
          <span className="text-xs font-mono font-normal text-slate-500">{impendingList.length}건 감시중</span>
        </h4>

        {impendingList.length > 0 ? (
          <div className="space-y-2">
            {impendingList.map((item) => {
              const info = getDeadlineInfo(item.dueDate);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-sm">
                      {item.subject}
                    </span>
                    <span className="font-medium text-slate-900 line-clamp-1">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className={`px-2 py-0.5 rounded-sm font-bold ${info.badgeColor}`}>
                      {info.dDayText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            현재 48시간 이내에 마감되는 긴급 과제가 없습니다. 여유로운 상태입니다!
          </p>
        )}
      </div>

      {/* Notification Activity History Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-900">
            알림 발송 내역 ({logs.length})
          </h4>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>내역 지우기</span>
            </button>
          )}
        </div>

        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-bold text-slate-800">{log.title}</h5>
                  <p className="text-slate-600 mt-0.5">{log.message}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            아직 수신된 알림 내역이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
