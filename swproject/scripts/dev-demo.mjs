/** Start the existing UI with local fixtures on a separate loopback origin. */
import { createServer } from 'vite';
import { demoMiddleware } from './demo-api.mjs';

const server = await createServer({
  mode: 'demo',
  define: {
    'import.meta.env.VITE_WS_URL': JSON.stringify('ws://127.0.0.1:5174'),
    'import.meta.env.VITE_IMAGE_BASE_URL': JSON.stringify('http://127.0.0.1:5174'),
  },
  server: { host: '127.0.0.1', port: 5174, strictPort: true, open: false },
  plugins: [{
    name: 'local-demo-fixtures',
    apply: 'serve',
    configureServer(vite) {
      // Replace the normal API proxy. Unknown endpoints must never reach a real backend.
      vite.config.server.proxy = {};
      vite.middlewares.use(demoMiddleware);
    },
    transformIndexHtml() {
      return [{ tag: 'style', children: '#root .h-screen{height:calc(100dvh - 52px)} #root .min-h-screen{min-height:calc(100dvh - 52px)} body{padding-bottom:52px}', injectTo: 'head' }, { tag: 'aside', attrs: { role: 'note', style: 'position:fixed;bottom:0;left:0;right:0;z-index:99999;height:52px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:8px 12px;background:#fff3cd;color:#302600;font:13px sans-serif;text-align:center' }, children: '로컬 샘플 · demo@example.com / demo1234 · 실제 비밀번호 입력 금지 · 계정 생성·방송·서버 저장 미지원', injectTo: 'body' }];
    },
  }],
});
await server.listen();
server.printUrls();
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await server.close(); process.exit(0); });
}
