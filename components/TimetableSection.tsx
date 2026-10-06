'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, DayTimetable, TimetablePeriod } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  CheckCircle, 
  RotateCw, 
  BookOpen, 
  UserCheck, 
  Sparkles,
  MapPin,
  School
} from 'lucide-react';

interface TimetableSectionProps {
  profile: UserProfile | null;
  onOpenProfileModal: () => void;
  onAddAssignmentWithSubject: (subject: string) => void;
}

export function TimetableSection({
  profile,
  onOpenProfileModal,
  onAddAssignmentWithSubject,
}: TimetableSectionProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    days: DayTimetable[];
    currentActivePeriod: number | null;
    meta: { dataSource: string; neisConnected: boolean; note: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const [refreshKey, setRefreshKey] = useState(0);

  const isProfileConfigured = Boolean(profile && profile.grade && profile.classNum);

  useEffect(() => {
    if (!profile?.grade || !profile?.classNum) return;

    let isMounted = true;
    const loadTimetable = async () => {
      setLoading(true);
      setError(null);

      try {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${y}${m}${d}`;

        const res = await fetch(
          `/api/timetable?grade=${profile.grade}&classNum=${profile.classNum}&date=${dateStr}`
        );

        if (!res.ok) {
          throw new Error('시간표 데이터를 불러오지 못했습니다.');
        }

        const json = await res.json();
        if (!isMounted) return;
        setData(json);

        if (json.days && json.days.length > 0) {
          const todayIdx = json.days.findIndex((item: DayTimetable) => item.isToday);
          setActiveDayIndex(todayIdx !== -1 ? todayIdx : 0);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || '시간표 조회 중 오류가 발생했습니다.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTimetable();

    return () => {
      isMounted = false;
    };
  }, [profile?.grade, profile?.classNum, selectedDate, refreshKey]);

  // Navigate week
  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // If student profile is missing
  if (!isProfileConfigured) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          대진전자통신고 시간표 조회 대기
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          본인의 <strong>학년</strong>과 <strong>반</strong> 정보를 등록해야 NEIS 교육정보 포털에서
          정확한 주간 수업 시간표를 불러올 수 있습니다.
        </p>
        <button
          onClick={onOpenProfileModal}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-2"
        >
          <span>학년 및 반 등록하기</span>
        </button>
      </div>
    );
  }

  const activeDay = data?.days ? data.days[activeDayIndex] : null;

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Class Info & School Tag */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 mb-1">
            <School className="w-3.5 h-3.5" />
            <span>대진전자통신고등학교 ({profile?.major || '전자통신과'})</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {profile?.grade}학년 {profile?.classNum}반 주간 시간표
            </h2>
            <button
              onClick={onOpenProfileModal}
              className="text-xs text-slate-500 hover:text-indigo-600 underline"
            >
              반 변경
            </button>
          </div>
          {data?.meta && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${data.meta.neisConnected ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              <span>{data.meta.note}</span>
            </p>
          )}
        </div>

        {/* Right: Date Navigation & Mode Switch */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
          {/* Week Mode Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              주간 매트릭스
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              요일별 상세
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="이전 주"
              aria-label="이전 주"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              오늘
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="다음 주"
              aria-label="다음 주"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="새로고침"
              aria-label="새로고침"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Tabs for quick switching */}
      {data?.days && (
        <div className="grid grid-cols-5 gap-2">
          {data.days.map((day, idx) => (
            <button
              key={day.date}
              onClick={() => {
                setActiveDayIndex(idx);
                if (viewMode === 'week') {
                  // Keep week but select day
                }
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeDayIndex === idx
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                  : day.isToday
                  ? 'border-indigo-300 bg-white hover:bg-slate-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${activeDayIndex === idx ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {day.dayName}요일
                </span>
                {day.isToday && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                    오늘
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500">
                {day.date.substring(4, 6)}.{day.date.substring(6, 8)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {day.periods.length}교시 편성
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <RotateCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">NEIS 공공데이터 시간표 동기화 중...</p>
        </div>
      )}

      {/* Mode 1: Week Matrix View (Full 5 days side by side on desktop, stacked on mobile) */}
      {viewMode === 'week' && data?.days && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <div className="min-w-[760px] grid grid-cols-5 divide-x divide-slate-200">
              {data.days.map((day, dIdx) => (
                <div key={day.date} className={`flex flex-col ${day.isToday ? 'bg-indigo-50/20' : ''}`}>
                  {/* Column Header */}
                  <div className={`p-3 border-b border-slate-200 text-center ${day.isToday ? 'bg-indigo-50/70' : 'bg-slate-50/80'}`}>
                    <span className="text-xs font-bold text-slate-800 block">
                      {day.dayName}요일
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      {day.date.substring(4, 6)}월 {day.date.substring(6, 8)}일
                    </span>
                  </div>

                  {/* Period Cards */}
                  <div className="p-2 space-y-2 flex-1">
                    {day.periods.map((period) => {
                      const isCurrentPeriod = day.isToday && data.currentActivePeriod === period.perio;
                      return (
                        <div
                          key={period.perio}
                          className={`group relative p-2.5 rounded-lg border transition-all ${
                            isCurrentPeriod
                              ? 'border-indigo-500 bg-indigo-50/90 shadow-xs ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {period.perio}교시
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {period.startTime}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {period.subject}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="truncate max-w-[80px]">
                              {period.classroom || '일반교실'}
                            </span>
                            {period.teacher && (
                              <span className="text-slate-400">{period.teacher}T</span>
                            )}
                          </div>

                          {/* Quick Add Assignment Button on hover */}
                          <div className="mt-2 pt-1.5 border-t border-slate-100/80 flex justify-end">
                            <button
                              onClick={() => onAddAssignmentWithSubject(period.subject)}
                              className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                              title={`${period.subject} 과제 등록`}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>과제 등록</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {day.periods.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        수업 일정이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Single Day Focused View */}
      {viewMode === 'day' && activeDay && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-indigo-600 font-semibold">
                {activeDay.formattedDate}
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {activeDay.dayName}요일 상세 일정
              </h3>
            </div>
            {activeDay.isToday && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                오늘의 수업
              </span>
            )}
          </div>

          <div className="space-y-3">
            {activeDay.periods.map((period) => {
              const isCurrentPeriod = activeDay.isToday && data?.currentActivePeriod === period.perio;

              return (
                <div
                  key={period.perio}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCurrentPeriod
                      ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-xs font-bold text-slate-800">{period.perio}</span>
                      <span className="text-[10px] text-slate-500">교시</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {period.subject}
                        </h4>
                        {isCurrentPeriod && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-600 text-white animate-pulse">
                            현재 수업 중
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{period.startTime} ~ {period.endTime}</span>
                        </span>
                        <span>·</span>
                        <span>{period.classroom || '교실'}</span>
                        {period.teacher && (
                          <>
                            <span>·</span>
                            <span>담당: {period.teacher} 선생님</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddAssignmentWithSubject(period.subject)}
                    className="self-end sm:self-auto px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>과제 등록하기</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
