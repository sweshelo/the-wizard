// src/ai/thread/ContextWindowManager.ts

/**
 * コンテキストエントリ
 * 会話履歴の1つのメッセージを表す
 */
export interface ContextEntry {
  /** 一意のID */
  id: string;
  /** メッセージ内容 */
  content: string;
  /** ロール（ユーザーまたはアシスタント） */
  role: 'user' | 'assistant';
  /** タイムスタンプ */
  timestamp: Date;
  /** 推定トークン数 */
  tokenCount: number;
  /** 優先度 */
  priority: 'high' | 'normal' | 'low';
  /** 世代番号（要約回数） */
  generation: number;
}

/**
 * コンテキストウィンドウマネージャーの設定
 */
export interface ContextWindowManagerConfig {
  /** 最大トークン数 */
  maxTokens?: number;
  /** 圧縮を開始するしきい値（0-1の割合） */
  compactThreshold?: number;
  /** 要約を有効にするか */
  enableSummarization?: boolean;
}

/**
 * LLMメッセージ形式
 */
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * コンテキストウィンドウマネージャー
 * 会話履歴を管理し、トークン制限内に収める
 */
export class ContextWindowManager {
  private entries: ContextEntry[] = [];
  private maxTokens: number;
  private compactThreshold: number;
  private enableSummarization: boolean;
  private idCounter: number = 0;

  constructor(config: ContextWindowManagerConfig = {}) {
    this.maxTokens = config.maxTokens ?? 4096;
    this.compactThreshold = config.compactThreshold ?? 0.8;
    this.enableSummarization = config.enableSummarization ?? false;
  }

  /**
   * エントリを追加
   */
  addEntry(entry: Omit<ContextEntry, 'id' | 'timestamp' | 'tokenCount'>): ContextEntry {
    const id = this.generateId();
    const tokenCount = this.estimateTokens(entry.content);
    const timestamp = new Date();

    const newEntry: ContextEntry = {
      ...entry,
      id,
      timestamp,
      tokenCount,
    };

    this.entries.push(newEntry);
    return newEntry;
  }

  /**
   * すべてのエントリを取得
   * @param maxTokens オプションのトークン制限
   */
  getEntries(maxTokens?: number): ContextEntry[] {
    if (maxTokens === undefined) {
      return [...this.entries];
    }

    // トークン制限がある場合、最新のエントリから取得
    const result: ContextEntry[] = [];
    let totalTokens = 0;

    // 逆順で走査し、制限内に収まるエントリを追加
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      if (totalTokens + entry.tokenCount <= maxTokens) {
        result.unshift(entry);
        totalTokens += entry.tokenCount;
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * トークン数を推定
   * 簡易的な推定: 英語は4文字=1トークン、日本語は1.5文字=1トークン
   */
  estimateTokens(content: string): number {
    if (!content) {
      return 0;
    }

    // 日本語文字数をカウント
    const japaneseChars = (content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [])
      .length;
    const otherChars = content.length - japaneseChars;

    // 日本語は約1.5文字で1トークン、その他は約4文字で1トークン
    const japaneseTokens = Math.ceil(japaneseChars / 1.5);
    const otherTokens = Math.ceil(otherChars / 4);

    return japaneseTokens + otherTokens;
  }

  /**
   * コンテキストを圧縮
   * 古い低優先度エントリを削除し、必要に応じて要約を作成
   */
  compact(): void {
    const totalTokens = this.getTotalTokens();
    const threshold = this.maxTokens * this.compactThreshold;

    if (totalTokens <= threshold) {
      return;
    }

    // 優先度でソート（low -> normal -> high）
    const sortedByPriority = [...this.entries].sort((a, b) => {
      const priorityOrder = { low: 0, normal: 1, high: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 低優先度から削除
    let currentTokens = totalTokens;
    const entriesToRemove: Set<string> = new Set();

    for (const entry of sortedByPriority) {
      if (currentTokens <= threshold) {
        break;
      }
      if (entry.priority !== 'high') {
        entriesToRemove.add(entry.id);
        currentTokens -= entry.tokenCount;
      }
    }

    // エントリを削除
    this.entries = this.entries.filter(e => !entriesToRemove.has(e.id));

    // 要約が有効で、まだ閾値を超えている場合
    if (this.enableSummarization && this.getTotalTokens() > threshold) {
      this.applySummarization();
    }
  }

  /**
   * 要約を適用（内部メソッド）
   */
  private applySummarization(): void {
    // ThreadSummarizerと連携する場合に使用
    // 現時点では古いnormalエントリを削除するのみ
    const normalEntries = this.entries.filter(e => e.priority === 'normal');
    const oldNormalCount = Math.floor(normalEntries.length / 2);

    if (oldNormalCount > 0) {
      const oldNormalIds = new Set(normalEntries.slice(0, oldNormalCount).map(e => e.id));
      this.entries = this.entries.filter(e => !oldNormalIds.has(e.id));
    }
  }

  /**
   * エントリをLLMメッセージ形式に変換
   */
  toMessages(): LLMMessage[] {
    return this.entries.map(entry => ({
      role: entry.role,
      content: entry.content,
    }));
  }

  /**
   * 総トークン数を取得
   */
  getTotalTokens(): number {
    return this.entries.reduce((sum, entry) => sum + entry.tokenCount, 0);
  }

  /**
   * すべてのエントリをクリア
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * IDでエントリを削除
   */
  removeEntry(id: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(e => e.id !== id);
    return this.entries.length < initialLength;
  }

  /**
   * 最大トークン数を取得
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `ctx-${Date.now()}-${this.idCounter}`;
  }
}
