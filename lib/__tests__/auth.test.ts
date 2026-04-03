import { describe, it, expect } from 'vitest';
import { authOptions } from '../auth';

// T009: NextAuth 設定測試（TDD — 先寫測試）
describe('NextAuth 設定', () => {
  it('使用 Google Provider', () => {
    const googleProvider = authOptions.providers.find(
      (p: any) => p.id === 'google'
    );
    expect(googleProvider).toBeDefined();
  });

  it('包含 gmail.readonly 和 youtube.readonly scopes', () => {
    const googleProvider = authOptions.providers.find(
      (p: any) => p.id === 'google'
    ) as any;
    const scopes = googleProvider?.options?.authorization?.params?.scope;
    expect(scopes).toContain('gmail.readonly');
    expect(scopes).toContain('youtube.readonly');
  });

  it('session callback 傳遞 accessToken', async () => {
    const sessionCb = authOptions.callbacks?.session;
    if (!sessionCb) throw new Error('session callback 未定義');
    const result = await sessionCb({
      session: { user: { name: 'Test' }, expires: '' } as any,
      token: { accessToken: 'test-token', refreshToken: 'test-refresh' } as any,
      user: {} as any,
      newSession: undefined,
      trigger: 'update',
    });
    expect((result as any).accessToken).toBe('test-token');
  });
});
