import {randomChoice, softmax} from './math'
import hyperParams from '../params/hyperParams.json'
import {Params, RawParams} from './poet'


export default class PoetLimited implements Partial<Params> {
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 本次作诗所能用的词库（id列表）
   */
  limitedWords: number[]

  /**
   * 压缩转移矩阵
   */
  transferList: {k: number[], v: number[]}[]
  /**
   * 词作为句尾的概率
   */
  lastVector: number[]

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


  constructor(params: RawParams, limitedWords: number[]) {
    this.wordList = []
    this.limitedWords = []
    this.transferList = []
    this.lastVector = []
    this.init(params, limitedWords)
  }

  /**
   * 初始化
   */
  init(params: RawParams, limitedWords: number[]) {
    this.wordList = params.wordList
    this.transferList = params.transferList.map(t => ({
      'k': t[0],
      'v': t[1]
    }))
    this.limitedWords = [...limitedWords]

    // 备份last vector
    this.lastVector = this.transferList.map(vec => vec.v[0])

    // 所有词转移概率都乘以theta
    this.transferList.forEach(vec => vec.v = vec.v.map(v => v * this.theta))
  }

  /**
   * 生成首词
   * @returns 
   */
  getFirstWordIndex(): number | undefined {
    // 获取所有句首词id
    const idSet = new Set<number>(this.transferList[0].k)
    const idList = this.limitedWords.filter(id => idSet.has(id))
    if (!idList.length) return

    // 完全随机挑选
    const selectedId = idList[Math.floor(Math.random() * idList.length)]
    this.limitedWords.splice(this.limitedWords.indexOf(selectedId), 1)
    return selectedId
  }

  /**
   * 根据上一个词，生成下一个词
   * @param lastWordIndex 
   * @param theta
   * @returns 
   */
  getNewWordIndex(lastWordIndex: number): number {
    const idSet = new Set<number>(this.transferList[lastWordIndex].k)
    const idList = [0, ...this.limitedWords.filter(id => idSet.has(id))]
    const vList = idList.map(
      id => this.transferList[lastWordIndex].v[this.transferList[lastWordIndex].k.indexOf(id)]
    )
    // 归一化
    const transferVec = softmax(vList)

    const selectedId = idList[randomChoice(transferVec)]
    if (selectedId > 0) this.limitedWords.splice(this.limitedWords.indexOf(selectedId), 1)
    return selectedId
  }

  getSentence(): {
    string: string,
    index: number,
    words: string[],
    wordIndexes: number[]
  } | undefined {
    // 还原last vector
    this.transferList.forEach((vec, id) => {
      vec.v[0] = this.lastVector[id]
    })

    const len = this.wordList.length
    const firstIndex = this.getFirstWordIndex()
    if (firstIndex === undefined) return

    let wordIndex = firstIndex
    let sentence = this.wordList[wordIndex]
    let words = [this.wordList[wordIndex]]
    let wordIndexes = [wordIndex]
    while (true) {
      wordIndex = this.getNewWordIndex(wordIndex)
      const word = this.wordList[wordIndex]
      if (word === '\n') break  // 换行符将不会出现在诗句中
      sentence = sentence.concat(word)
      words.push(word)
      wordIndexes.push(wordIndex)

      // 每生成一个词，提高所有词引发句子结束的概率
      for (let i = 1; i < len; i++) {
        this.transferList[i].v[0] *= this.beta
      }
    }
    return {
      string: sentence,
      index: firstIndex,
      words,
      wordIndexes
    }
  }
}