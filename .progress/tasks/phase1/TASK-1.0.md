# TASK-1.0: テスト環境構築

## ステータス: NOT_STARTED

## 概要

Vitestによるテスト環境をセットアップし、TDD開発を可能にする。

## 前提条件

- なし（最初のタスク）

## 成果物

- `vitest.config.ts` - Vitest設定ファイル
- `src/test/setup.ts` - テストセットアップファイル
- `src/test/mocks/` - 共通モックディレクトリ
- `package.json` - テストスクリプト追加

## 作業手順

### 1. 依存関係のインストール

```bash
bun add -d vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### 2. vitest.config.ts の作成

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/ai/**/*.ts', 'src/components/ai/**/*.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. src/test/setup.ts の作成

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルモックの設定
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));
```

### 4. package.json にスクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 5. src/test/mocks/ ディレクトリ作成

```
src/test/mocks/
├── gameState.ts      # ゲーム状態モック
├── websocket.ts      # WebSocketモック
├── claude.ts         # Claude APIモック
└── index.ts          # エクスポート
```

## TDDチェックリスト

このタスクは環境構築のため、通常のTDDサイクルではなく以下を確認:

- [ ] Vitestが正常に動作すること
- [ ] サンプルテストがパスすること
- [ ] React Componentのテストが動作すること
- [ ] モックが正しくインポートできること

## 確認用サンプルテスト

```typescript
// src/test/sample.test.ts
import { describe, it, expect } from 'vitest';

describe('テスト環境', () => {
  it('Vitestが動作すること', () => {
    expect(1 + 1).toBe(2);
  });

  it('DOM環境が利用可能なこと', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    expect(div.textContent).toBe('Hello');
  });
});
```

## 完了条件

- [ ] `bun test` でテストが実行される
- [ ] サンプルテストがパスする
- [ ] カバレッジレポートが生成される

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| - | - |

## 課題・メモ

- なし
