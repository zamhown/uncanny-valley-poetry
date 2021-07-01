// 压缩字体
const Fontmin = require('fontmin');
const words = require('./words');

module.exports = () => {
  console.log('Compressing the font file...')
  const fontmin = new Fontmin()
    .src('assets/syst.ttf')
    .use(Fontmin.glyph({ 
        text: words,
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