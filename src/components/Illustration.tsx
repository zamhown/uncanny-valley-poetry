import React, { Component } from 'react'

import './styles/Illustration.css'

interface IIllustrationProps {
  wordList: string[],
  imgList: string[],
  lineCount: number,
  key?: any
}

const imgDir = 'static/media/illustration/'

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  let newH = h
  while (newH < 0) newH += 360

  const c = v * s
  const x = c * (1 - Math.abs((newH / 60) % 2 - 1))
  const m = v - c
  const [_r, _g, _b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x]
  ][Math.floor((newH % 360) / 60)]
  return [
    Math.floor((_r + m) * 255),
    Math.floor((_g + m) * 255),
    Math.floor((_b + m) * 255)
  ]
}

export default class Illustration extends Component<IIllustrationProps> {
  canvasRefs: React.RefObject<HTMLCanvasElement>[]
  maskRef = React.createRef<HTMLDivElement>()
  maskLabelRef = React.createRef<HTMLDivElement>()
  c2d: any[] = []
  imgObjList: HTMLImageElement[] = []
  mirror: boolean[] = []  // 是否翻转
  hsvd: [number, number, number, number][] = []  // 渐变色初始设置（HSV、H变化方向）

  _canvas: any
  _c2d: any

  constructor(props: IIllustrationProps) {
    super(props)
    this.canvasRefs = this.props.imgList.map(() => React.createRef<HTMLCanvasElement>())
  }

  canvas(layerId: number): HTMLCanvasElement {
    return this.canvasRefs[layerId].current as HTMLCanvasElement
  }

  get absoluteTop(): number {
     return this.maskRef.current ? this.maskRef.current.getBoundingClientRect().top : -1000
  }

  componentDidMount() {
    this.c2d = this.canvasRefs.map((r, i) => this.canvas(i).getContext("2d"))
    this._canvas = document.createElement("canvas")
    this._canvas.width = 448
    this._canvas.height = 224
    this._c2d = this._canvas.getContext("2d")

    this.renderCanvas()

    window.addEventListener('scroll', this.handleScroll.bind(this), true)

    const mask = this.maskRef.current!
    const maskLabel = this.maskLabelRef.current!
    mask.onclick = () => {
      if (maskLabel.style.display === 'block') {
        maskLabel.style.display = 'none'
      } else {
        maskLabel.style.display = 'block'
      }
    }
    maskLabel.onclick = () => maskLabel.style.display = 'hidden'
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.handleScroll.bind(this), true)
  }

  handleScroll() {
    if (this.absoluteTop >= -224 && this.absoluteTop <= window.innerHeight) this.renderCanvas()
  }

  renderCanvas() {
    this.c2d.forEach(c => c.clearRect(0, 0, 224, 224))
    this.props.imgList.forEach((fn, i) => this.draw(fn, i, i === 0))
  }

  render() {
    return <p className="illustration-container" title={this.props.wordList.join('，')}>
      {this.canvasRefs.map((r, i) => <canvas
        ref={r} key={i} width="224" height="224"
      />)}
      <span className="illustration-mask" ref={this.maskRef}>
        <span className="no-select" ref={this.maskLabelRef}>已阅读{this.props.lineCount}行</span>
      </span>
    </p>
  }

  draw(fn: string, layerId: number, background: boolean) {
    const render = (img: HTMLImageElement) => {
      this._c2d.drawImage(img, 0, 0, 448, 224, 0, 0, 448, 224)
      const imgData = this._c2d.getImageData(0, 0, 224, 224)
      const maskData = this._c2d.getImageData(224, 0, 224, 224)
      const foreData = this.c2d[layerId].createImageData(224, 224)
      const gradientMap = this.makeGradientMap(
        ...this.hsvd[layerId],
        this.absoluteTop / window.innerHeight * 270,
      )
      for (let i = 0, h = 224; i < h; i++) {
        for (let j = 0, w = 224; j < w; j++) {
          const forePtr = i * w * 4 + j * 4
          const imgPtr = this.mirror[layerId] ? i * w * 4 + (w - j) * 4 : forePtr
          foreData.data[forePtr + 0] = gradientMap[imgData.data[imgPtr] ?? 0][0]
          foreData.data[forePtr + 1] = gradientMap[imgData.data[imgPtr] ?? 0][1]
          foreData.data[forePtr + 2] = gradientMap[imgData.data[imgPtr] ?? 0][2]
          foreData.data[forePtr + 3] = background ? 255 : (maskData.data[imgPtr] ?? 0)
        }
      }
      
      this.c2d[layerId].putImageData(foreData, 0, 0)
    }

    if (this.imgObjList[layerId]) {
      render(this.imgObjList[layerId])
    } else {
      const img = new Image();
      this.imgObjList[layerId] = img
      this.mirror[layerId] = Boolean(Math.floor(Math.random() * 2))
      this.hsvd[layerId] = [Math.random() * 360, 0.4, 1, Math.floor(Math.random() * 2) ? 1 : -1]
      img.onload = () => render(img)
      if (!img.src) img.src = imgDir + fn
    }
  }

  makeGradientMap(h: number, s: number, v: number, d: number, t: number): [number, number, number][] {
    const result: [number, number, number][] = []
    for (let i = 0; i < 256; i++) {
      const newH = (h + d * t + i * (180 / 255)) % 360
      result.push(hsv2rgb(newH, s, v * i / 255))
    }
    return result
  }

}