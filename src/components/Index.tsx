import React, { Component, CSSProperties } from 'react'

import './styles/Index.css'
import title from '../assets/title.png'

interface IIndexProps {
  style: CSSProperties
  onLoad: () => void
}

export default class Index extends Component<IIndexProps> {
  loadTime: number = 0
  timer: any
  hasLoaded: boolean = false

  refresh() {
    this.loadTime += 100
    if ((this.hasLoaded && this.loadTime >= 5000) || this.loadTime >= 10000) {
      this.props.onLoad()
    } else {
      this.timer = setTimeout(this.refresh.bind(this), 100)
    }
  }

  componentDidMount() {
    this.refresh()
    window.addEventListener('load', () => {
      this.hasLoaded = true
    })
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  render() {
    return (
      <div style={this.props.style} className="index-frame">
        <div className="index-bg"></div>
        <div className="index no-select">
          <img className="title" src={title} alt="语言恐怖谷效应生成器"/>
          <p className="loading">loading...</p>
          <p style={{height: 10, margin: 0}}></p>
          <p className="readme">
            <span>无限插图</span>
            <span>无限长诗</span>
          </p>
          <p className="readme">
            <span>双击屏幕</span>
            <span>打乱文字</span>
          </p>
          <p className="readme">
            <span>再次双击</span>
            <span>重组文字</span>
          </p>
          <p style={{height: 10, margin: 0}}></p>
        </div>
      </div>
    )
  }
}