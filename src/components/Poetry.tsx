import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

import Illustration from './Illustration'
import PoemLine, { SpanLocation } from './PoemLine'
import Poet from '../utils/poet'
import PoetLimited from '../utils/poetLimited'
import { randomSample } from '../utils/math'
import { params } from '../params/params'
import { wordImgMap } from '../params/wordImgMap'

import './styles/Poetry.css'

type Line = {string: string, indexes: number[]}

interface IPoetryProps {
  show?: boolean
}

interface IPoetryState {
  poetry: Line[]
  shuffleStates: boolean[]
  shuffleMode: boolean
  spanLocationsList: SpanLocation[][]
}

export default class Poetry extends Component<IPoetryProps, IPoetryState> {
  frameRef = React.createRef<HTMLDivElement>()
  lastSenIndex: number | undefined
  poet: Poet = new Poet(params)

  illustrations: {
    [where: number]: {
      wordList: string[],
      imgList: string[]
    }
  } = {}
  illustrationWords: Set<string> = new Set()

  poemLineRefs: React.RefObject<PoemLine>[] = []
  poemScrollTop: number = 0

  refreshing: boolean = false
  plannedCharsIndexSet: Set<string> = new Set()
  refreshedCharsIndexSet: Set<string> = new Set()
  newPoetry: Line[] | undefined

  state: IPoetryState = {
    poetry: [],
    shuffleStates: [],
    shuffleMode: false,
    spanLocationsList: []
  }

  addPoetry(count: number) {
    const poetry: Line[] = []
    for (let i = 0; i < count; i++) {
      const sen = this.poet.getSentence()
      poetry.push({
        string: sen.string,
        indexes: sen.wordIndexes
      })
      // 插图
      for (const w of sen.words) {
        if (wordImgMap[w])
          this.illustrationWords.add(w)
      }
    }
    
    if (this.illustrationWords.size >= 10) {
      const iwList: string[] = []
      this.illustrationWords.forEach(w => iwList.push(w))
      const words = randomSample(iwList, 3)
      console.log(words)

      this.illustrationWords.clear()
      this.illustrations[this.state.poetry.length + count] = {
        imgList: words.map(
          w => randomSample(wordImgMap[w], 1)[0]
        ),
        wordList: words
      }
    }

    return poetry
  }

  changePoetry(limitedWords: number[], count: number) {
    const poetLimited = new PoetLimited(params, limitedWords)
    const poetry: Line[] = []
    for (let i = 0; i < count; i++) {
      const sen = poetLimited.getSentence()
      if (sen) {
        poetry.push({
          string: sen.string,
          indexes: sen.wordIndexes
        })
      } else {
        break
      }
    }

    // 匀诗
    const retainWords = poetLimited.limitedWords
    const oldSenLen = poetry.length
    if (oldSenLen < count) {
      for (let i = oldSenLen; i < count; i++) {
        let wordId = -1
        if (retainWords.length) {
          wordId = retainWords.pop()!
        } else {
          let maxLen = 0
          let maxi = 0
          poetry.forEach((l, i) => {
            if (l.indexes.length > maxLen) {
              maxLen = l.indexes.length
              maxi = i
            }
          })
          wordId = poetry[maxi].indexes.pop()!
          poetry[maxi].string = poetry[maxi].indexes.map(id => params.wordList[id]).join('')
        }
        poetry.push({
          string: params.wordList[wordId],
          indexes: [wordId]
        })
      }
    }
    while (retainWords.length > 0) {
      if (oldSenLen < count) {
        for (let i = oldSenLen; i < count; i++) {
          if (retainWords.length) {
            const wordId = retainWords.pop()!
            poetry[i].string += params.wordList[wordId]
            poetry[i].indexes.push(wordId)
          } else break
        }
      } else {
        const wordId = retainWords.pop()!
        let minLen = Infinity
        let mini = 0
        poetry.forEach((l, i) => {
          if (l.indexes.length < minLen) {
            minLen = l.indexes.length
            mini = i
          }
        })
        poetry[mini].string += params.wordList[wordId]
        poetry[mini].indexes.push(wordId)
      }
    }

    // 对行进行重排
    return randomSample(poetry, poetry.length)
  }

