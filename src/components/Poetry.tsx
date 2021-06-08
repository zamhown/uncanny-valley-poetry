import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

import Poet from '../utils/poet'
import { params } from '../params/index'

import './style/Poetry.css'

interface IPoetryState {
  poetry: string[]
}

export default class Poetry extends Component<{}, IPoetryState> {
  lastSenIndex: number | undefined
  poet: Poet

  state = {
    poetry: []
  }

  constructor(props: {}) {
    super(props)
    this.poet = new Poet(params)
  }

  addPoetry(count: number) {
    const poetry = []
    for (let i = 0; i < count; i++) {
      const sen = this.poet.getSentence()
      poetry.push(sen.str)
    }
    console.log(poetry)
    return poetry
  }

  load() {
    const { poetry } = this.state
    this.setState({
      poetry: [...poetry, ...this.addPoetry(20)]
    })
  }

  componentWillMount(){
    this.load()
  }

  render() {
    const poetry = this.state.poetry.map(
      (s, k) => <p key={k}>{s}</p>
    )
    return (
      <div className="text-frame">
        <InfiniteScroll
          loadMore={this.load.bind(this)}
          hasMore={true}
          useWindow={false}
        >
          <div className="poetry">
            {poetry}
          </div>
        </InfiniteScroll>
      </div>
    )
  }

  
}