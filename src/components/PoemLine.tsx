import React, { Component, CSSProperties } from 'react'

import './styles/PoemLine.css'

interface IPoemLineProps {
  text: string
  frameRef: React.RefObject<HTMLDivElement>
  shuffle?: boolean
  key?: React.Key
}

export default class PoemLine extends Component<IPoemLineProps> {
  getSpanStyle(): CSSProperties {
    const { frameRef, shuffle } = this.props
    if (shuffle && frameRef.current) {
      const width = frameRef.current.clientWidth
      const height = frameRef.current.clientHeight

      const fontsize = 10 + Math.random() * 20
      const rotate = Math.random() * 360
      const xOffset = Math.random() * width - width / 2
      const yOffset = Math.random() * height -  height / 2
      return {
        fontSize: `${fontsize}px`,
        transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`
      }
    } else {
      return {
        fontSize: '18px'
      }
    }
  }

  render() {
    const { text, key } = this.props
    const spans = text.split('').map((c, i) => (
      <span key={i} style={this.getSpanStyle()}>{c}</span>
    ))

    return (
      <p className="line" key={key}>{spans}</p>
    )
  }
}