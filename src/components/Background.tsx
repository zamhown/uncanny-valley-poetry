import React, { Component } from 'react'

import './style/Background.css'

export default class Background extends Component {
  canvasRef = React.createRef<HTMLCanvasElement>()
  c2d: any
  _canvas: any
  _c2d: any
  w: number
  h: number
  pts: any[]

  bgR: number
  bgG: number
  bgB: number
  ticks: number

  constructor(props: {}) {
    super(props)
    this.w = 0
    this.h = 0
    this.pts = []

    this.bgR = 0
    this.bgG = 0
    this.bgB = 0
    this.ticks = 1
  }

  get canvas(): HTMLCanvasElement {
    return this.canvasRef.current as HTMLCanvasElement
  }

  handleResize() {
    this.w = this.canvas.width = this._canvas.width = window.innerWidth
    this.h = this.canvas.height = this._canvas.height = window.innerHeight
  }

  componentDidMount(){
    this.c2d = this.canvas.getContext("2d")
    this._canvas = document.createElement("canvas")
    this._c2d = this._canvas.getContext("2d")
    // 监听窗口大小改变
    window.addEventListener('resize', this.handleResize.bind(this));
    this.initAnim()
  }

  componentWillUnmount() {
    // 移除监听器，防止多个组件之间导致this的指向紊乱
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  render() {
    const canvas = <canvas
      ref={this.canvasRef}
    />
    return canvas;
  }

  initAnim() {
    this.handleResize()

    this.pts = []
    for (let i = 0; i < 20000 / this.w; i++) {
      this.pts.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() * 3) - 1.5,
        vy: (Math.random() * 1) - 2,
        rad: Math.floor(Math.random() * this.w / 4) + this.w / 5
      })
    }

    this.anim()
  }

  anim() {
    this.ticks++
    if (this.ticks % 20 === 0) {
      if (this.bgR >= 0) {
        this.bgR += (Math.random() * 4 - 1.5)
        if (this.bgR > 32) this.bgR = -this.bgR
      } else {
        this.bgR += 3
      }
      if (this.bgG >= 0) {
        this.bgG += (Math.random() * 3 - 1)
        if (this.bgG > 22) this.bgG = -this.bgG
      } else {
        this.bgG += 2
      }
      if (this.bgB >= 0) {
        this.bgB += (Math.random() * 3 - 1)
        if (this.bgB > 22) this.bgB = -this.bgB
      } else {
        this.bgB += 2
      }
      if (this.canvas)
        this.canvas.style.backgroundColor = `rgb(${Math.abs(this.bgR)}, ${Math.abs(this.bgG)}, ${Math.abs(this.bgB)})`
      this.ticks = 0
    }

    this._c2d.clearRect(0, 0, this.w, this.h)
    this._c2d.fillStyle = '#001b12'
    this._c2d.fillRect(0, 0, this.w, this.h)
    let len = this.pts.length
    while (len--) {
      var p = this.pts[len]
      p.x += p.vx
      p.y += p.vy

      if (p.x > this.w + p.rad) {
          p.x = 0 - p.rad
      }
      if (p.x < 0 - p.rad) {
          p.x = this.w + p.rad
      }
      if (p.y > this.h + p.rad) {
          p.y = 0 - p.rad
      }
      if (p.y < 0 - p.rad) {
          p.y = this.h + p.rad
      }

      this._c2d.beginPath()
      this._c2d.globalCompositeOperation = 'lighter'
      const g = this._c2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad)
      g.addColorStop(0, 'hsla(0,0%,0%,0.8)')
      g.addColorStop(0.5, 'hsla(0,0%,45%,0.2)')
      g.addColorStop(1, 'hsla(0,0%,20%,0)')
      this._c2d.fillStyle = g
      this._c2d.arc(p.x, p.y, p.rad, 0, Math.PI * 2)
      this._c2d.fill()
    }
    this.go()

    const requestAnimFrame = window.requestAnimationFrame ??
      window.webkitRequestAnimationFrame ??
      (callback => window.setTimeout(callback, 1000 / 60))
    requestAnimFrame(this.anim.bind(this))
  }

  go() {
    const id = this._c2d.getImageData(0, 0, this.w, this.h)
    const img = id.data
    for (var i = 0; i < img.length; i += 4) {
      if (img[i] > 50) {
        if (img[i] < 100) {
          img[i] *= 0.7
          img[i + 1] *= 0.7
          img[i + 2] *= 0.7
          img[i + 3] *= 0.7
        } else {
          img[i] = 80
          img[i + 1] = 150
          img[i + 2] = 150
          img[i + 3] = 128
        }
      }
    }
    this.c2d.putImageData(id, 0, 0)
  }
}