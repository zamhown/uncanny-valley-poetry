import React, { Component, CSSProperties } from 'react'

import './styles/Illustration.css'

interface IIllustrationProps {
  wordList: string[]
  imgList: string[]
  lineCount: number
  zIndex?: number
}

interface IIllustrationState {
  clicked: boolean
}

const imgDir = 'static/media/illustration/'
const CANVAS_WIDTH = 225
const CANVAS_HEIGHT = 225

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

export default class Illustration extends Component<IIllustrationProps, IIllustrationState> {
  canvasRefs: React.RefObject<HTMLCanvasElement>[]
  imgCanvasRefs: React.RefObject<HTMLCanvasElement>[]
  maskRef = React.createRef<HTMLDivElement>()
  c2d: CanvasRenderingContext2D[] = []
  imgC2d: CanvasRenderingContext2D[] = []
  imgObjList: HTMLImageElement[] = []
  mirror: boolean[] = []  // 是否翻转
  hsvd: [number, number, number, number][] = []  // 渐变色初始设置（HSV、H变化方向）

  _canvas: any
  _c2d: any

  state = {
    clicked: false
  }

  constructor(props: IIllustrationProps) {
    super(props)
    this.canvasRefs = this.props.imgList.map(() => React.createRef<HTMLCanvasElement>())
    this.imgCanvasRefs = this.props.imgList.map(() => React.createRef<HTMLCanvasElement>())
  }

  canvas(layerId: number): HTMLCanvasElement {
    return this.canvasRefs[layerId].current as HTMLCanvasElement
  }

  imgCanvas(layerId: number): HTMLCanvasElement {
    return this.imgCanvasRefs[layerId].current as HTMLCanvasElement
  }

  get absoluteTop(): number {
     return this.maskRef.current ? this.maskRef.current.getBoundingClientRect().top : -1000
  }

  componentDidMount() {
    this.c2d = this.canvasRefs.map((r, i) => this.canvas(i).getContext("2d")!)
    this.imgC2d = this.canvasRefs.map((r, i) => this.imgCanvas(i).getContext("2d")!)
    this._canvas = document.createElement("canvas")
    this._canvas.width = CANVAS_WIDTH * 2
    this._canvas.height = CANVAS_HEIGHT
    this._c2d = this._canvas.getContext("2d")

    this.renderCanvas()

    window.addEventListener('scroll', this.handleScroll.bind(this), true)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.handleScroll.bind(this), true)
  }

  handleScroll() {
    if (this.absoluteTop >= -CANVAS_HEIGHT && this.absoluteTop <= window.innerHeight) this.updateCanvas()
  }

  renderCanvas() {
    this.c2d.forEach(c => c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT))
    this.imgC2d.forEach(c => c.clearRect(
      0, 0, CANVAS_WIDTH / this.imgC2d.length, CANVAS_HEIGHT / this.imgC2d.length
    ))
    this.props.imgList.forEach((fn, i) => this.draw(fn, i, i === 0))
  }

  updateCanvas() {
    this.c2d.forEach(c => c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT))
    this.props.imgList.forEach((fn, i) => this.draw(fn, i, i === 0, true))
  }

  render() {
    const { clicked } = this.state
    const imgLen = this.imgCanvasRefs.length
    const blockStyle: CSSProperties = {
      width: `${CANVAS_WIDTH}px`,
      height: `${CANVAS_HEIGHT}px`,
      lineHeight: `${CANVAS_HEIGHT}px`
    }
    const imgCanvasStyle: CSSProperties = {
      width: `${CANVAS_WIDTH / imgLen}px`,
      height: `${CANVAS_HEIGHT / imgLen}px`,
    }
    return <p
      className="illustration-container"
      title={this.props.wordList.join('，')}
      style={{zIndex: this.props.zIndex, height: `${CANVAS_HEIGHT}px`}}
    >
      <div>
        {this.canvasRefs.map((r, i) => <canvas
          ref={r} key={i} className="layer" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{
            ...blockStyle,
            zIndex: imgLen + i,
            ...(i ? {} : {
              boxShadow: '0 0 8px #161616'
            })
          }}
        />)}
        {this.imgCanvasRefs.map((r, i) => <canvas
          ref={r} key={i} className="img"
          width={CANVAS_WIDTH / imgLen} height={CANVAS_HEIGHT / imgLen}
          style={{
            ...imgCanvasStyle,
            zIndex: i,
            marginTop: `0px`,
            marginLeft: clicked ? `${CANVAS_WIDTH}px` : `${CANVAS_WIDTH - CANVAS_WIDTH / imgLen}px`,
            boxShadow: clicked ? '0 0 5px black' : 'none',
            transitionDelay: `${0.1 * i}s`
          }}
        />)}
        <span className="illustration-mask" ref={this.maskRef} style={blockStyle}>
          <span className="no-select" style={{
            ...blockStyle,
            zIndex: 99,
            opacity: clicked ? 1 : 0
          }} onClick={() => this.setState({clicked: !clicked})}>已阅读{this.props.lineCount}行</span>
        </span>
      </div>
    </p>
  }

  draw(fn: string, layerId: number, background: boolean, onlyLayer?: boolean) {
    const render = (img: HTMLImageElement) => {
      this._c2d.drawImage(img, 0, 0, 448, 224, 0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT)

      if (!onlyLayer) {
        const imgLen = this.imgC2d.length
        if (this.mirror[layerId]) {
          this.imgC2d[layerId].scale(-1, 1)
          this.imgC2d[layerId].translate(-CANVAS_WIDTH / imgLen, 0)
        } else {
          this.imgC2d[layerId].scale(1, 1)
          this.imgC2d[layerId].translate(0, 0)
        }
        this.imgC2d[layerId].drawImage(
          img,
          0, 0, 224, 224,
          0, 0, CANVAS_WIDTH / imgLen, CANVAS_HEIGHT / imgLen
        )
      }

      const imgData = this._c2d.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const maskData = this._c2d.getImageData(CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const foreData = this.c2d[layerId].createImageData(CANVAS_WIDTH, CANVAS_HEIGHT)
      const gradientMap = this.makeGradientMap(
        ...this.hsvd[layerId],
        this.absoluteTop / window.innerHeight * 270,
      )
      for (let i = 0, h = CANVAS_HEIGHT; i < h; i++) {
        for (let j = 0, w = CANVAS_WIDTH; j < w; j++) {
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