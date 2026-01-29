# AI Client 実装進捗管理

## 概要

CODE OF JOKER AI Client の実装進捗を管理するディレクトリです。

## ディレクトリ構造

```
.progress/
├── README.md                    # このファイル
├── TDD_WORKFLOW.md              # TDDワークフローガイド
├── CURRENT_STATUS.md            # 現在の進捗状況
├── AGENT_GUIDE.md               # エージェント作業ガイド
└── tasks/
    ├── phase1/                  # Phase 1: 基盤構築 (MVP)
    │   ├── OVERVIEW.md
    │   └── *.md                 # 各タスクの進捗
    ├── phase2/                  # Phase 2: 推論改善
    │   ├── OVERVIEW.md
    │   └── *.md
    ├── phase3/                  # Phase 3: 高度な機能
    │   ├── OVERVIEW.md
    │   └── *.md
    └── phase4/                  # Phase 4: 最適化
        ├── OVERVIEW.md
        └── *.md
```

## 進捗状態の定義

| 状態 | 説明 |
|------|------|
| `NOT_STARTED` | 未着手 |
| `IN_PROGRESS` | 作業中 |
| `TESTING` | テスト中 |
| `REVIEW` | レビュー待ち |
| `COMPLETED` | 完了 |
| `BLOCKED` | ブロック中（依存関係など） |

## 現在のフェーズ

**Phase 1: 基盤構築 (MVP)** - NOT_STARTED

## 関連ドキュメント

- [要件定義書](/docs/AI_CLIENT_REQUIREMENTS.md)
- [Chat UI仕様書](/docs/AI_CHAT_UI_REQUIREMENTS.md)
- [TDDワークフロー](./TDD_WORKFLOW.md)
- [エージェント作業ガイド](./AGENT_GUIDE.md)

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2026-01-29 | Claude | 初期構造作成 |
