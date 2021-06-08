import jieba from 'nodejieba'

import { Params } from '../utils/poet'
import { softmax } from './math.js'
import { writeFile, readFile, readDir } from './utils.js'

function preprocessSentence(sentence: string): string {
  const punctuation_en = '!"#$%&\'()*+, -./:;<=>?@[\]^_`{|}~'
  const punctuation_zh = '＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､\u3000、〃〈〉《》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏﹑﹔·！？｡。'
  sentence = sentence.replace(/[a-zA-Z]/g, '')  // 去除英文
  sentence = sentence.replace(/\d/g, '')  // 去除数字
  for (const p of punctuation_en) {
    sentence = sentence.split(p).join('\n')
  }
  for (const p of punctuation_zh) {
    sentence = sentence.split(p).join('\n')
  }
  return sentence
}

export default class Processer implements Params {
  articles: string[][][]
  /**
   * embedding表
   */
  wordList: string[]
  /**
   * 词转移矩阵
   */
  transferMat: number[][]
  /**
   * 压缩转移矩阵
   */
  transferList: {k: number[], v: number[]}[]
  /**
   * 句首-句首转移矩阵
   */
  senTransferMat: number[][]
  /**
   * 句首-句首压缩转移矩阵
   */
  senTransferList: {k1: number[], k2: number[], v: number[]}

  constructor() {
    this.wordList = []
    this.articles = []
    this.transferMat = []
    this.transferList = []
    this.senTransferMat = []
    this.senTransferList = {
      k1: [], k2: [], v: []
    }
  }

  /**
   * 初始化
   */
  async init() {
    this.wordList = ['\n']  // 0位置为结束符号
    this.articles = []
    const datasetsList = readDir('./datasets')
    for (const p of datasetsList) {
      await readFile(p)
      .then(content => {
        // 将文章分成句子列表
        const sentences = preprocessSentence(content)
          .split(/\s/)
          .map(s => jieba.cut(s))  // 拆分每句为词
          .filter(s => s.length)
        for (const sentence of sentences) {
          for (const word of sentence) {
            if (!this.wordList.includes(word)) {
              this.wordList.push(word)
            }
          }
        }
        if (sentences.length)
          this.articles.push(sentences)
      })
      .catch(err => {
        console.log(err)
      })
    }
  }

  /**
   * 训练
   */
  train() {
    this.transferMat = []

    // 初始化
    const len = this.wordList.length
    for (let i = 0; i < len; i++) {
      const tmp1 = [], tmp2 = []
      for (let j = 0; j < len; j++) {
        tmp1.push(0)
        tmp2.push(0)
      }
      this.transferMat.push(tmp1)
      this.senTransferMat.push(tmp2)
    }

    // 学习词转移矩阵和词作为句首的概率
    for (const article of this.articles) {
      for (const sentence of article) {
        // 学习句首分布
        const firstWord = sentence[0]
        const firstIndex = this.wordList.indexOf(firstWord)
        this.transferMat[0][firstIndex]++
        // 学习转移概率
        for (let i = 0; i < sentence.length; i++) {
          const i_a = this.wordList.indexOf(sentence[i])  // 本词的embedding索引
          const i_b = i < sentence.length - 1
            ? this.wordList.indexOf(sentence[i + 1])  // 下一个词的embedding索引
            : 0  // 若本词是句尾词，则下一个词是结束符号
          this.transferMat[i_a][i_b]++  // 转移计数
        }
      }

      // 学习首句首词分布
      const firstWord = article[0][0]
      const firstIndex = this.wordList.indexOf(firstWord)
      this.senTransferMat[0][firstIndex]++
      // 学习句首-句首转移概率
      for (let i = 0; i < article.length; i++) {
        const i_a = this.wordList.indexOf(article[i][0])  // 本句首的embedding索引
        const i_b = i < article.length - 1
          ? this.wordList.indexOf(article[i + 1][0])  // 下一个句首的embedding索引
          : 0  // 若本句是结尾，则下一个词是结束符号
        this.senTransferMat[i_a][i_b]++  // 转移计数
      }
    }

    // 转移概率 = 转移计数 / 总数
    for (let i = 0; i < len; i++) {
      let tSum = this.transferMat[i].reduce((s, v) => s + v, 0)
      if (tSum > 0) {
        for (let j = 0; j < len; j++)
          this.transferMat[i][j] /= tSum
      } else {
        this.transferMat[i][0] = 1
      }

      tSum = this.senTransferMat[i].reduce((s, v) => s + v, 0)
      if (tSum > 0) {
        for (let j = 0; j < len; j++)
          this.senTransferMat[i][j] /= tSum
      } else {
        this.senTransferMat[i][0] = 1
      }
    }

    // 创建压缩转移矩阵
    this.transferList = [{
      k: [], v: []
    }]
    // 句首分布照搬
    for (let i = 0; i < len; i++) {
      if (this.transferMat[0][i] > 0) {
        this.transferList[0].k.push(i)
        this.transferList[0].v.push(this.transferMat[0][i])
      }
    }
    // 词转移分布
    const MAX_LENGTH = 10
    for (let i = 1; i < len; i++) {
      const keyValues = this.transferMat[i].map<[number, number]>((v, k) => [k, v])
      keyValues.sort((a, b) => b[1] - a[1])
      const transferVec: {k: number[], v: number[]} = {
        k: [], v: []
      }
      let j = 0
      // 到句尾的概率放在首位
      transferVec.k.push(0)
      transferVec.v.push(this.transferMat[i][0])
      while (
        (j < MAX_LENGTH && keyValues[j][1] > 0)  // 取转移概率不为0的概率最大的前n个词（也可能少于n项）
        || (i === 0 && j < keyValues.length)  // 句首概率不压缩
      ) {
        if (keyValues[j][0] > 0) {
          transferVec.k.push(keyValues[j][0])
          transferVec.v.push(keyValues[j][1])
        }
        j++
      }
      // 重新softmax
      transferVec.v = softmax(transferVec.v)
      this.transferList.push(transferVec)
    }

    // 创建压缩转移矩阵
    this.senTransferList = {
      k1: [], k2: [], v: []
    }
    this.senTransferMat.forEach((vec, i) => vec
      .map<[number, number, number]>((v, k) => [i, k, v])
      .filter(t => t[2])
      .forEach(t => {
        this.senTransferList.k1.push(t[0])
        this.senTransferList.k2.push(t[1])
        this.senTransferList.v.push(t[2])
      })
    )
  }

  /**
   * 保存json信息
   */
  async save() {
    const json: Params = {
      wordList: this.wordList,
      transferList: this.transferList,
      senTransferList: this.senTransferList
    }
    let jsonString = JSON.stringify(json)
    // 压缩小数
    const reg = /0\.[0-9]+/g
    let newString = ''
    while (true) {
      reg.lastIndex = 0
      let result = reg.exec(jsonString)
      if (result !== null) {
        newString = newString.concat(
          jsonString.substring(0, result.index),
          result[0].substring(0, 8)
        )
        jsonString = jsonString.substring(result.index + result[0].length)
      } else {
        newString = newString.concat(jsonString)
        break
      }
    }
    await writeFile('./src/params/index.ts', 'export const params = ' + newString)
    .then(() => {
      console.log('参数保存成功！')
    })
    .catch(err => {
      console.log(err)
    })
  }
}