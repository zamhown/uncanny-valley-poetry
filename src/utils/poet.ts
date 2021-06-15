import {randomChoice, softmax} from './math'
import hyperParams from '../params/hyperParams.json'


export interface Params {
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 压缩转移矩阵
   */
  transferList: {k: number[], v: number[]}[]
  /**
   * 句首-句首压缩转移矩阵
   */
  senTransferList: {k1: number[], k2: number[], v: number[]}
}

export interface RawParams {
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 压缩转移矩阵
   */
  transferList: [number[], number[]][]
  /**
   * 句首-句首压缩转移矩阵
   */
  senTransferList: [number[], number[], number[]]
}

export default class Poet implements Params {
  /**
   * embedding表
   */
  wordList: string[]

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
   * theta参数
   */
  theta: number = hyperParams.theta
  /**
   * alpha参数
   */
  alpha: number = hyperParams.alpha
  /**
   * beta参数
   */
  beta: number = hyperParams.beta


  constructor(params: RawParams) {
    this.wordList = []
    this.transferList = []
    this.lastVector = []
    this.senTransferList = {
      k1: [], k2: [], v: []
    }
    this.senTransferMat = {}
    this.init(params)
  }

  /**
   * 初始化
   */
  init(params: RawParams) {
    this.wordList = params.wordList
    this.transferList = params.transferList.map(t => ({
      'k': t[0],
      'v': t[1]
    }))
    this.senTransferList = {
      'k1': params.senTransferList[0],
      'k2': params.senTransferList[1],
      'v': params.senTransferList[2],
    }

    // 备份last vector
    this.lastVector = this.transferList.map(vec => vec.v[0])

    // 所有词转移概率都乘以theta
    this.transferList.forEach(vec => vec.v = vec.v.map(v => v * this.theta))
    // 所有句转移概率都乘以alpha
    this.senTransferList.v = this.senTransferList.v.map(v => v * this.alpha)

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

  getSentence(lastSenIndex?: number): {
    string: string,
    index: number,
    words: string[]
  } {
    // 还原last vector
    this.transferList.forEach((vec, id) => {
      vec.v[0] = this.lastVector[id]
    })

    const len = this.wordList.length
    const firstIndex = this.getSentenceFirstWordIndex(lastSenIndex)
    let wordIndex = firstIndex
    let sentence = this.wordList[wordIndex]
    let words = [this.wordList[wordIndex]]
    while (true) {
      wordIndex = this.getNewWordIndex(wordIndex)
      const word = this.wordList[wordIndex]
      sentence = sentence.concat(word)
      words.push(word)
      if (word === '\n')
        break
      // 每生成一个词，提高所有词引发句子结束的概率
      for (let i = 1; i < len; i++) {
        this.transferList[i].v[0] *= this.beta
      }
    }
    return {
      string: sentence,
      index: firstIndex,
      words
    }
  }
}