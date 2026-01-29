// src/test/setup.ts
import { mock } from 'bun:test';

// happy-dom のセットアップ（React Component テスト用）
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

// Next.js navigation のモック
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(() => Promise.resolve(true)),
    replace: mock(() => Promise.resolve(true)),
    prefetch: mock(() => Promise.resolve()),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
