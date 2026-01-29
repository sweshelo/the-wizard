# TASK-1.0: テスト環境構築

## ステータス: NOT_STARTED

## 概要

Bun のビルトインテスト機能を使用したテスト環境をセットアップし、TDD開発を可能にする。

## 前提条件

- なし（最初のタスク）

## 成果物

- `bunfig.toml` - Bun設定ファイル（テスト設定）
- `src/test/setup.ts` - テストセットアップファイル
- `src/test/mocks/` - 共通モックディレクトリ

## 作業手順

### 1. 依存関係のインストール（React Component テスト用）

```bash
bun add -d @testing-library/react @testing-library/dom happy-dom
```

### 2. bunfig.toml の作成

```toml
[test]
preload = ["./src/test/setup.ts"]

[test.coverage]
reporter = ["text", "html"]
```

### 3. src/test/setup.ts の作成

```typescript
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
```

### 4. src/test/mocks/ ディレクトリ作成

```
src/test/mocks/
├── gameState.ts      # ゲーム状態モック
├── websocket.ts      # WebSocketモック
├── anthropic.ts      # Anthropic APIモック（重要）
└── index.ts          # エクスポート
```

### 5. Anthropic API モックの作成（重要）

```typescript
// src/test/mocks/anthropic.ts
import { mock } from 'bun:test';

/**
 * Anthropic API のモッククライアント
 *
 * 重要: テストでは絶対に実際のAPIを呼び出さないこと
 * 理由:
 * - APIコスト（テスト毎に課金される）
 * - レート制限
 * - テスト速度（API呼び出しは遅い）
 * - 再現性（APIレスポンスは非決定的）
 */
export const createMockAnthropicClient = () => ({
  messages: {
    create: mock(() => Promise.resolve({
      id: 'mock-msg-id',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            action: 'UnitDrive',
            targetId: 'u1',
            reason: 'テスト用モックレスポンス'
          })
        }
      ],
      model: 'claude-3-haiku-20240307',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 }
    }))
  }
});

/**
 * 特定のレスポンスを返すモックを作成
 */
export const createMockWithResponse = (response: unknown) => ({
  messages: {
    create: mock(() => Promise.resolve({
      id: 'mock-msg-id',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: typeof response === 'string' ? response : JSON.stringify(response)
        }
      ],
      model: 'claude-3-haiku-20240307',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 }
    }))
  }
});

/**
 * エラーを返すモックを作成
 */
export const createMockWithError = (error: Error) => ({
  messages: {
    create: mock(() => Promise.reject(error))
  }
});
```

## TDDチェックリスト

このタスクは環境構築のため、通常のTDDサイクルではなく以下を確認:

- [ ] `bun test` が正常に動作すること
- [ ] サンプルテストがパスすること
- [ ] DOM環境（happy-dom）が利用可能なこと
- [ ] モックが正しくインポートできること
- [ ] Anthropic APIモックが正しく動作すること

## 確認用サンプルテスト

```typescript
// src/test/sample.test.ts
import { describe, it, expect } from 'bun:test';

describe('テスト環境', () => {
  it('Bun Test が動作すること', () => {
    expect(1 + 1).toBe(2);
  });

  it('DOM環境が利用可能なこと', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    expect(div.textContent).toBe('Hello');
  });
});
```

```typescript
// src/test/mocks.test.ts
import { describe, it, expect } from 'bun:test';
import { createMockAnthropicClient, createMockWithResponse } from './mocks/anthropic';

describe('Anthropic モック', () => {
  it('デフォルトレスポンスを返すこと', async () => {
    const client = createMockAnthropicClient();
    const response = await client.messages.create({});

    expect(response.content[0].type).toBe('text');
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('カスタムレスポンスを返すこと', async () => {
    const client = createMockWithResponse({ action: 'TurnEnd' });
    const response = await client.messages.create({});

    const text = response.content[0].text;
    expect(JSON.parse(text).action).toBe('TurnEnd');
  });
});
```

## テスト実行コマンド

```bash
# テスト実行
bun test

# ウォッチモード
bun test --watch

# カバレッジ
bun test --coverage

# 特定ファイルのみ
bun test sample
```

## 完了条件

- [ ] `bun test` でテストが実行される
- [ ] サンプルテストがパスする
- [ ] Anthropic APIモックが正しく動作する
- [ ] カバレッジレポートが生成される

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| - | - |

## 課題・メモ

- Anthropic API は絶対にモックを使用すること（コスト・レート制限対策）
- E2Eテストで実APIを使う場合は環境変数 `TEST_USE_REAL_API=true` で明示的に有効化
