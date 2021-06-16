import React, { Component } from 'react'

import './styles/Index.css'
import title from '../assets/title.png'

interface IIndexProps {
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
      <div className="index-frame">
        <div className="index no-select">
          <img className="title" src={title} alt="语言恐怖谷效应生成器"/>
          <p className="loading">loading...</p>
        </div>
      </div>
    )
  }

  
}