import Poet from '../utils/poet.js'

function poet(count: number) {
  const p = new Poet()
  for (let i = 0; i < count; i++) {
    console.log(p.getSentence())
  }
}

poet(50)