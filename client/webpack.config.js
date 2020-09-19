const path = require('path');

module.exports = {
  entry: [],
  target:"web",
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: true|false|"compress"|"preserve"
  }
};