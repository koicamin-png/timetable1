'use client';

import React from 'react';
import Image from 'next/image';
import { School, MapPin, Phone, Globe, ExternalLink, Calendar, Building, Award } from 'lucide-react';

export function SchoolInfoCard() {
  return (
    <div className="space-y-4">
      {/* Hero Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-64 w-full bg-slate-900">
          <Image
            src="/images/hero_school_campus_1791256185126.jpg"
            alt="대진전자통신고등학교 캠퍼스"
            fill
            className="object-cover opacity-85"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-indigo-600 text-white inline-block mb-1">
              부산광역시교육청 특성화고등학교
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              대진전자통신고등학교
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono">
              Daejin High School of Electronics & Communication
            </p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>교육행정 표준 학교 정보</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">시도교육청</span>
                <span className="font-bold text-slate-800">부산광역시교육청 (C10)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">행정표준 학교코드</span>
                <span className="font-mono font-bold text-indigo-700">7150597</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">학교 유형</span>
                <span className="font-medium text-slate-800">고등학교 (특성화고 / 전문계)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">설립 및 성별 구분</span>
                <span className="font-medium text-slate-800">사립 · 남녀공학 (주간)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">도로명 주소</span>
                <span className="font-medium text-slate-800 text-right">
                  부산 금정구 수림로 92 (우편번호 46247)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">대표 전화번호</span>
                <span className="font-mono font-bold text-slate-800">051-582-8100</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">팩스번호</span>
                <span className="font-mono text-slate-700">051-582-8120</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">설립일자</span>
                <span className="font-mono text-slate-800">1995년 10월 30일</span>
              </div>
            </div>
          </div>

          {/* Links & NEIS Public Data Portal Reference */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <a
              href="http://www.pdj.hs.kr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>학교 공식 홈페이지 (www.pdj.hs.kr)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://open.neis.go.kr/portal/data/service/selectServicePage.do?page=1&rows=10&sortColumn=&sortDirection=&infId=OPEN18620200826103326268120&infSeq=2"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <span>NEIS 고등학교 시간표 공공데이터 서비스</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
