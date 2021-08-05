import React, { Component, CSSProperties } from 'react'

import './styles/PoemLine.css'

interface IPoemLineProps {
  text: string
  frameRef: React.RefObject<HTMLDivElement>
  shuffle?: boolean
  key?: React.Key
}

export default class PoemLine extends Component<IPoemLineProps> {
  pRef = React.createRef<HTMLParagraphElement>()
  spanStyles: CSSProperties[] = []

  getSpanStyle(index: number): CSSProperties {
    const { frameRef, shuffle } = this.props
    if (shuffle) {
      if (this.spanStyles[index]?.transform) return this.spanStyles[index]
      if (!frameRef.current) return {} 

      const width = frameRef.current.clientWidth
      const height = frameRef.current.clientHeight

      const rotate = Math.random() * 360
      const scale = 0.5 + Math.random() * 1.5
      const xOffset = Math.random() * width - width / 2
      const yOffset = Math.random() * height -  height / 2
      const colorL = 27 + Math.random() * 73

      const style = {
        transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg) scale(${scale})`,
        color: `hsl(0deg 100% ${colorL}%)`
      }
      this.spanStyles[index] = style
    } else {
      this.spanStyles = this.spanStyles.map(() => ({}))
    }
    return this.spanStyles[index]
  }

  render() {
    const { text, key } = this.props
    const spans = text.split('').map((c, i) => (
      <span key={i} style={this.getSpanStyle(i)}>{c}</span>
    ))

    return (
      <p ref={this.pRef} className="line" key={key}>{spans}</p>
    )
  }
}