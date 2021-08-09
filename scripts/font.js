// 压缩字体
const Fontmin = require('fontmin');
const words = require('./words');

const staticWords = '0123456789已阅读行'

module.exports = () => {
  console.log('Compressing the font file...')
  const totalWords = [...new Set([
    ...words.split(''),
    ...staticWords.split('')
  ])].join('')
  const fontmin = new Fontmin()
    .src('assets/syst.ttf')
    .use(Fontmin.glyph({ 
        text: totalWords,
        hinting: false
    }))
    .use(Fontmin.ttf2woff({
      deflate: true
    }))
    .dest('src/assets');
  fontmin.run((err, files) => {
    if (err) {
      throw err;
    }
    console.log('The font file is compressed.')
  });
}