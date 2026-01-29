// src/test/setup.ts
import { mock } from 'bun:test';

// happy-dom のセットアップ（React Component テスト用）
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

// Next.js navigation のモック
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
