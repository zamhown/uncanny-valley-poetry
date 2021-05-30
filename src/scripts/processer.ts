import fs from 'fs'
import path from 'path'
import jiaba from 'nodejieba'

import { Params } from '../utils/types.js'
import { softmax } from '../utils/math.js'

function readFile(path: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    })
  })
}

function writeFile(path: string, data: any) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, 'utf-8', err => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    })
  })
}

function readDir(entry: string): string[] {
  let txtList: string[] = []
  const dirInfo = fs.readdirSync(entry);
  dirInfo.forEach(item => {
    const location = path.join(entry, item);
    const info = fs.statSync(location);
    if (info.isDirectory()) {
      txtList = txtList.concat(readDir(location));
    } else {
      txtList.push(location)
    }
  })
  return txtList
}

function preprocessSentence(sentence: string): string {
  const punctuation_en = '!"#$%&\'()*+, -./:;<=>?@[\]^_`{|}~'
  const punctuation_zh = '＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､\u3000、〃〈〉《》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏﹑﹔·！？｡。'
  sentence = sentence.replace(/[a-zA-Z]/g, '')  // 去除英文
  sentence = sentence.replace(/\d/g, '')  // 去除数字
  for (const p of punctuation_en) {
    sentence = sentence.split(p).join('')
  }
  for (const p of punctuation_zh) {
    sentence = sentence.split(p).join('')
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
   * 词作为句首的概率
   */
  firstVector: number[]
  /**
   * 压缩转移矩阵
   */
  transferList: [number, number][][]

  constructor() {
    this.wordList = []
    this.articles = []
    this.transferMat = []
    this.firstVector = []
    this.transferList = []
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
        const sentences = content
          .replace(/[，。\,\.]/g, '\n')
          .split(/\s/)
          .map(s => preprocessSentence(s))
          .map(s => jiaba.cut(s))  // 拆分每句为词
        for (const sentence of sentences) {
          for (const word of sentence) {
            if (!this.wordList.includes(word)) {
              this.wordList.push(word)
            }
          }
        }
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
    this.firstVector = []

    // 初始化
    const len = this.wordList.length
    for (let i = 0; i < len; i++) {
      const tmp = []
      for (let j = 0; j < len; j++) {
        tmp.push(0)
      }
      this.transferMat.push(tmp)
      this.firstVector.push(0)
    }

    // 学习词转移矩阵和词作为句首的概率
    for (const article of this.articles) {
      for (const sentence of article) {
        const ls = sentence.length
        // 句子非空时学习句首分布
        if (ls > 0) {
          const firstWord = sentence[0]
          const firstIndex = this.wordList.indexOf(firstWord)
          this.firstVector[firstIndex]++  
        }
        // 学习转移概率
        for (let i = 0; i < ls; i++) {
          const i_a = this.wordList.indexOf(sentence[i])  // 本词的embedding索引
          const i_b = i < ls - 1
            ? this.wordList.indexOf(sentence[i + 1])  // 下一个词的embedding索引
            : 0  // 若本词是句尾词，则下一个词是结束符号
          this.transferMat[i_a][i_b]++  // 转移计数
        }
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
    }
    // 句首概率 = 句首计数 / 总数
    let fSum = this.firstVector.reduce((s, v) => s + v, 0)
    for (let i = 0; i < len; i++)
      this.firstVector[i] /= fSum

    // 创建压缩转移矩阵
    this.transferList = []
    const MAX_LENGTH = 10
    for (let i = 0; i < len; i++) {
      const keyValues = this.transferMat[i].map<[number, number]>((v, k) => [v, k])
      keyValues.sort((a, b) => b[0] - a[0])
      // 取转移概率不为0的概率最大的前n个词（也可能少于n项）
      const transferVec: [number, number][] = []
      let j = 0
      while (j < MAX_LENGTH && keyValues[j][0] > 0) {
        transferVec.push(keyValues[j])
        j++
      }
      // 重新softmax
      softmax(transferVec.map(e => e[0]))
        .forEach((v, k) => {
          transferVec[k][0] = v
        })
      this.transferList.push(transferVec)
    }
  }

  /**
   * 保存json信息
   */
  async save() {
    const json: Params = {
      wordList: this.wordList,
      transferList: this.transferList,
      firstVector: this.firstVector
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
    await writeFile('./src/params.ts', 'export const params = ' + newString)
    .then(() => {
      console.log('参数保存成功！')
    })
    .catch(err => {
      console.log(err)
    })
  }
}