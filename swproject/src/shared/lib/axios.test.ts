/** @file Regression tests for concurrent authentication failures; no live server. */
import { beforeEach, expect, it, vi } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import apiClient, { bareClient } from './axios';
import { useAuthStore } from '@/shared/stores/authStore';

function reply(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, data, status, statusText: String(status), headers: {} };
}
function unauthorized(config: InternalAxiosRequestConfig) {
  return Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, reply(config, {}, 401)));
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().setTokens('old-access', 'old-refresh');
  window.location.hash = '#/dashboard';
});

it('shares one refresh across simultaneous 401s and retries each with the new token', async () => {
  const gate = deferred<{ data: { accessToken: string; refreshToken: string } }>();
  const refresh = vi.spyOn(bareClient, 'post').mockReturnValue(gate.promise);
  const requests: string[] = [];
  apiClient.defaults.adapter = async config => {
    requests.push(String(config.headers.Authorization));
    if (config.headers.Authorization === 'Bearer old-access') return unauthorized(config);
    return reply(config, { success: true, data: { ok: true } });
  };
  const pending = Promise.all([apiClient.get('/one'), apiClient.get('/two')]);
  await vi.waitFor(() => expect(requests).toHaveLength(2));
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  gate.resolve({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  expect((await pending).map(r => r.data)).toEqual([{ ok: true }, { ok: true }]);
  expect(requests).toEqual(['Bearer old-access', 'Bearer old-access', 'Bearer new-access', 'Bearer new-access']);
  expect(refresh).toHaveBeenCalledWith('/api/v1/auth/refresh', { refreshToken: 'old-refresh' });
});

it('rejects every waiting request and clears authentication when refresh fails', async () => {
  const gate = deferred<never>();
  const refresh = vi.spyOn(bareClient, 'post').mockReturnValue(gate.promise);
  let attempts = 0;
  apiClient.defaults.adapter = config => { attempts++; return unauthorized(config); };
  const pending = Promise.allSettled([apiClient.get('/one'), apiClient.get('/two')]);
  await vi.waitFor(() => expect(attempts).toBe(2));
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  gate.reject(new Error('Refresh expired'));
  expect((await pending).map(r => r.status)).toEqual(['rejected', 'rejected']);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(window.location.hash).toBe('#/login');
});

it('does not start another refresh when a queued request is still unauthorized after retry', async () => {
  const gate = deferred<{ data: { accessToken: string; refreshToken: string } }>();
  const refresh = vi.spyOn(bareClient, 'post')
    .mockResolvedValue({ data: { accessToken: 'third-access', refreshToken: 'third-refresh' } })
    .mockReturnValueOnce(gate.promise);
  const attempts: Record<string, number> = {};
  apiClient.defaults.adapter = async config => {
    const url = config.url!;
    attempts[url] = (attempts[url] ?? 0) + 1;
    if (attempts[url] === 1 || (url === '/two' && attempts[url] === 2)) return unauthorized(config);
    return reply(config, { ok: true });
  };
  const pending = Promise.allSettled([apiClient.get('/one'), apiClient.get('/two')]);
  await vi.waitFor(() => expect(attempts).toEqual({ '/one': 1, '/two': 1 }));
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  gate.resolve({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  const results = await pending;
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
  expect(attempts['/two']).toBe(2);
});

it('returns a rejected login without refreshing an unrelated stored session', async () => {
  const refresh = vi.spyOn(bareClient, 'post').mockRejectedValue(new Error('Should not refresh'));
  const headers: unknown[] = [];
  apiClient.defaults.adapter = config => { headers.push(config.headers.Authorization); return unauthorized(config); };
  await expect(apiClient.post('/api/v1/auth/login/email', { email: 'wrong@example.com' })).rejects.toBeDefined();
  expect(headers).toEqual([undefined]);
  expect(refresh).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBe('old-access');
});

it('clears an expired session with no refresh token without making a refresh request', async () => {
  useAuthStore.setState({ refreshToken: null });
  const refresh = vi.spyOn(bareClient, 'post');
  apiClient.defaults.adapter = unauthorized;
  await expect(apiClient.get('/one')).rejects.toBeDefined();
  expect(refresh).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(window.location.hash).toBe('#/login');
});
