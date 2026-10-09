/** Local-only fixtures for signed-in, inactive-broadcast UI checks. No upstream requests. */
export const demoSession = {
  userId: 1, email: 'demo@example.com', name: '로컬 테스트',
  accessToken: 'local-demo-access', refreshToken: 'local-demo-refresh',
};

export function demoResponse(method, rawUrl, authorization) {
  const url = new URL(rawUrl, 'http://localhost');
  const path = url.pathname;
  const ok = body => ({ status: 200, body });
  const error = (status, message) => ({ status, body: { message } });
  // Credentials are intentionally not read, stored, or validated. This is not authentication.
  if (method === 'POST' && path === '/api/v1/auth/login/email') return ok(demoSession);
  if (method === 'POST' && path === '/api/v1/auth/refresh') {
    return ok({ accessToken: demoSession.accessToken, refreshToken: demoSession.refreshToken });
  }
  if (authorization !== `Bearer ${demoSession.accessToken}`) return error(401, '로컬 샘플 로그인이 필요합니다.');
  if (method === 'POST' && path === '/api/v1/auth/logout') return ok({});
  if (method === 'GET' && path === '/api/v1/user/chzzk') {
    return ok({ authorized: false, accessTokenExpired: false, refreshTokenExpired: false });
  }
  if (method === 'GET' && path === '/api/v1/characters') {
    return ok({ content: [], page: 1, size: 10, hasNext: false });
  }
  if (method === 'GET' && path === '/api/v1/characters/settings') {
    return ok({ characterImages: [], vrmPresets: [], personaPresetTypes: [] });
  }
  if (method === 'GET' && ['/api/v1/stream/info', '/api/v1/stream/chat/stats'].includes(path)) {
    return error(404, '진행 중인 방송이 없습니다. (로컬 샘플)');
  }
  if (method === 'GET' && path === '/api/v1/broadcast/settings') return ok({ aiProactiveToChat: false });
  if (method === 'GET' && path === '/api/v1/broadcast/stats/month') {
    return ok({ broadcastMonthInfoList: [], broadcastYear: Number(url.searchParams.get('year')), broadcastMonth: Number(url.searchParams.get('month')) });
  }
  return error(501, '로컬 샘플에서 지원하지 않는 기능입니다. 실제 백엔드 연결이 필요합니다.');
}

export function demoMiddleware(req, res, next) {
  if (!req.url?.startsWith('/api/')) return next();
  const result = demoResponse(req.method, req.url, req.headers.authorization);
  req.resume();
  res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(result.body));
}
