import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

import Illustration from './Illustration'
import PoemLine, { SpanLocations } from './PoemLine'
import Poet from '../utils/poet'
import { randomSample } from '../utils/math'
import { params } from '../params/params'
import { wordImgMap } from '../params/wordImgMap'

import './styles/Poetry.css'


interface IPoetryProps {
  show?: boolean
}

interface IPoetryState {
  poetry: string[]
  shuffleStates: boolean[]
  shuffleMode: boolean
  spanLocationsList: SpanLocations[]
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

  state: IPoetryState = {
    poetry: [],
    shuffleStates: [],
    shuffleMode: false,
    spanLocationsList: []
  }

  addPoetry(count: number) {
    const poetry = []
    for (let i = 0; i < count; i++) {
      const sen = this.poet.getSentence()
      poetry.push(sen.string.trim())
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
      shuffleStates: [...shuffleStates, ...newShuffleStates],
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

  getNewSpanLocationsList() {
    const { shuffleStates, poetry } = this.state
    const spanLocationsList: SpanLocations[] = []

    const processLineIndexList: number[] = []
    const charsIndexList: [number, number][] = []
    shuffleStates.forEach((b, i) => {
      if (b) {
        processLineIndexList.push(i)
        spanLocationsList[i] = []
        const newChars = poetry[i].split('')
        charsIndexList.push(...newChars.map((c, j) => [i, j] as [number, number]))
      }
    })

    // 二分法对一段连续数字重排列
    const shuffleIndexes = (start: number, count: number) => {
      const newIndexList: number[] = []
      const queue: [number, number][] = [
        [start, count]
      ]
      let head = 0, tail = 0
      while (head <= tail) {
        const [s, c] = queue[head]
        const num = s + Math.floor(Math.random() * c)
        newIndexList.push(num)

        const leaves: [number, number][] = []
        if (num - s > 0) {
          leaves.push([s, num - s])
        }
        if (s + c - num - 1 > 0) {
          leaves.push([num + 1, s + c - num - 1])
        }

        if (leaves.length === 1) {
          queue.push(leaves[0])
        } else if (leaves.length === 2) {
          if (Math.random() < 0.5) {
            queue.push(leaves[0], leaves[1])
          } else {
            queue.push(leaves[1], leaves[0])
          }
        }
        head++
        tail += leaves.length
      }
      return newIndexList
    }
    const shuffledCharsIndexList = shuffleIndexes(0, charsIndexList.length)
      .map(i => charsIndexList[i])

    // 分句
    let senCount = processLineIndexList.length
    let charCount = charsIndexList.length
    let newSenLength: number[] = []
    let newCharsIndexList: [number, number][] = []
    const MIN_LINE_LEN = 1
    const MAX_LINE_LEN = 16
    processLineIndexList.forEach(() => {
      senCount--
      const min = Math.max(MIN_LINE_LEN, charCount - senCount * MAX_LINE_LEN)
      const max = Math.min(MAX_LINE_LEN, charCount - senCount * MIN_LINE_LEN)
      const len = min + Math.floor(Math.random() * (max - min + 1))
      newSenLength.push(len)
      charCount -= len
    })
    newSenLength = shuffleIndexes(0, newSenLength.length).map(i => newSenLength[i])  // 语句顺序重排
    processLineIndexList.forEach((i, ptr) => {
      for (let j = 0; j < newSenLength[ptr]; j++) newCharsIndexList.push([i, j])
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
    let charPtr = 0
    processLineIndexList.forEach((i, senPtr) => {
      const len = newSenLength[senPtr]
      let lineWidth = -2
      const newLeft: number[] = []
      for (let j = 0; j < len; j++) {
        const charBox = shuffledCharBoxes[charPtr + j]
        lineWidth += 2
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
      charPtr += len
    })
    return spanLocationsList
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
    const { shuffleMode, poetry } = this.state
    const [firstI, lastI] = this.displayedLineRange
    const newShuffleStates = shuffleMode
      ? poetry.map(() => false)
      : this.updateShuffleStates(
        Math.max(firstI - 1, 0),  // 减1防止上一行露半截
        lastI,
      )

    this.setState({
      shuffleMode: !shuffleMode,
      shuffleStates: newShuffleStates,
      spanLocationsList: shuffleMode
        ? this.getNewSpanLocationsList()
        : []
    })
  }

  componentWillMount(){
    this.load()
  }

  render() {
    const { poetry, shuffleMode, shuffleStates, spanLocationsList } = this.state

    const poem: any[] = []
    poetry.forEach((s, i) => {
      poem.push(<PoemLine
        ref={this.poemLineRefs[i]}
        key={i}
        frameRef={this.frameRef}
        text={s}
        shuffle={shuffleMode && shuffleStates[i]}
        spanLocations={spanLocationsList[i] ?? []}
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
          <div className="placeholder content"></div>
          <div className="poetry content">
            {poem}
          </div>
        </InfiniteScroll>
      </div>
    )
  }
}