  load() {
    const { poetry, shuffleStates } = this.state
    const newPoetry = this.addPoetry(20)
    const newShuffleStates = newPoetry.map(() => false)
    const newPoemLineRefs = newPoetry.map(() => React.createRef<PoemLine>())

    this.poemLineRefs = [
      ...this.poemLineRefs,
      ...newPoemLineRefs
    ]
    this.setState({
      poetry: [...poetry, ...newPoetry],
      shuffleStates: [...shuffleStates, ...newShuffleStates]
    })
  }

  get displayedLineRange(): [number, number] {
    const frame = this.frameRef.current
    let firstI = -1
    let lastI = -1
    if (frame) {
      for (let i = 0; i < this.poemLineRefs.length; i++) {
        const p = this.poemLineRefs[i].current?.pRef.current
        if (p) {
          if (firstI < 0 && p.offsetTop > this.poemScrollTop) firstI = i
          if (p.offsetTop > frame.clientHeight + this.poemScrollTop) lastI = Math.max(i - 1, 0)
        }
        if (firstI >= 0 && lastI >= 0) break
      }
    }
    return [firstI, Math.max(lastI, firstI)]
  }

  updateShuffleStates(startI: number, endI: number): boolean[] {
    const { poetry } = this.state
    const shuffleStates: boolean[] = []
    for (let i = 0; i < startI; i++) shuffleStates.push(false)
    for (let i = startI; i <= endI; i++) shuffleStates.push(true)
    for (let i = endI; i < poetry.length; i++) shuffleStates.push(false)
    return shuffleStates
  }

  getNewSpanLocations() {
    const { shuffleStates, poetry } = this.state
    const spanLocationsList: SpanLocation[][] = []

    const processLineIndexList: number[] = []
    const charsIndexList: [number, number][] = []
    const chars: string[] = []
    const wordIndexes: number[] = []
    shuffleStates.forEach((b, i) => {
      if (b) {
        processLineIndexList.push(i)
        spanLocationsList[i] = []
        const newChars = poetry[i].string.split('')
        chars.push(...newChars)
        charsIndexList.push(...newChars.map((c, j) => [i, j] as [number, number]))
        wordIndexes.push(...poetry[i].indexes)
      }
    })

    const changedPoetry = this.changePoetry(wordIndexes, processLineIndexList.length)

    // 对号入座
    const shuffledCharIdSet = new Set<number>()
    const shuffledCharsIndexList: [number, number][] = []
    const newSenLength: number[] = []
    const newCharsIndexList: [number, number][] = []
    changedPoetry.forEach((l, ptr) => {
      newSenLength.push(l.string.length)
      for (let j = 0; j < l.string.length; j++) {
        newCharsIndexList.push([processLineIndexList[ptr], j])
        for (let k = 0; k < chars.length; k++) {
          if (chars[k] === l.string[j] && !shuffledCharIdSet.has(k)) {
            shuffledCharIdSet.add(k)
            shuffledCharsIndexList.push(charsIndexList[k])
            break
          }
        }
      }
    })

    // 重构 + 映射
    const shuffledCharBoxes = shuffledCharsIndexList.map(charIndex => {
      const span = this.poemLineRefs[charIndex[0]].current!.spanRefs[charIndex[1]].current!
      return {
        top: span.offsetTop,
        left: span.offsetLeft,
        width: span.offsetWidth
      }
    })
    const newPoetry: Line[] = [...poetry]
    let charPtr = 0
    processLineIndexList.forEach((i, senPtr) => {
      const len = newSenLength[senPtr]
      let lineWidth = 0
      const newLeft: number[] = []
      for (let j = 0; j < len; j++) {
        const charBox = shuffledCharBoxes[charPtr + j]
        newLeft.push(lineWidth)
        lineWidth += charBox.width
      }
      const p = this.poemLineRefs[i].current!.pRef.current!
      const leftOffset = (p.offsetWidth - lineWidth) / 2
      for (let j = 0; j < len; j++) {
        const charIndex = shuffledCharsIndexList[charPtr + j]
        const charBox = shuffledCharBoxes[charPtr + j]
        spanLocationsList[charIndex[0]][charIndex[1]] = {
          translateX: leftOffset + newLeft[j] - charBox.left,
          translateY: p.offsetTop - charBox.top
        }
      }
      newPoetry[i] = changedPoetry[senPtr]
      charPtr += len
    })
    return {
      spanLocationsList,
      poetry: newPoetry,
      charsIndexList
    }
  }

