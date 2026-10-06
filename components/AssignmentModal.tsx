'use client';

import React, { useState } from 'react';
import { Assignment, AssignmentPriority } from '@/lib/types';
import { X, Check } from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    subject: string;
    dueDate: string;
    description: string;
    priority: AssignmentPriority;
  }) => Promise<void>;
  initialSubject?: string;
  editingAssignment?: Assignment | null;
}

const COMMON_SUBJECTS = [
  '전자회로',
  '정보통신망',
  '프로그래밍',
  '전기전자측정',
  '전자CAD실습',
  '스마트센서응용',
  '실용수학',
  '실무영어',
  '문학',
  '한국사',
  '공업일반',
];

function AssignmentModalForm({
  onClose,
  onSave,
  initialSubject = '',
  editingAssignment = null,
}: {
  onClose: () => void;
  onSave: (data: {
    title: string;
    subject: string;
    dueDate: string;
    description: string;
    priority: AssignmentPriority;
  }) => Promise<void>;
  initialSubject?: string;
  editingAssignment?: Assignment | null;
}) {
  const getDefaultDate = () => {
    if (editingAssignment) {
      return editingAssignment.dueDate.split('T')[0];
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDefaultTime = () => {
    if (editingAssignment) {
      const parts = editingAssignment.dueDate.split('T');
      return parts[1] ? parts[1].substring(0, 5) : '23:59';
    }
    return '23:59';
  };

  const [title, setTitle] = useState(editingAssignment?.title || '');
  const [subject, setSubject] = useState(editingAssignment?.subject || initialSubject || '전자회로');
  const [dueDate, setDueDate] = useState(getDefaultDate);
  const [dueTime, setDueTime] = useState(getDefaultTime);
  const [description, setDescription] = useState(editingAssignment?.description || '');
  const [priority, setPriority] = useState<AssignmentPriority>(editingAssignment?.priority || 'medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('과제명을 입력해주세요.');
      return;
    }
    if (!subject.trim()) {
      setError('과목명을 입력해주세요.');
      return;
    }
    if (!dueDate) {
      setError('마감 날짜를 지정해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullIsoDueDate = `${dueDate}T${dueTime || '23:59'}:00`;
      await onSave({
        title: title.trim(),
        subject: subject.trim(),
        dueDate: fullIsoDueDate,
        description: description.trim(),
        priority,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || '과제 저장 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingAssignment ? '과제 정보 수정' : '새 과제 등록'}
            </h3>
            <p className="text-xs text-slate-500">
              대진전자통신고 마감 일정 등록 및 푸시 알림 설정
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Subject with Quick Selection Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              과목명 *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 전자회로, 프로그래밍, 정보통신망..."
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SUBJECTS.slice(0, 6).map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    subject === sub
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              과제 제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 3단원 오실로스코프 파형 측정 및 실험 보고서 작성"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                마감 날짜 *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                마감 시각
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              중요도
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'urgent', label: '긴급', color: 'border-rose-400 bg-rose-50 text-rose-700' },
                { id: 'high', label: '높음', color: 'border-amber-400 bg-amber-50 text-amber-700' },
                { id: 'medium', label: '보통', color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
                { id: 'low', label: '낮음', color: 'border-slate-300 bg-slate-50 text-slate-700' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as AssignmentPriority)}
                  className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                    priority === p.id
                      ? `${p.color} ring-1 ring-current font-bold`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              상세 설명 및 제출 방법 (선택)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="제출 장소, e-학습터 링크, 제출 양식, 준비물 등 메모"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
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
                  <span>{editingAssignment ? '수정 완료' : '과제 등록하기'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssignmentModal(props: AssignmentModalProps) {
  if (!props.isOpen) return null;
  return (
    <AssignmentModalForm
      key={props.editingAssignment ? props.editingAssignment.id : (props.initialSubject || 'new')}
      {...props}
    />
  );
}
