// src/ai/prompts/strategy.ts

/**
 * デッキの色構成
 */
export interface DeckColors {
  /** メインカラー */
  primary: number;
  /** サブカラー（2色デッキの場合） */
  secondary?: number;
}

/**
 * 色別戦略情報
 */
export interface ColorStrategy {
  /** 色名 */
  name: string;
  /** プレイスタイル */
  playstyle: string;
  /** 強み */
  strengths: string[];
  /** 弱み */
  weaknesses: string[];
  /** 戦略的アドバイス */
  tips: string[];
}

/**
 * 色番号から色名を取得
 */
export function getColorName(color: number): string {
  const colorNames: Record<number, string> = {
    1: '赤',
    2: '黄',
    3: '青',
    4: '緑',
    5: '紫',
  };
  return colorNames[color] ?? '不明';
}

/**
 * 色別戦略マップ
 */
export const COLOR_STRATEGIES: Record<number, ColorStrategy> = {
  1: {
    name: '赤',
    playstyle: 'アグレッシブな攻撃型。速攻と火力で相手を圧倒する。',
    strengths: [
      '高い攻撃力と貫通ダメージ',
      'バーンダメージによる直接ライフ削り',
      '速攻性能が高い',
      '相手のユニットを除去しやすい',
    ],
    weaknesses: [
      '長期戦に弱い',
      '手札消費が激しい',
      '大型ユニットへの対処が難しい場合がある',
      '防御力が低め',
    ],
    tips: [
      '序盤から積極的に攻撃し、ライフアドバンテージを取る',
      'トリガーゾーンのバーンカードを活用',
      '相手が体勢を整える前に決着を付ける',
      'CPを温存せず、積極的にユニットを展開する',
    ],
  },
  2: {
    name: '黄',
    playstyle: 'バランス型。柔軟な対応力と安定した展開が特徴。',
    strengths: [
      '汎用性の高いカードが多い',
      '除去と展開のバランスが良い',
      'コスト効率の良いユニットが多い',
      'ライフ回復手段がある',
    ],
    weaknesses: ['特化した強みがない', '極端な戦略に押し負ける場合がある', '爆発力に欠ける'],
    tips: [
      '状況に応じて攻守を切り替える',
      'リソース管理を意識する',
      '相手のデッキタイプに合わせたプレイを心がける',
      '手札の選択肢を多く持つ',
    ],
  },
  3: {
    name: '青',
    playstyle: 'コントロール型。相手の行動を妨害し、アドバンテージを積み重ねる。',
    strengths: [
      'ドロー効果でリソースを確保',
      'バウンス（手札に戻す）で盤面をリセット',
      '相手の効果を無効化できる',
      '長期戦に強い',
    ],
    weaknesses: [
      '序盤の展開力が低い',
      'ライフを削る速度が遅い',
      '速攻デッキに押し切られやすい',
      'CPコストが高いカードが多い',
    ],
    tips: [
      '序盤は守りを固め、リソースを蓄える',
      '相手のキーカードをバウンスで対処',
      '手札を枯渇させない',
      '終盤に大型ユニットで決着を付ける',
    ],
  },
  4: {
    name: '緑',
    playstyle: '大型ユニット型。高BPのユニットで盤面を制圧する。',
    strengths: [
      '高BPのユニットが多い',
      'BP強化効果が豊富',
      '戦闘で負けにくい',
      '盤面を制圧しやすい',
    ],
    weaknesses: [
      'コストが重い',
      '展開速度が遅い',
      '除去効果に弱い',
      '序盤で押し切られる場合がある',
    ],
    tips: [
      '序盤は低コストユニットで時間を稼ぐ',
      'CPが貯まったら大型ユニットを展開',
      'BP強化でさらに戦闘力を上げる',
      '盤面を取ったら一気に押し込む',
    ],
  },
  5: {
    name: '紫',
    playstyle: '特殊効果型。独自のギミックで相手を翻弄する。',
    strengths: [
      '強力なデバフ効果',
      '予測困難な効果が多い',
      '相手の戦略を崩しやすい',
      'コンボポテンシャルが高い',
    ],
    weaknesses: [
      '効果に依存しすぎる',
      '単体のユニットパワーが低め',
      'コンボが決まらないと弱い',
      '相手の対策に弱い',
    ],
    tips: [
      'コンボパーツを揃えることを意識',
      'デバフで相手の主力を無力化',
      '効果のタイミングを見極める',
      '相手の加護持ちに注意',
    ],
  },
};

/**
 * 色から戦略情報を取得
 */
export function getColorStrategy(color: number): ColorStrategy | null {
  return COLOR_STRATEGIES[color] ?? null;
}

/**
 * デッキ戦略をフォーマット
 */
export function formatDeckStrategy(colors: DeckColors): string {
  const sections: string[] = [];
  const primaryStrategy = getColorStrategy(colors.primary);

  if (!primaryStrategy) {
    return `## デッキ戦略\n\nメインカラー: ${getColorName(colors.primary)}（戦略情報なし）`;
  }

  // メインカラー
  sections.push(`## デッキ戦略`);

  if (colors.secondary) {
    const secondaryStrategy = getColorStrategy(colors.secondary);
    sections.push(`\n### メインカラー: ${primaryStrategy.name}`);
    sections.push(`**プレイスタイル:** ${primaryStrategy.playstyle}`);

    if (secondaryStrategy) {
      sections.push(`\n### サブカラー: ${secondaryStrategy.name}`);
      sections.push(`**プレイスタイル:** ${secondaryStrategy.playstyle}`);
    }
  } else {
    sections.push(`\n### カラー: ${primaryStrategy.name}`);
    sections.push(`**プレイスタイル:** ${primaryStrategy.playstyle}`);
  }

  // 強み
  sections.push(`\n### 強み`);
  for (const strength of primaryStrategy.strengths) {
    sections.push(`- ${strength}`);
  }

  // 弱み
  sections.push(`\n### 弱み`);
  for (const weakness of primaryStrategy.weaknesses) {
    sections.push(`- ${weakness}`);
  }

  // アドバイス
  sections.push(`\n### 戦略的アドバイス`);
  for (const tip of primaryStrategy.tips) {
    sections.push(`- ${tip}`);
  }

  return sections.join('\n');
}

/**
 * 戦略プロンプトを生成（ゲームコンテキスト用）
 */
export function buildStrategyPrompt(deckColors: DeckColors): string {
  return formatDeckStrategy(deckColors);
}
