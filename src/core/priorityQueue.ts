/**
 * 二分ヒープによる最小優先度キュー（MinHeap）。
 * UCS / A\* / 貪欲 などで「次に開くべき、いちばん安いマス」を取り出すのに使う。
 * 可読性優先の素直な実装。優先度が小さいものから取り出す（同点の順序は未規定）。
 *
 * ══════════════════════════════════════════════════════════════════════
 *  核心のトリック：「木」は実在しない。ただの配列 ＋ 添字(index)の計算。
 * ══════════════════════════════════════════════════════════════════════
 *
 *  配列 [3, 5, 4, 8, 9, 7] を、こう読むと約束する：
 *
 *                 index0 (3)        ← 先頭 = 木のてっぺん(root) = 最小値
 *               /            \
 *          index1 (5)       index2 (4)
 *          /       \         /
 *     index3 (8)  index4(9) index5(7)
 *
 *  約束はこの 3 本の式だけ（ポインタも Node クラスも要らない）：
 *
 *     親    = (i - 1) >> 1      >>1 は「2 で割って切り捨て」の意味
 *     左の子 = 2*i + 1
 *     右の子 = 2*i + 2
 *
 *  例）index5 の親 = (5-1)>>1 = 2 ✓ ／ index2 の左の子 = 2*2+1 = 5 ✓
 *
 *  ヒープの掟(ふ変条件)：どの親も、自分の子より小さいか等しい。
 *  → だから先頭(index0)が必ず全体の最小値になる。これが「一番安い箱」の正体。
 *
 *  なぜ木でなく配列か：メモリは配列 1 本で済み、push も pop も
 *  木の高さ = log2(要素数) の回数しか動かないので速い（1024 個でも約 10 回）。
 */
export class MinHeap<T> {
  // この配列を上の約束(添字の式)で木構造として扱う。heap[0] が常に最小。
  private heap: { item: T; priority: number }[] = []

  get size(): number {
    return this.heap.length
  }

  isEmpty(): boolean {
    return this.heap.length === 0
  }

  /** 取り出さずに最小要素だけ覗く。 */
  peek(): T | undefined {
    return this.heap[0]?.item
  }

  /**
   * 追加：まず配列の末尾に置き、掟を満たすまで上へ浮かせる(bubbleUp)。
   */
  push(item: T, priority: number): void {
    this.heap.push({ item, priority })
    this.bubbleUp(this.heap.length - 1)
  }

  /**
   * 取り出し：先頭(最小)を返す。空いた穴には末尾の要素を持ってきて、
   * 掟を満たすまで下へ沈める(bubbleDown)。
   */
  pop(): T | undefined {
    const n = this.heap.length
    if (n === 0) return undefined

    const top = this.heap[0] // これが最小値。あとで返す
    const last = this.heap.pop() // 末尾を取り除く
    if (n > 1 && last) {
      // 取り除いた末尾をてっぺんに据え、そこから沈めて木を作り直す
      this.heap[0] = last
      this.bubbleDown(0)
    }
    return top?.item
  }

  /**
   * bubbleUp（浮上）：新しく足した要素を、親より小さい間だけ親と入れ替えて上げる。
   *
   * 例）[3,5,4,8,9,7] に priority=1 を push した直後（1 は末尾 index6）：
   *   index6 の親=(6-1)>>1=2 の値 4。 1<4 → 入替。1 は index2 へ
   *   index2 の親=(2-1)>>1=0 の値 3。 1<3 → 入替。1 は index0(てっぺん)へ
   *   親がいない(i===0) → 終了。1 が新しい最小値になった。
   */
  private bubbleUp(from: number): void {
    let i = from
    const node = this.heap[i] // 浮かせたい本人（毎回コピーせず最後に一度だけ書き込む）
    if (!node) return

    while (i > 0) {
      const parent = (i - 1) >> 1
      const p = this.heap[parent]
      // 親が自分以下ならもう掟を満たしている → 停止
      if (!p || p.priority <= node.priority) break
      // 親の方が大きい → 親を下ろし、自分は親の位置へ上がる
      this.heap[i] = p
      i = parent
    }
    this.heap[i] = node // 落ち着いた位置に本人を置く
  }

  /**
   * bubbleDown（沈下）：てっぺんに来た要素を、
   * 「自分・左の子・右の子」で最小の子より大きい間だけ、その子と入れ替えて下げる。
   *
   * 常に小さい方の子と入れ替えるのがポイント（大きい子と替えると掟が壊れる）。
   * smallest===i（自分が三者で最小）になったら、もう動かす必要がないので停止。
   */
  private bubbleDown(from: number): void {
    let i = from
    const node = this.heap[i] // 沈めたい本人
    if (!node) return

    for (;;) {
      const left = 2 * i + 1
      const right = left + 1
      let smallest = i // 「自分・左・右」で一番小さいのは誰か
      let smallestPriority = node.priority

      const l = this.heap[left]
      if (l && l.priority < smallestPriority) {
        smallest = left
        smallestPriority = l.priority
      }
      const r = this.heap[right]
      if (r && r.priority < smallestPriority) {
        smallest = right
        smallestPriority = r.priority
      }
      // 自分が一番小さい = 掟を満たしている → 停止
      if (smallest === i) break

      // 小さい方の子を引き上げ、自分はその位置へ降りる
      this.heap[i] = this.heap[smallest] as { item: T; priority: number }
      i = smallest
    }
    this.heap[i] = node // 落ち着いた位置に本人を置く
  }
}
