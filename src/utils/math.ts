/**
 * 根据概率分布随机抽取一项，返回索引
 * @param p 概率分布
 */
export function randomChoice(p: number[]): number {
  const r = Math.random()
  let ptr = 0
  for (let i = 0; i < p.length - 1; i++) {
    if (r >= ptr && r < ptr + p[i]) {
      return i
    } else {
      ptr += p[i]
    }
  }
  return p.length - 1
}

export function randomSample<T>(arr: T[], k: number): T[] {
  let tmp = [...arr]
  let result: T[] = []
  for (let i = 0; i < Math.min(k, arr.length); i++) {
    const ptr = Math.floor(Math.random() * tmp.length)
    result.push(tmp.splice(ptr, 1)[0])
  }
  return result
}

export function sigmoid(x: number): number {
  // 对sigmoid函数的优化，避免了出现极大的数据溢出
  if (x >= 0) {
    return 1 / (1 + Math.pow(Math.E, -x))
  } else {
    const ex = Math.pow(Math.E, x)
    return ex / (1 + ex)
  }
}

export function softmax(x: number[]): number[] {
  const sigX = x.map(x => sigmoid(-x))
  const sig = sigX.map(x => 1 / x - 1)
  const sum = sig.reduce((s, x) => s + x, 0)
  return sig.map(x => x / sum)
}