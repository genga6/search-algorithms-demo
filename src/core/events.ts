/**
 * 可視化の背骨となる「探索イベント」。
 *
 * すべてのアルゴリズムは、探索の過程でこのイベントを `yield` する。
 * UI 側はこの列を再生するだけでよく、アルゴリズム本体と描画が疎結合になる。
 *
 * ── g / h / f について（情報あり探索・特に A\* の中心的な考え方）──
 *   g … スタートからこのマスまでに「実際にかかった」コスト（確定・過去）
 *   h … このマスからゴールまでの「予想」コスト＝ヒューリスティック（推定・未来）
 *   f … g + h。このマスを通る経路全体のコスト見積もり
 *
 *   各アルゴリズムは「次にどのマスを開くか」の基準が違うだけ：
 *     UCS/Dijkstra → g だけで選ぶ（過去のコストのみ）
 *     貪欲          → h だけで選ぶ（ゴールへの近さのみ）
 *     A\*           → f = g + h で選ぶ（過去と未来の両方）
 *   g/h/f は可視化・デバッグ用の付随情報なので push では任意(?)。
 */
export type SearchEvent<S> =
  /** フロンティア(open)にノードを追加した。g/h/f は情報付き探索のときだけ入る */
  | { type: "push"; state: S; g?: number; h?: number; f?: number; parent?: S | null }
  /** フロンティアからノードを取り出して展開する */
  | { type: "pop"; state: S }
  /** より短い経路が見つかり距離を更新した（UCS/A\*） */
  | { type: "relax"; state: S; g: number; parent?: S | null }
  /** closed（訪問済み）に確定した */
  | { type: "close"; state: S }
  /** 枝刈りで捨てた（A\* の閾値超過・ビームの打ち切り等） */
  | { type: "prune"; state: S; reason?: string }
  /** ゴールに到達した */
  | { type: "goal"; state: S }
  /** 最終経路が確定した */
  | { type: "solution"; path: S[] }
  /** 補助的な注記（深さ制限の更新・閾値の変化など）。描画は任意 */
  | { type: "note"; message: string }

export type SearchEventType = SearchEvent<unknown>["type"]