  handleScroll(ev: any) {
    this.poemScrollTop = ev.target.scrollTop
    const { shuffleMode, shuffleStates } = this.state
    if (shuffleMode) {
      const [firstI, lastI] = this.displayedLineRange
      let flag = false
      const newShuffleStates = this.updateShuffleStates(
        Math.min(firstI + (
          firstI
            ? 1
            : 0  // 防止第一行无法爆炸
        ), shuffleStates.length - 1),
        Math.max(lastI - 1, 0)
      ).map(
        (b, i) => {
          const state = b || shuffleStates[i]
          if (state !== shuffleStates[i]) flag = true
          return state
        }
      )
      if (flag) {
        this.setState({
          shuffleStates: newShuffleStates
        })
      }
    }
  }

  handleDoubleClick() {
    if (this.refreshing) return

    const { shuffleMode, poetry } = this.state
    const [firstI, lastI] = this.displayedLineRange
    const newShuffleStates = shuffleMode
      ? poetry.map(() => false)
      : this.updateShuffleStates(
        Math.max(firstI - 1, 0),  // 减1防止上一行露半截
        lastI,
      )

    const newState = {
      shuffleMode: !shuffleMode,
      shuffleStates: newShuffleStates
    }
    if (shuffleMode) {
      const { spanLocationsList, poetry, charsIndexList } = this.getNewSpanLocations()
      this.refreshing = true
      this.plannedCharsIndexSet = new Set(charsIndexList.map(t => `${t[0]}-${t[1]}`))
      this.refreshedCharsIndexSet = new Set()
      this.newPoetry = poetry
      this.setState({
        ...newState,
        spanLocationsList: spanLocationsList
      })
    } else {
      this.setState({
        ...newState,
        spanLocationsList: []
      })
    }
  }

  handleSpanTransitionEnd = (i: number) => (j: number) => () => {
    if (this.refreshing) {
      const charIndex = `${i}-${j}`
      if (this.plannedCharsIndexSet.has(charIndex)) this.refreshedCharsIndexSet.add(charIndex)
      if (this.refreshedCharsIndexSet.size === this.plannedCharsIndexSet.size) {
        this.refreshing = false
        if (this.newPoetry) {
          this.setState({
            poetry: this.newPoetry,
            spanLocationsList: []
          })
        }
      }
    }
  }

  componentWillMount(){
    this.load()
  }

  render() {
    const { poetry, shuffleMode, shuffleStates, spanLocationsList } = this.state

    const poem: any[] = []
    poetry.forEach((l, i) => {
      poem.push(<PoemLine
        ref={this.poemLineRefs[i]}
        key={i}
        frameRef={this.frameRef}
        text={l.string}
        shuffle={shuffleMode && shuffleStates[i]}
        spanLocations={spanLocationsList[i] ?? []}
        onTransitionEnd={this.refreshing ? this.handleSpanTransitionEnd(i) : undefined}
      />)
      if (this.illustrations[i + 1]) {
        poem.push(<Illustration
          key={'_' + i}
          imgList={this.illustrations[i + 1].imgList}
          wordList={this.illustrations[i + 1].wordList}
          lineCount={i + 1}
        />)
      }
    })

    return (
      <div
        ref={this.frameRef}
        className="text-frame"
        style={{opacity: (this.props.show ?? 1) ? 1 : 0}}
        onDoubleClick={this.handleDoubleClick.bind(this)}
        onScroll={this.handleScroll.bind(this)}
      >
        <InfiniteScroll
          className="content"
          loadMore={this.load.bind(this)}
          hasMore={true}
          useWindow={false}
        >
          <div className="placeholder"></div>
          <div className="poetry">
            {poem}
          </div>
        </InfiniteScroll>
      </div>
    )
  }
}