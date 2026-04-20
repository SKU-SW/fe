import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account }) {
      // Google OAuth 완료 후 백엔드에 토큰 전달하여 백엔드 JWT 수신
      // TODO: 백엔드 Google 로그인 엔드포인트 확인 후 연결
      if (account?.provider === 'google' && account.access_token) {
        token.googleAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});