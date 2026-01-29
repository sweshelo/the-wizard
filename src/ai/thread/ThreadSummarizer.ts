// src/ai/thread/ThreadSummarizer.ts

import type { ContextEntry } from './ContextWindowManager';
import type { LLMClient } from '../LLMClient';
import { CONTEXT_CONFIG } from '../constants';

/**
 * 要約結果
 */
export interface SummaryResult {
  /** 要約テキスト */
  summary: string;
  /** 元のトークン数 */
  originalTokens: number;
  /** 圧縮後のトークン数 */
  compressedTokens: number;
  /** 処理したエントリ数 */
  entriesProcessed: number;
}

/**
 * LLM要約設定
 */
export interface SummarizationConfig {
  /** 要約を開始するターン数 */
  summarizeAfterTurns: number;
  /** 詳細を保持するターン数 */
  keepDetailedTurns: number;
  /** 要約に使用するモデル */
  summaryModel: 'haiku' | 'sonnet' | 'opus';
  /** イベント要約の最大文字数 */
  maxEventSummaryLength: number;
  /** LLM要約を有効にするか */
  enableLLMSummarization: boolean;
}

/**
 * ThreadSummarizerの設定
 */
export interface ThreadSummarizerConfig {
  /** 要約の最大長（文字数） */
  maxSummaryLength?: number;
  /** キーポイントの最大数 */
  maxKeyPoints?: number;
  /** LLM要約設定 */
  summarizationConfig?: Partial<SummarizationConfig>;
}

/**
 * スレッド要約器
 * LLMを使わず、ルールベースで会話履歴を圧縮する
 */
export class ThreadSummarizer {
  private maxSummaryLength: number;
  private maxKeyPoints: number;
  private summarizationConfig: SummarizationConfig;

  // ゲームアクションのパターン
  private static readonly ACTION_PATTERNS = [
    /アタック/g,
    /ブロック/g,
    /召喚/g,
    /プレイ/g,
    /発動/g,
    /破壊/g,
    /ダメージ/g,
    /ドロー/g,
    /マリガン/g,
    /インターセプト/g,
    /トリガー/g,
    /ターンエンド/g,
  ];

  // 数値パターン（ライフ、BP、手札枚数など）
  private static readonly NUMERIC_PATTERNS = [
    /ライフ\s*(\d+)/g,
    /BP\s*(\d+)/g,
    /手札\s*(\d+)\s*枚/g,
    /コスト\s*(\d+)/g,
    /ターン\s*(\d+)/g,
    /(\d+)\s*ダメージ/g,
    /(\d+)\s*枚/g,
  ];

  // カード名パターン（「」で囲まれた文字列）
  private static readonly CARD_NAME_PATTERN = /「([^」]+)」/g;

  constructor(config: ThreadSummarizerConfig = {}) {
    this.maxSummaryLength = config.maxSummaryLength ?? 500;
    this.maxKeyPoints = config.maxKeyPoints ?? 10;
    this.summarizationConfig = {
      summarizeAfterTurns:
        config.summarizationConfig?.summarizeAfterTurns ?? CONTEXT_CONFIG.SUMMARIZE_AFTER_TURNS,
      keepDetailedTurns:
        config.summarizationConfig?.keepDetailedTurns ?? CONTEXT_CONFIG.KEEP_DETAILED_TURNS,
      summaryModel: config.summarizationConfig?.summaryModel ?? 'haiku',
      maxEventSummaryLength:
        config.summarizationConfig?.maxEventSummaryLength ??
        CONTEXT_CONFIG.MAX_EVENT_SUMMARY_LENGTH,
      enableLLMSummarization: config.summarizationConfig?.enableLLMSummarization ?? true,
    };
  }

  /**
   * 設定を取得
   */
  getConfig(): SummarizationConfig {
    return { ...this.summarizationConfig };
  }

  /**
   * 複数エントリを1つの要約に圧縮
   */
  summarize(entries: ContextEntry[]): SummaryResult {
    if (entries.length === 0) {
      return {
        summary: '',
        originalTokens: 0,
        compressedTokens: 0,
        entriesProcessed: 0,
      };
    }

    const originalTokens = entries.reduce((sum, e) => sum + e.tokenCount, 0);

    // すべてのエントリからキーポイントを抽出
    const allKeyPoints: string[] = [];
    for (const entry of entries) {
      const keyPoints = this.extractKeyPoints(entry.content);
      allKeyPoints.push(...keyPoints);
    }

    // 重複を削除し、最大数に制限
    const uniqueKeyPoints = [...new Set(allKeyPoints)].slice(0, this.maxKeyPoints);

    // 要約を構築
    let summary: string;
    if (uniqueKeyPoints.length > 0) {
      summary = this.buildSummary(uniqueKeyPoints, entries.length);
    } else {
      // キーポイントがない場合はシンプルな要約
      summary = this.buildSimpleSummary(entries);
    }

    // 長さ制限を適用
    if (summary.length > this.maxSummaryLength) {
      summary = summary.slice(0, this.maxSummaryLength - 3) + '...';
    }

    const compressedTokens = this.estimateTokens(summary);

    return {
      summary,
      originalTokens,
      compressedTokens,
      entriesProcessed: entries.length,
    };
  }

