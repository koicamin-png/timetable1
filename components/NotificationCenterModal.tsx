'use client';

import React from 'react';
import { X, Bell, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { NotificationLog } from '@/lib/types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  onClearLogs: () => void;
  onMarkAllAsRead: () => void;
  onOpenNotificationsTab: () => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onMarkAllAsRead,
  onOpenNotificationsTab,
}: NotificationCenterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              알림 센터 ({logs.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                모두 읽음
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border text-xs transition-colors ${
                  !log.read
                    ? 'border-indigo-200 bg-indigo-50/30'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900">{log.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{log.message}</p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>도착한 새 알림이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenNotificationsTab();
            }}
            className="text-indigo-600 font-semibold hover:underline"
          >
            푸시 알림 상세 설정 &rarr;
          </button>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-slate-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>지우기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
