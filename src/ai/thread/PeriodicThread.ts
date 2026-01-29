// src/ai/thread/PeriodicThread.ts

import { BackgroundAnalyzer, type StoredAnalysis } from '../BackgroundAnalyzer';
import type { LLMClient } from '../LLMClient';
import type { AIGameContext } from '../types';
import type { PeriodicAnalysisResult } from '../prompts/periodic';

/**
 * 盤面評価情報
 */
export interface BoardEvaluation {
  evaluation: '有利' | '不利' | '互角';
  score: number;
}

/**
 * 定期分析スレッド
 * ゲームの進行に合わせて定期的な戦略分析を管理する
 */
export class PeriodicThread {
  private analyzer: BackgroundAnalyzer;
  private lastAnalysis: StoredAnalysis | null = null;

  constructor(llmClient: LLMClient) {
    this.analyzer = new BackgroundAnalyzer(llmClient);
  }

  /**
   * ラウンド開始時に呼び出し
   * 必要に応じて分析を実行
   */
  async onRoundStart(context: AIGameContext): Promise<void> {
    if (this.analyzer.shouldAnalyze(context.round)) {
      const result = await this.analyzer.analyze(context);
      if (result) {
        this.lastAnalysis = {
          round: context.round,
          timestamp: new Date(),
          result,
        };
      }
    }
  }

  /**
   * 指定ラウンドの分析が存在するか確認
   */
  hasAnalysisForRound(round: number): boolean {
    return this.lastAnalysis?.round === round;
  }

  /**
   * 戦略サマリーを取得
   */
  getStrategySummary(): string {
    return this.analyzer.formatSummaryForPrompt();
  }

  /**
   * 脅威レベルを取得
   */
  getThreatLevel(): string {
    const last = this.lastAnalysis;
    if (!last) {
      return 'unknown';
    }
    return last.result.threatLevel;
  }

  /**
   * 盤面評価を取得
   */
  getBoardEvaluation(): BoardEvaluation | null {
    const last = this.lastAnalysis;
    if (!last) {
      return null;
    }
    return {
      evaluation: last.result.boardEvaluation,
      score: last.result.evaluationScore,
    };
  }

  /**
   * プロンプトに分析結果を注入
   */
  injectIntoPrompt(originalPrompt: string): string {
    const summary = this.getStrategySummary();
    if (!summary) {
      return originalPrompt;
    }

    return `${originalPrompt}

## 定期分析結果
${summary}`;
  }

  /**
   * 最新の分析結果を取得
   */
  getLastAnalysisResult(): PeriodicAnalysisResult | null {
    return this.lastAnalysis?.result || null;
  }

  /**
   * 分析履歴を取得
   */
  getAnalysisHistory(): StoredAnalysis[] {
    return this.analyzer.getAnalysisHistory();
  }

  /**
   * リセット
   */
  reset(): void {
    this.analyzer.clear();
    this.lastAnalysis = null;
  }
}
