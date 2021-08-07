import React, { Component, CSSProperties } from 'react'

import './styles/PoemLine.css'

export type SpanLocation = {translateX: number, translateY: number}

interface IPoemLineProps {
  text: string
  frameRef: React.RefObject<HTMLDivElement>
  spanLocations: SpanLocation[]
  shuffle?: boolean
  onTransitionEnd?: any
}

export default class PoemLine extends Component<IPoemLineProps> {
  pRef = React.createRef<HTMLParagraphElement>()
  spanRefs: React.RefObject<HTMLSpanElement>[] = []
  spanStyles: CSSProperties[] = []
  lastSpanLocations: SpanLocation[] = []

  refreshing: boolean = false

  constructor(props: IPoemLineProps) {
    super(props)
    this.init()
  }

  init() {
    const { text } = this.props
    for (let i = 0; i < text.length; i++) {
      this.spanRefs.push(React.createRef<HTMLSpanElement>())
      this.lastSpanLocations.push(this.emptySpanLocation)
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
      const xOffset = Math.random() * width - width / 2 + (this.lastSpanLocations[index]?.translateX ?? 0)
      const yOffset = Math.random() * height - height / 2 + (this.lastSpanLocations[index]?.translateY ?? 0)
      const colorL = 27 + Math.random() * 73

      const style = {
        transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg) scale(${scale})`,
        color: `hsl(0deg 100% ${colorL}%)`,
        transition: '0.5s'
      }
      this.spanStyles[index] = style
      return style
    } else {
      this.spanStyles[index] = {}
      const xOffset = this.lastSpanLocations[index]?.translateX ?? 0
      const yOffset = this.lastSpanLocations[index]?.translateY ?? 0
      return {
        transform: `translate(${xOffset}px, ${yOffset}px)`,
        transition: this.refreshing ? 'none' : '0.5s'
      }
    }
  }

  get emptySpanLocation(): SpanLocation {
    return {
      translateX: 0,
      translateY: 0
    }
  }

  shouldComponentUpdate(nextProps: IPoemLineProps) {
    const { text, shuffle, spanLocations } = nextProps

    if (text !== this.props.text) {
      this.spanStyles = []
      this.spanRefs = []
      this.lastSpanLocations = []
      for (let i = 0; i < text.length; i++) {
        this.spanRefs.push(React.createRef<HTMLSpanElement>())
        this.lastSpanLocations.push(this.emptySpanLocation)
      }
      this.refreshing = true
    } else if (!shuffle) this.lastSpanLocations = spanLocations.length
      ? spanLocations
      : this.spanRefs.map(() => this.emptySpanLocation)

    return true
  }

  render() {
    const { text, onTransitionEnd } = this.props

    const spans = text.split('').map((c, i) => (
      <span
        key={i}
        ref={this.spanRefs[i]}
        style={this.getSpanStyle(i)}
        onTransitionEnd={onTransitionEnd ? onTransitionEnd(i) : undefined}
      >
        {c}
      </span>
    ))
    this.refreshing = false

    return (
      <p ref={this.pRef} className="line">{spans}</p>
    )
  }
}