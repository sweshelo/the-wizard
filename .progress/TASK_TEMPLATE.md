# TASK-X.X: タスク名

## ステータス: NOT_STARTED

<!-- ステータスの選択肢:
  NOT_STARTED - 未着手
  IN_PROGRESS - 作業中
  TESTING     - テスト中
  REVIEW      - レビュー待ち
  COMPLETED   - 完了
  BLOCKED     - ブロック中
-->

## 概要

タスクの概要を記述。

## 前提条件

- TASK-X.X (前提タスク名) が完了していること

## 成果物

```
src/ai/
├── NewFile.ts           # 説明
├── NewFile.test.ts      # テスト
└── ...
```

## TDDによる実装手順

### テストケースリスト

1. **カテゴリ1**
   - [ ] テストケース1
   - [ ] テストケース2

2. **カテゴリ2**
   - [ ] テストケース3
   - [ ] テストケース4

### Step 1: Red - 最初のテストを書く

```typescript
// src/ai/NewFile.test.ts
import { describe, it, expect } from 'vitest';

describe('NewModule', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Step 2: Green - テストを通す最小限の実装

```typescript
// src/ai/NewFile.ts
export function doSomething(input: string): string {
  return 'expected';
}
```

### Step 3: 次のテストを追加

```typescript
it('should handle another case', () => {
  // ...
});
```

### Step N: Refactor

- コードの整理
- 重複の除去
- 命名の改善

## 完了条件

- [ ] 全テストがパス
- [ ] `bun lint` がパス
- [ ] 必要な機能が実装されている
- [ ] ドキュメントが更新されている

---

## 作業ログ

| 日時 | 内容 |
|------|------|
| YYYY-MM-DD HH:MM | 作業開始 |
| YYYY-MM-DD HH:MM | テストケースX完了 |
| YYYY-MM-DD HH:MM | 作業完了 |

## 課題・メモ

- 課題や気づいたことを記録

## ブロッカー（該当する場合）

<!-- ステータスが BLOCKED の場合に記入 -->

- **ブロック理由:**
- **対応策:**
- **解消見込み:**
