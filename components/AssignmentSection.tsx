'use client';

import React, { useState } from 'react';
import { Assignment, AssignmentPriority, UserProfile } from '@/lib/types';
import { getDeadlineInfo } from '@/lib/notifications';
import { 
  CheckSquare, 
  Square, 
  Clock, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Sparkles,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { AssignmentModal } from './AssignmentModal';

interface AssignmentSectionProps {
  assignments: Assignment[];
  profile: UserProfile | null;
  onAddAssignment: (data: {
    title: string;
    subject: string;
    dueDate: string;
    description: string;
    priority: AssignmentPriority;
  }) => Promise<void>;
  onUpdateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onOpenNotifications: () => void;
  presetSubject?: string;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export function AssignmentSection({
  assignments,
  profile,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onOpenNotifications,
  presetSubject = '',
  isAddModalOpen,
  setIsAddModalOpen,
}: AssignmentSectionProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'due_soon' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Assignment Stats
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const pendingCount = assignments.filter((a) => a.status !== 'completed').length;
  const dueSoonCount = assignments.filter((a) => {
    if (a.status === 'completed') return false;
    const info = getDeadlineInfo(a.dueDate);
    return info.severity === 'urgent' || info.severity === 'warning';
  }).length;

  // Filter assignments
  const filteredAssignments = assignments.filter((a) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (filterStatus === 'pending') {
      return a.status !== 'completed';
    }
    if (filterStatus === 'completed') {
      return a.status === 'completed';
    }
    if (filterStatus === 'due_soon') {
      if (a.status === 'completed') return false;
      const info = getDeadlineInfo(a.dueDate);
      return info.severity === 'urgent' || info.severity === 'warning';
    }
    return true;
  });

  // Toggle completion
  const handleToggleComplete = async (assignment: Assignment) => {
    const isCompleted = assignment.status === 'completed';
    await onUpdateAssignment(assignment.id, {
      status: isCompleted ? 'pending' : 'completed',
      completedAt: isCompleted ? null : new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">총 과제수</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalCount}</span>
            <span className="text-xs text-slate-400">건</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-rose-600 font-medium">마감 임박 (D-2)</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">{dueSoonCount}</span>
            <span className="text-xs text-rose-400">건 경보</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-indigo-200/80 shadow-xs">
          <span className="text-xs text-indigo-600 font-medium block mb-1">진행중 과제</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600 font-mono tabular-nums">{pendingCount}</span>
            <span className="text-xs text-indigo-400">건</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="text-xs text-emerald-600 font-medium block mb-1">제출 완료</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">{completedCount}</span>
            <span className="text-xs text-emerald-400">건</span>
          </div>
        </div>
      </div>

      {/* Controls: Search, Filter Tabs & Add Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Filter tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('due_soon')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'due_soon'
                ? 'bg-white text-rose-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            마감 임박 ({dueSoonCount})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'pending'
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            진행중 ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'completed'
                ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            완료 ({completedCount})
          </button>
        </div>

        {/* Right: Search Bar & Add Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과제명 또는 과목 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              setEditingAssignment(null);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 과제 등록</span>
          </button>
        </div>
      </div>

      {/* Push Notification Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-indigo-950">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            과제 마감 D-Day 및 D-1 시점에 <strong>브라우저 푸시 알림</strong>으로 자동 전송됩니다.
          </span>
        </div>
        <button
          onClick={onOpenNotifications}
          className="text-xs font-semibold text-indigo-700 hover:underline shrink-0 ml-2"
        >
          알림 설정 확인
        </button>
      </div>

      {/* Assignment List */}
      <div className="space-y-2.5">
        {filteredAssignments.map((assignment) => {
          const isDone = assignment.status === 'completed';
          const deadline = getDeadlineInfo(assignment.dueDate);
          const [dPart, tPart] = assignment.dueDate.split('T');

          return (
            <div
              key={assignment.id}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-slate-50/70 border-slate-200 opacity-75'
                  : deadline.severity === 'urgent'
                  ? 'bg-white border-rose-300 shadow-xs ring-1 ring-rose-200'
                  : deadline.severity === 'warning'
                  ? 'bg-white border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(assignment)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    title={isDone ? '미완료로 변경' : '제출 완료로 변경'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 hover:text-slate-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                        {assignment.subject}
                      </span>

                      {/* D-Day Badge */}
                      {!isDone ? (
                        <span className={`px-2 py-0.5 rounded-sm font-mono font-bold text-[11px] border ${deadline.badgeColor}`}>
                          {deadline.dDayText}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                          제출 완료
                        </span>
                      )}

                      {/* Priority */}
                      {assignment.priority === 'urgent' && !isDone && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-xs">
                          긴급
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-sm font-bold text-slate-900 ${
                        isDone ? 'line-through text-slate-400 font-normal' : ''
                      }`}
                    >
                      {assignment.title}
                    </h3>

                    {/* Description */}
                    {assignment.description && (
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                        {assignment.description}
                      </p>
                    )}

                    {/* Due Date & Timestamp */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>마감: {dPart} {tPart ? tPart.substring(0, 5) : '23:59'}</span>
                      </span>
                      {assignment.completedAt && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">
                            완료: {assignment.completedAt.substring(0, 10)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingAssignment(assignment);
                      setIsAddModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`'${assignment.title}' 과제를 삭제하시겠습니까?`)) {
                        onDeleteAssignment(assignment.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {searchQuery || filterStatus !== 'all' ? '조건에 맞는 과제가 없습니다.' : '등록된 과제가 없습니다.'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? '다른 검색어를 입력하시거나 필터를 변경해보세요.'
                : '시간표 수업에서 과제를 가져오거나 새 과제를 등록해보세요.'}
            </p>
            <button
              onClick={() => {
                setEditingAssignment(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 과제 등록하기</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <AssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={async (data) => {
          if (editingAssignment) {
            await onUpdateAssignment(editingAssignment.id, data);
          } else {
            await onAddAssignment(data);
          }
        }}
        initialSubject={presetSubject}
        editingAssignment={editingAssignment}
      />
    </div>
  );
}
