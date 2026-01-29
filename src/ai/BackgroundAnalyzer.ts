// src/ai/BackgroundAnalyzer.ts

import type { LLMClient } from './LLMClient';
import type { AIGameContext } from './types';
import { AI_CONFIG } from './constants';
import {
  buildPeriodicAnalysisSystemPrompt,
  buildPeriodicAnalysisPrompt,
  parsePeriodicAnalysisResult,
  type PeriodicAnalysisResult,
} from './prompts/periodic';

/**
 * 保存された分析結果
 */
export interface StoredAnalysis {
  round: number;
  timestamp: Date;
  result: PeriodicAnalysisResult;
}

/**
 * バックグラウンド分析クラス
 * 定期的にゲーム状況を分析し、戦略的なアドバイスを生成する
 */
export class BackgroundAnalyzer {
  private llmClient: LLMClient;
  private analysisInterval: number;
  private analyzedRounds: Set<number> = new Set();
  private analysisHistory: StoredAnalysis[] = [];

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    this.analysisInterval = AI_CONFIG.PERIODIC_ANALYSIS_ROUNDS;
  }

  /**
   * 分析間隔を設定
   */
  setAnalysisInterval(rounds: number): void {
    this.analysisInterval = rounds;
  }

  /**
   * 分析が必要かどうか判定
   */
  shouldAnalyze(currentRound: number): boolean {
    // 既に分析済みのラウンドはスキップ
    if (this.analyzedRounds.has(currentRound)) {
      return false;
    }

    // 指定間隔ごとに分析
    return currentRound > 0 && currentRound % this.analysisInterval === 0;
  }

  /**
   * 分析済みとしてマーク
   */
  markAnalyzed(round: number): void {
    this.analyzedRounds.add(round);
  }

  /**
   * 分析を実行
   */
  async analyze(context: AIGameContext): Promise<PeriodicAnalysisResult | null> {
    const systemPrompt = buildPeriodicAnalysisSystemPrompt();
    const previousAnalysis = this.getLastAnalysis();
    const userPrompt = buildPeriodicAnalysisPrompt(
      context,
      previousAnalysis ? this.formatResultForContext(previousAnalysis.result) : undefined
    );

    try {
      const response = await this.llmClient.send(systemPrompt, userPrompt, {
        model: 'opus', // 深い分析にはOpusを使用
        maxTokens: 1024,
        temperature: 0.3,
      });

      const result = parsePeriodicAnalysisResult(response.content);

      if (result) {
        this.storeAnalysis(context.round, result);
        this.markAnalyzed(context.round);
      }

      return result;
    } catch {
      // エラー時はnullを返す
      return null;
    }
  }

  /**
   * 最新の分析結果を取得
   */
  getLastAnalysis(): StoredAnalysis | null {
    if (this.analysisHistory.length === 0) {
      return null;
    }
    return this.analysisHistory[this.analysisHistory.length - 1];
  }

  /**
   * 分析履歴を取得
   */
  getAnalysisHistory(): StoredAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * クリア
   */
  clear(): void {
    this.analyzedRounds.clear();
    this.analysisHistory = [];
  }

  /**
   * プロンプト用にサマリーをフォーマット
   */
  formatSummaryForPrompt(): string {
    const last = this.getLastAnalysis();
    if (!last) {
      return '';
    }

    return this.formatResultForContext(last.result);
  }

  /**
   * 分析結果を保存
   */
  private storeAnalysis(round: number, result: PeriodicAnalysisResult): void {
    this.analysisHistory.push({
      round,
      timestamp: new Date(),
      result,
    });

    // 履歴は最大10件まで保持
    if (this.analysisHistory.length > 10) {
      this.analysisHistory.shift();
    }
  }

  /**
   * 結果をコンテキスト用にフォーマット
   */
  private formatResultForContext(result: PeriodicAnalysisResult): string {
    const lines: string[] = [];

    lines.push(`盤面評価: ${result.boardEvaluation} (スコア: ${result.evaluationScore})`);
    lines.push(`脅威レベル: ${result.threatLevel}`);
    lines.push('');
    lines.push('観察:');
    for (const obs of result.keyObservations) {
      lines.push(`- ${obs}`);
    }
    lines.push('');
    lines.push(`戦略提案: ${result.strategySuggestion}`);
    lines.push('');
    lines.push('次ラウンドの優先事項:');
    for (const priority of result.nextRoundPriorities) {
      lines.push(`- ${priority}`);
    }

    return lines.join('\n');
  }
}
