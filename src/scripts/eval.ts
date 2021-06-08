import Poet from '../utils/poet.js'
import { params } from '../params/index.js'

function poet(count: number) {
  const p = new Poet(params)
  let senIndex: number | undefined
  for (let i = 0; i < count; i++) {
    const sen = p.getSentence(senIndex)
    senIndex = sen.index
    if (sen.str)
      console.log(sen.str)
    else
      console.log('?')
  }
}

poet(50)