  /**
   * 要約が必要かどうか判定
   */
  needsSummarization(entries: ContextEntry[], threshold: number): boolean {
    if (entries.length === 0) {
      return false;
    }

    const totalTokens = entries.reduce((sum, e) => sum + e.tokenCount, 0);
    return totalTokens >= threshold;
  }

  /**
   * キーポイント抽出（ルールベース）
   */
  extractKeyPoints(content: string): string[] {
    if (!content) {
      return [];
    }

    const keyPoints: string[] = [];

    // ゲームアクションを抽出
    for (const pattern of ThreadSummarizer.ACTION_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        // パターンを含む文節を抽出
        keyPoints.push(...this.extractContextAroundMatch(content, pattern));
      }
    }

    // 数値情報を抽出
    for (const pattern of ThreadSummarizer.NUMERIC_PATTERNS) {
      const regex = new RegExp(pattern);
      const matches = content.matchAll(regex);
      for (const match of matches) {
        keyPoints.push(match[0]);
      }
    }

    // カード名を抽出
    const cardMatches = content.matchAll(ThreadSummarizer.CARD_NAME_PATTERN);
    for (const match of cardMatches) {
      keyPoints.push(`「${match[1]}」`);
    }

    return keyPoints;
  }

  /**
   * マッチした部分の前後の文脈を抽出
   */
  private extractContextAroundMatch(content: string, pattern: RegExp): string[] {
    const results: string[] = [];
    const regex = new RegExp(pattern);
    let match: RegExpExecArray | null;

    // 新しいRegExpインスタンスを使用してグローバル検索
    const globalRegex = new RegExp(regex.source, 'g');
    while ((match = globalRegex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 10);
      const end = Math.min(content.length, match.index + match[0].length + 10);
      const context = content.slice(start, end).trim();
      results.push(context);
    }

    return results;
  }

  /**
   * キーポイントから要約を構築
   */
  private buildSummary(keyPoints: string[], entryCount: number): string {
    const header = `[${entryCount}件の履歴を要約]`;
    const points = keyPoints.join('、');
    return `${header} ${points}`;
  }

  /**
   * シンプルな要約を構築（キーポイントがない場合）
   */
  private buildSimpleSummary(entries: ContextEntry[]): string {
    const header = `[${entries.length}件の履歴]`;

    // 最新のエントリの一部を含める
    const latestContent = entries[entries.length - 1]?.content || '';
    const truncated =
      latestContent.length > 100 ? latestContent.slice(0, 100) + '...' : latestContent;

    return `${header} 最新: ${truncated}`;
  }

  /**
   * トークン数を推定（ContextWindowManagerと同じロジック）
   */
  private estimateTokens(content: string): number {
    if (!content) {
      return 0;
    }

    const japaneseChars = (content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [])
      .length;
    const otherChars = content.length - japaneseChars;

    const japaneseTokens = Math.ceil(japaneseChars / 1.5);
    const otherTokens = Math.ceil(otherChars / 4);

    return japaneseTokens + otherTokens;
  }

  /**
   * LLMを使用して要約を生成
   * エラー時はルールベース要約にフォールバック
   */
  async summarizeWithLLM(entries: ContextEntry[], llmClient: LLMClient): Promise<SummaryResult> {
    if (entries.length === 0) {
      return {
        summary: '',
        originalTokens: 0,
        compressedTokens: 0,
        entriesProcessed: 0,
      };
    }

    const originalTokens = entries.reduce((sum, e) => sum + e.tokenCount, 0);

    try {
      // エントリを整形してLLMに渡す
      const formattedEntries = entries
        .map((e, i) => `[${i + 1}] ${e.role}: ${e.content}`)
        .join('\n');

      const systemPrompt = `あなたはカードゲーム「CODE OF JOKER」のAIアシスタントです。
以下の会話履歴を簡潔に要約してください。
重要な情報（ライフ変動、カード名、重要なアクション）は必ず含めてください。
要約は${this.summarizationConfig.maxEventSummaryLength}文字以内で出力してください。
出力は要約のみで、説明や前置きは不要です。`;

      const userMessage = `以下の会話履歴を要約してください:\n\n${formattedEntries}`;

      const response = await llmClient.send(systemPrompt, userMessage, {
        model: this.summarizationConfig.summaryModel,
        maxTokens: 256,
        temperature: 0.3,
      });

      const summary = response.content.slice(0, this.summarizationConfig.maxEventSummaryLength);
      const compressedTokens = this.estimateTokens(summary);

      return {
        summary,
        originalTokens,
        compressedTokens,
        entriesProcessed: entries.length,
      };
    } catch {
      // LLMエラー時はルールベースにフォールバック
      return this.summarize(entries);
    }
  }

  /**
   * ハイブリッド要約（設定に基づきLLMまたはルールベースを使用）
   */
  async summarizeHybrid(entries: ContextEntry[], llmClient?: LLMClient): Promise<SummaryResult> {
    // LLMが無効または未提供の場合はルールベース
    if (!this.summarizationConfig.enableLLMSummarization || !llmClient) {
      return this.summarize(entries);
    }

    // LLM要約を試行
    return this.summarizeWithLLM(entries, llmClient);
  }
}
