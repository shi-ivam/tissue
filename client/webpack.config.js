const path = require('path');

module.exports = {
  entry: ['./src/one.js','./src/two.js'],
  target:"web",
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: true|false|"compress"|"preserve"
  }
};