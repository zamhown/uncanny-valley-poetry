import React, { Component } from 'react'

import './styles/Illustration.css'

interface IIllustrationProps {
  imgList: string[]
}

export default class Illustration extends Component<IIllustrationProps> {
  canvasRef = React.createRef<HTMLCanvasElement>()
  c2d: any
  _canvas: any
  _c2d: any

  constructor(props: IIllustrationProps) {
    super(props)
  }

  get canvas(): HTMLCanvasElement {
    return this.canvasRef.current as HTMLCanvasElement
  }

  componentDidMount() {
    this.c2d = this.canvas.getContext("2d")
    this._canvas = document.createElement("canvas")
    this._c2d = this._canvas.getContext("2d")

    this.props.imgList.forEach((fn, i) => {
      if (i === 0) {
        this.drawBackground(fn)
      } else {
        this.drawForeground(fn)
      }
    })
  }

  render() {
    return <div className="illustration-container">
      <canvas ref={this.canvasRef} width="224" height="224"/>
    </div>
  }

  drawBackground(fn: string) {
    const img = new Image();
		img.onload = () => {
			this.c2d.drawImage(img, 0, 0, 224, 224, 0, 0, 224, 224)
    }
		img.src = 'static/media/' + fn
  }

  drawForeground(fn: string) {
    const img = new Image();
		img.onload = () => {
			this._c2d.drawImage(img, 0, 0, 448, 224, 0, 0, 448, 224)
      const imgData = this._c2d.getImageData(0, 0, 224, 224)
      const maskData = this._c2d.getImageData(224, 0, 224, 224)
      const foreData = this.c2d.createImageData(224, 224)
      for (let i = 0; i < imgData.length; i += 4) {
        foreData[i] = imgData[i]
        foreData[i + 1] = imgData[i + 1]
        foreData[i + 2] = imgData[i + 2]
        foreData[i + 3] = maskData[i]
      }
      this.c2d.putImageData(foreData, 0, 0)
    }
		img.src = 'static/media/' + fn
  }
}