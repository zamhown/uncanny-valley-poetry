import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

import Illustration from './Illustration'
import PoemLine from './PoemLine'
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
    shuffleMode: false
  }

  addPoetry(count: number) {
    const poetry = []
    for (let i = 0; i < count; i++) {
      const sen = this.poet.getSentence()
      poetry.push(sen.string)
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

  get lastDisplayedLineIndex(): number {
    const frame = this.frameRef.current
    let lastI = 0
    if (frame) {
      for (let i = 0; i < this.poemLineRefs.length; i++) {
        const p = this.poemLineRefs[i].current?.pRef.current
        if (p && p.offsetTop > frame.clientHeight + this.poemScrollTop) {
          lastI = Math.max(i - 1, 0)
          break
        }
      }
    }
    return lastI
  }

  updateShuffleStates(shuffleNum: number): boolean[] {
    const { poetry } = this.state
    const shuffleStates: boolean[] = []
    const tmp = Math.max(Math.min(shuffleNum, poetry.length), 0)
    for (let i = 0; i < tmp; i++) shuffleStates.push(true)
    for (let i = tmp; i < poetry.length; i++) shuffleStates.push(false)
    return shuffleStates
  }

  handleScroll(ev: any) {
    this.poemScrollTop = ev.target.scrollTop
    const { shuffleMode, shuffleStates } = this.state
    if (shuffleMode) {
      const lastI = this.lastDisplayedLineIndex
      let flag = false
      const newShuffleStates = this.updateShuffleStates(lastI).map(
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
    const shuffleStates = shuffleMode
      ? this.updateShuffleStates(poetry.length)
      : this.updateShuffleStates(this.lastDisplayedLineIndex + 1)
    this.setState({
      shuffleMode: !shuffleMode,
      shuffleStates
    })
  }

  componentWillMount(){
    this.load()
  }

  render() {
    const { poetry, shuffleMode, shuffleStates } = this.state

    const poem: any[] = []
    poetry.forEach((s, i) => {
      poem.push(<PoemLine
        ref={this.poemLineRefs[i]}
        key={i}
        frameRef={this.frameRef}
        text={s}
        shuffle={shuffleMode && shuffleStates[i]}
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
          loadMore={this.load.bind(this)}
          hasMore={true}
          useWindow={false}
          style={{ width: '100%' }}
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