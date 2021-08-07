import React, { Component, CSSProperties } from 'react'

import './styles/PoemLine.css'

export type SpanLocations = {translateX: number, translateY: number}[]

interface IPoemLineProps {
  text: string
  frameRef: React.RefObject<HTMLDivElement>
  shuffle?: boolean
  spanLocations: SpanLocations
}

export default class PoemLine extends Component<IPoemLineProps> {
  pRef = React.createRef<HTMLParagraphElement>()
  spanRefs: React.RefObject<HTMLSpanElement>[] = []
  spanStyles: CSSProperties[] = []
  lastSpanLocations: SpanLocations = []

  constructor(props: IPoemLineProps) {
    super(props)

    const { text } = props
    for (let i = 0; i < text.length; i++) {
      this.spanRefs.push(React.createRef<HTMLSpanElement>())
      this.lastSpanLocations.push({
        translateX: 0,
        translateY: 0
      })
    }
  }

  getSpanStyle(index: number): CSSProperties {
    const { frameRef, shuffle } = this.props
    if (shuffle) {
      if (this.spanStyles[index]?.transform) return this.spanStyles[index]
      if (!frameRef.current) return {} 

      const width = frameRef.current.clientWidth
      const height = frameRef.current.clientHeight

      const rotate = Math.random() * 360
      const scale = 0.5 + Math.random() * 1.5
      const xOffset = Math.random() * width - width / 2 + this.lastSpanLocations[index].translateX
      const yOffset = Math.random() * height - height / 2 + this.lastSpanLocations[index].translateY
      const colorL = 27 + Math.random() * 73

      const style = {
        transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg) scale(${scale})`,
        color: `hsl(0deg 100% ${colorL}%)`
      }
      this.spanStyles[index] = style
      return style
    } else {
      this.spanStyles[index] = {}
      const xOffset = this.lastSpanLocations[index].translateX
      const yOffset = this.lastSpanLocations[index].translateY
      return {
        transform: `translate(${xOffset}px, ${yOffset}px)`,
      }
    }
  }

  render() {
    const { text, shuffle, spanLocations } = this.props

    if (!shuffle) this.lastSpanLocations = spanLocations.length
      ? spanLocations
      : this.spanRefs.map(() => ({
        translateX: 0,
        translateY: 0
      }))

    const spans = text.split('').map((c, i) => (
      <span key={i} ref={this.spanRefs[i]} style={this.getSpanStyle(i)}>{c}</span>
    ))

    return (
      <p ref={this.pRef} className="line">{spans}</p>
    )
  }
}