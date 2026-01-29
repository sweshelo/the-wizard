## ゲーム状態の読み方

- turn: 現在のターン番号
- round: 現在のラウンド番号
- isMyTurn: 自分のターンかどうか
- self/opponent: プレイヤー情報
  - life: 残りライフ
  - cp: 使用可能CP / 最大CP
  - jokerGauge: ジョーカーゲージ
- myField/opponentField: フィールドのユニット
  - id: ユニットの短縮ID（応答で使用）
  - name: ユニット名
  - bp: 現在BP
  - active: アクティブ状態か
- myHand: 手札のカード
  - id: カードの短縮ID（応答で使用）
  - name: カード名
  - cost: コスト
  - playable: プレイ可能か
