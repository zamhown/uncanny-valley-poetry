/**
 * 根据概率分布随机抽取一项，返回索引
 * @param p 概率分布
 */
export function randomChoice(p: number[]): number {
  const r = Math.random()
  let ptr = 0
  for (let i = 0; i < p.length - 1; i++) {
    if (r >= ptr && r < ptr + p[i]) {
      return i
    } else {
      ptr += p[i]
    }
  }
  return p.length - 1
}
  
export function sigmoid(x: number): number {
  // 对sigmoid函数的优化，避免了出现极大的数据溢出
  if (x >= 0) {
    return 1 / (1 + Math.pow(Math.E, -x))
  } else {
    const ex = Math.pow(Math.E, x)
    return ex / (1 + ex)
  }
}

export function softmax(x: number[]): number[] {
  const sigX = x.map(x => sigmoid(-x))
  const sig = sigX.map(x => 1 / x - 1)
  const sum = sig.reduce((s, x) => s + x, 0)
  return sig.map(x => x / sum)
}

export default class Poet {
  /**
   * embedding哈希表
   */
  wordHash: { [key: string]: string[] }
  wordHashList: string[]

  /**
   * 压缩转移矩阵
   */
  transferList: {k: number[], v: number[]}[]
  /**
   * 词作为句尾的概率
   */
  lastVector: number[]

  /**
   * 句首-句首转移矩阵（部分）
   */
  senTransferMat: {[id: number]: {[id: number]: number}}
  /**
   * 句首-句首压缩转移矩阵
   */
  senTransferList: {k1: number[], k2: number[], v: number[]}

  /**
   * theta1参数
   */
  theta1: number = 60
  /**
   * theta2参数
   */
  theta2: number = 1
  /**
   * alpha参数
   */
  alpha: number = 2

  params: any

  constructor(params: any) {
    this.params = params
    this.wordHash = {}
    this.wordHashList = []
    this.transferList = []
    this.lastVector = []
    this.senTransferList = {
      k1: [], k2: [], v: []
    }
    this.senTransferMat = {}
    this.init()
  }

  /**
   * 初始化
   */
  init() {
    const p = this.params
    this.wordHash = p.wordHash
    this.wordHashList = p.wordHashList
    this.transferList = p.transferList
    this.senTransferList = p.senTransferList

    // 备份last vector
    this.lastVector = this.transferList.map(vec => vec.v[0])

    // 所有词转移概率都乘以theta1
    this.transferList.forEach(vec => vec.v = vec.v.map(v => v * this.theta1))
    // 所有句转移概率都乘以theta2
    this.senTransferList.v = this.senTransferList.v.map(v => v * this.theta2)

    // 构建句首-句首转移矩阵
    const stl = this.senTransferList
    for (let i = 0; i < stl.v.length; i++) {
      if (!this.senTransferMat[stl.k1[i]])
        this.senTransferMat[stl.k1[i]] = {}
      this.senTransferMat[stl.k1[i]][stl.k2[i]] = stl.v[i]
    }
    // 句首-句首转移概率预先进行softmax
    for (const key1 of Object.keys(this.senTransferMat)) {
      const id1 = Number(key1)
      const id2List = Object.keys(this.senTransferMat[id1]).map(e => Number(e))
      const vList = softmax(id2List.map(id2 => this.senTransferMat[id1][id2]))
      vList.forEach((v, idx) => this.senTransferMat[id1][id2List[idx]] = v)
    }
  }

  /**
   * 生成首词
   * @returns 
   */
  getFirstWordIndex(): number {
    // 获取所有句首词id
    const idSet = new Set<number>([
      ...this.senTransferList.k1,
      ...this.senTransferList.k2
    ])
    // 完全随机挑选
    const idList: number[] = []
    idSet.forEach(id => idList.push(id))
    return idList[Math.floor(Math.random() * idList.length)]
  }

  /**
   * 根据上一个词，生成下一个词
   * @param lastWordIndex 
   * @param theta
   * @returns 
   */
  getNewWordIndex(lastWordIndex: number): number {
    // 归一化
    const transferVec = softmax(this.transferList[lastWordIndex].v)
    return this.transferList[lastWordIndex].k[randomChoice(transferVec)]
  }

  /**
   * 生成每句的首词
   * @param lastSenIndex 
   * @returns 
   */
  getSentenceFirstWordIndex(lastSenIndex?: number) {
    if (lastSenIndex === undefined) {
      return this.getFirstWordIndex()
    } else {
      // 找到衔接词分布
      const idList = Object.keys(this.senTransferMat[lastSenIndex]).map(e => Number(e))
      const vList = idList.map(id => this.senTransferMat[lastSenIndex][id])
      // 将分布叠加在句首词分布上
      const id2List = this.transferList[0].k
      const v2List = [...this.transferList[0].v]
      idList.forEach((id, idx) => {
        const id2 = id2List.indexOf(id)
        if (id2 >= 0)
          v2List[id2] += vList[idx]
      })
      // 归一化
      return id2List[randomChoice(softmax(v2List))]
    }
  }

  getWord(wordIndex: number): string {
    const hash = this.wordHashList[wordIndex]
    return this.wordHash[hash][Math.floor(Math.random() * this.wordHash[hash].length)]  // 随机选取一词
  }

  getSentence(lastSenIndex?: number): {
    str: string,
    index: number
  } {
    // 还原last vector
    this.transferList.forEach((vec, id) => {
      vec.v[0] = this.lastVector[id]
    })

    const len = this.wordHashList.length
    const firstIndex = this.getSentenceFirstWordIndex(lastSenIndex)
    let wordIndex = firstIndex
    let sentence = this.getWord(wordIndex)
    while (true) {
      wordIndex = this.getNewWordIndex(wordIndex)
      const word = this.getWord(wordIndex)
      sentence = sentence.concat(word)
      if (word === '\n')
        break
      // 每生成一个词，提高所有词引发句子结束的概率
      for (let i = 1; i < len; i++) {
        this.transferList[i].v[0] *= this.alpha
      }
    }
    return {
      str: sentence,
      index: firstIndex
    }
  }
}