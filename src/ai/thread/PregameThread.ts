// src/ai/thread/PregameThread.ts
import type { DeckCard, PreGameAnalysis } from '../PreGameAnalyzer';
import { PreGameAnalyzer } from '../PreGameAnalyzer';
import type { AIChatMessage, MessageCategory } from '../chat/types';

/**
 * ゲーム開始前スレッドの状態
 */
export interface PregameThreadState {
  /** 分析完了フラグ */
  isAnalyzed: boolean;
  /** 分析結果 */
  analysis: PreGameAnalysis | null;
  /** ユーザーフィードバック */
  userFeedback: string | null;
  /** 調整済み戦略 */
  adjustedStrategy: string | null;
}

/**
 * ゲーム開始前分析スレッド
 * デッキ分析とユーザーとのインタラクションを管理
 */
export class PregameThread {
  private analyzer: PreGameAnalyzer;
  private state: PregameThreadState;

  constructor() {
    this.analyzer = new PreGameAnalyzer();
    this.state = {
      isAnalyzed: false,
      analysis: null,
      userFeedback: null,
      adjustedStrategy: null,
    };
  }

  /**
   * 現在の状態を取得
   */
  getState(): PregameThreadState {
    return { ...this.state };
  }

  /**
   * デッキを分析
   */
  analyze(deck: DeckCard[]): PreGameAnalysis {
    const analysis = this.analyzer.createAnalysisReport(deck);
    this.state.analysis = analysis;
    this.state.isAnalyzed = true;
    return analysis;
  }

  /**
   * 分析結果をチャットメッセージとしてフォーマット
   */
  formatAsMessage(): AIChatMessage | null {
    if (!this.state.analysis) {
      return null;
    }

    const { analysis } = this.state;
    const category: MessageCategory = 'pregame_analysis';

    // 詳細情報
    const details: Array<{ label: string; value: string; type: 'text' }> = [
      {
        label: 'アーキタイプ',
        value: analysis.strategy.archetype,
        type: 'text',
      },
      {
        label: '勝ち筋',
        value: analysis.strategy.winCondition,
        type: 'text',
      },
      {
        label: 'マリガン指針',
        value: analysis.mulliganAdvice,
        type: 'text',
      },
    ];

    // キーカード情報を追加
    if (analysis.keyCards.length > 0) {
      details.push({
        label: 'キーカード',
        value: analysis.keyCards.map(k => `${k.name}(${k.count}枚)`).join(', '),
        type: 'text',
      });
    }

    return {
      id: `pregame-${Date.now()}`,
      timestamp: new Date(),
      category,
      priority: 'high',
      content: {
        title: 'デッキ分析',
        body: analysis.summary,
        details,
      },
      interaction: {
        type: 'rating',
        options: [
          { id: 'helpful', label: '参考になった' },
          { id: 'needs-adjustment', label: '調整が必要' },
        ],
      },
      meta: {
        model: 'haiku', // ローカル分析だがLLMModelに準拠
      },
    };
  }

  /**
   * ユーザーフィードバックを設定
   */
  setFeedback(feedback: string): void {
    this.state.userFeedback = feedback;
  }

  /**
   * 戦略を調整
   */
  adjustStrategy(adjustment: string): void {
    this.state.adjustedStrategy = adjustment;
  }

  /**
   * 分析をリセット
   */
  reset(): void {
    this.state = {
      isAnalyzed: false,
      analysis: null,
      userFeedback: null,
      adjustedStrategy: null,
    };
  }

  /**
   * 分析が完了しているか
   */
  isAnalyzed(): boolean {
    return this.state.isAnalyzed;
  }

  /**
   * 分析結果を取得
   */
  getAnalysis(): PreGameAnalysis | null {
    return this.state.analysis;
  }
}
