import { Params } from './types.js'
import { params } from '../params.js'
import { randomChoice, softmax } from './math.js'

export default class Poet {
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 词转移矩阵
   */
  transferMat: number[][]
  /**
   * 词作为句首的概率
   */
  firstVector: number[]
  /**
   * 词作为句尾的概率
   */
  lastVector: number[]

  /**
   * theta参数
   */
  theta: number = 60
  /**
   * alpha参数
   */
  alpha: number = 1.01

  constructor() {
    this.wordList = []
    this.transferMat = []
    this.firstVector = []
    this.lastVector = []
    this.init()
  }

  /**
   * 初始化
   */
  init() {
    const p = params as Params
    this.wordList = p.wordList
    this.firstVector = p.firstVector

    // 恢复词转移矩阵
    this.transferMat = []
    const len = this.wordList.length
    for (let i = 0; i < len; i++) {
      const tmp = []
      for (let j = 0; j < len; j++) {
        tmp.push(0)
      }
      p.transferList[i].forEach(e => {
        tmp[e[1]] = e[0]
      })
      this.transferMat.push(tmp)
    }

    // 备份last vector
    this.lastVector = this.transferMat.map(v => v[0])
  }

  /**
   * 生成句首词
   * @returns 
   */
  getFirstWordIndex(): number {
    return randomChoice(this.firstVector.slice(1))
  }

  /**
   * 根据上一个词，生成下一个词
   * @param lastWordIndex 
   * @param theta
   * @returns 
   */
  getNewWordIndex(lastWordIndex: number, theta: number): number {
    const len = this.wordList.length
    let transferVec = this.transferMat[lastWordIndex]
      .map(e => e * theta)  // 提高转移概率，theta越大句子越正常
    for (let i = transferVec.length; i < len; i++)
      transferVec.push(0)
    // 再次归一化
    transferVec = softmax(transferVec)
    return randomChoice(transferVec)
  }

  getSentence() {
    // 还原last vector
    this.lastVector.forEach((v, i) => {
      this.transferMat[i][0] = v
    })

    const len = this.wordList.length
    let wordIndex = this.getFirstWordIndex()
    let sentence = this.wordList[wordIndex]
    while (true) {
      wordIndex = this.getNewWordIndex(wordIndex, this.theta)
      const word = this.wordList[wordIndex]
      sentence = sentence.concat(word)
      if (word === '\n')
        break
      // 每生成一个词，提高所有词引发句子结束的概率
      for (let i = 1; i < len; i++) {
        this.transferMat[i][0] *= this.alpha
      }
    }
    return sentence
  }
}