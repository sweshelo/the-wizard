// src/ai/thread/ContextWindowManager.ts

import { ThreadSummarizer, type SummarizationConfig, type SummaryResult } from './ThreadSummarizer';
import type { LLMClient } from '../LLMClient';
import { CONTEXT_CONFIG } from '../constants';

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
  /** 最大ターン数 */
  maxTurns?: number;
  /** 圧縮を開始するしきい値（0-1の割合） */
  compactThreshold?: number;
  /** 要約を有効にするか */
  enableSummarization?: boolean;
  /** LLM要約設定 */
  summarizationConfig?: Partial<SummarizationConfig>;
  /** LLMクライアント（LLM要約に使用） */
  llmClient?: LLMClient;
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
  private maxTurns: number;
  private compactThreshold: number;
  private enableSummarization: boolean;
  private idCounter: number = 0;
  private summarizer: ThreadSummarizer;
  private llmClient?: LLMClient;

  constructor(config: ContextWindowManagerConfig = {}) {
    this.maxTokens = config.maxTokens ?? CONTEXT_CONFIG.DEFAULT_MAX_TOKENS;
    this.maxTurns = config.maxTurns ?? CONTEXT_CONFIG.DEFAULT_MAX_TURNS;
    this.compactThreshold = config.compactThreshold ?? 0.8;
    this.enableSummarization = config.enableSummarization ?? false;
    this.summarizer = new ThreadSummarizer({
      summarizationConfig: config.summarizationConfig,
    });
    this.llmClient = config.llmClient;
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
   * 高世代エントリは優先的に保持される
   */
  compact(): void {
    const totalTokens = this.getTotalTokens();
    const threshold = this.maxTokens * this.compactThreshold;

    if (totalTokens <= threshold) {
      return;
    }

    // 優先度と世代でソート（低優先度・低世代が先に削除される）
    const sortedByPriority = [...this.entries].sort((a, b) => {
      const priorityOrder = { low: 0, normal: 1, high: 2 };
      // まず優先度で比較
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // 同じ優先度なら世代で比較（低世代が先）
      return a.generation - b.generation;
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
   * 最大ターン数を取得
   */
  getMaxTurns(): number {
    return this.maxTurns;
  }

  /**
   * 指定ターンまでのエントリを要約
   */
  summarize(upToTurn: number): SummaryResult {
    if (upToTurn <= 0) {
      return {
        summary: '',
        originalTokens: 0,
        compressedTokens: 0,
        entriesProcessed: 0,
      };
    }

    const entriesToSummarize = this.entries.slice(0, Math.min(upToTurn, this.entries.length));
    return this.summarizer.summarize(entriesToSummarize);
  }

  /**
   * 要約エントリを作成
   * 指定ターンまでのエントリを要約し、新しいエントリとして返す
   */
  createSummaryEntry(upToTurn: number): ContextEntry {
    const entriesToSummarize = this.entries.slice(0, Math.min(upToTurn, this.entries.length));
    const result = this.summarizer.summarize(entriesToSummarize);

    // 要約対象エントリの最大世代を取得
    const maxGeneration = Math.max(...entriesToSummarize.map(e => e.generation), 1);

    const summaryEntry: ContextEntry = {
      id: this.generateId(),
      content: result.summary,
      role: 'assistant',
      timestamp: new Date(),
      tokenCount: result.compressedTokens,
      priority: 'normal',
      generation: maxGeneration + 1,
    };

    return summaryEntry;
  }

  /**
   * 非同期圧縮（LLM要約付き）
   * LLMクライアントが設定されている場合はLLM要約を使用
   */
  async compressAsync(): Promise<void> {
    const totalTokens = this.getTotalTokens();
    const threshold = this.maxTokens * this.compactThreshold;

    if (totalTokens <= threshold) {
      return;
    }

    // LLMクライアントがある場合はLLM要約を試行
    if (this.llmClient && this.enableSummarization) {
      await this.compressWithLLM(threshold);
    } else {
      // LLMがない場合は同期版にフォールバック
      this.compact();
    }
  }

  /**
   * LLMを使用した圧縮
   */
  private async compressWithLLM(threshold: number): Promise<void> {
    // 要約対象のエントリを特定（古い低優先度エントリ）
    const summarizationConfig = this.summarizer.getConfig();
    const keepCount = summarizationConfig.keepDetailedTurns;

    if (this.entries.length <= keepCount) {
      return;
    }

    const entriesToSummarize = this.entries.slice(0, this.entries.length - keepCount);

    if (entriesToSummarize.length === 0) {
      return;
    }

    try {
      // LLM要約を生成
      const result = await this.summarizer.summarizeHybrid(entriesToSummarize, this.llmClient);

      if (result.summary.length > 0) {
        // 要約エントリを作成
        const maxGeneration = Math.max(...entriesToSummarize.map(e => e.generation), 1);
        const summaryEntry: ContextEntry = {
          id: this.generateId(),
          content: result.summary,
          role: 'assistant',
          timestamp: new Date(),
          tokenCount: result.compressedTokens,
          priority: 'high',
          generation: maxGeneration + 1,
        };

        // 古いエントリを削除し、要約を追加
        const keptEntries = this.entries.slice(this.entries.length - keepCount);
        this.entries = [summaryEntry, ...keptEntries];
      }
    } catch {
      // LLM要約失敗時は同期版にフォールバック
      this.compact();
    }

    // まだ閾値を超えている場合は追加で圧縮
    if (this.getTotalTokens() > threshold) {
      this.compact();
    }
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `ctx-${Date.now()}-${this.idCounter}`;
  }
}
