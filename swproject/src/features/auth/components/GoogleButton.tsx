/**
 * @file Google OAuth 로그인 버튼 컴포넌트
 * @created Sprint 1 - Auth UI 컴포넌트
 * @migrated next-auth/react 제거 → Google OAuth 비활성화 (백엔드 OAuth 구현 전까지)
 * @usedBy src/pages/auth/LoginPage.tsx
 *
 * 참고: 현재 Google OAuth는 백엔드 API가 준비되지 않아 비활성화 상태입니다.
 * 백엔드 Google OAuth 엔드포인트가 구현되면 활성화할 것.
 */

interface GoogleButtonProps {
  label: string;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/**
 * Google 로그인 버튼
 * - 현재는 백엔드 OAuth 미구현으로 비활성화 상태
 * - 백엔드 준비 시 onClick에 Google OAuth 플로우 연결
 */
export default function GoogleButton({ label }: GoogleButtonProps) {
  return (
    <button
      type="button"
      disabled
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-gray-700 text-gray-400 cursor-not-allowed rounded-xl text-sm font-medium"
      title="백엔드 Google OAuth 구현 후 활성화"
    >
      <GoogleIcon />
      {label} (준비 중)
    </button>
  );
}
