import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

import Illustration from './Illustration'
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
}

export default class Poetry extends Component<IPoetryProps, IPoetryState> {
  lastSenIndex: number | undefined
  poet: Poet = new Poet(params)

  illustrations: {
    [where: number]: {
      wordList: string[],
      imgList: string[]
    }
  } = {}
  illustrationWords: Set<string> = new Set()

  state = {
    poetry: []
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
    const { poetry } = this.state
    const newPoetry = this.addPoetry(20)
    this.setState({
      poetry: [...poetry, ...newPoetry]
    })
  }

  componentWillMount(){
    this.load()
  }

  render() {
    const poetry: any[] = []
    this.state.poetry.forEach((s, i) => {
      poetry.push(<p key={i}>{s}</p>)
      if (this.illustrations[i + 1]) {
        poetry.push(<Illustration
          key={'_' + i}
          imgList={this.illustrations[i + 1].imgList}
          wordList={this.illustrations[i + 1].wordList}
          lineCount={i + 1}
        />)
      }
    })
    return (
      <div className="text-frame" style={{opacity: (this.props.show ?? 1) ? 1 : 0}}>
        <InfiniteScroll
          loadMore={this.load.bind(this)}
          hasMore={true}
          useWindow={false}
        >
          <div className="placeholder"></div>
          <div className="poetry">
            {poetry}
          </div>
        </InfiniteScroll>
      </div>
    )
  }
}