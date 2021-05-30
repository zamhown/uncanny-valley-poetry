export interface Params {
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 压缩转移矩阵
   */
  transferList: [number, number][][]
  /**
   * 词作为句首的概率
   */
  firstVector: number[]
}