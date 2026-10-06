import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '대진전자통신고 스마트 시간표 & 과제 알리미',
  description: '대진전자통신고등학교 학생을 위한 NEIS 공공데이터 실시간 시간표 조회, 과제 등록 관리 및 마감 기한 푸시 알림 서비스',
  openGraph: {
    title: '대진전자통신고 스마트 시간표 & 과제 알리미',
    description: '대진전자통신고등학교 학생을 위한 NEIS 공공데이터 실시간 시간표 조회, 과제 등록 관리 및 마감 기한 푸시 알림 서비스',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '대진전자통신고 스마트 시간표 & 과제 알리미',
    description: '대진전자통신고등학교 학생을 위한 NEIS 공공데이터 실시간 시간표 조회, 과제 등록 관리 및 마감 기한 푸시 알림 서비스',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
