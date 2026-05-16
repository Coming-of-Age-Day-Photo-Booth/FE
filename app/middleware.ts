import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 사용자 접속 주소 확인
  const { pathname } = request.nextUrl;

  // 2. if 관리자 페이지('/kim/admin') 접근 시
  if (pathname.startsWith('/kim/admin')) {
    
    // 3. 브라우저에 백엔드가 준 '어드민 전용 인증 쿠키'의 존재 확인
    const isAdminLoggedIn = request.cookies.get('admin_token');

    // 4. if 쿠키가 없을 시, 도메인을 강제로 메인 화면('/')으로 튕기기
    if (!isAdminLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 조건에 안 걸림 : 정상 통과
  return NextResponse.next();
}