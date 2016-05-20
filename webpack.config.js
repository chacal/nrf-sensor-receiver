var CommonsChunkPlugin = new require("webpack/lib/optimize/CommonsChunkPlugin")

module.exports = {
  entry: {
    index: './client/index.js',
    sensors: './client/sensors.js',
    autopilot: './client/autopilot.js'
  },
  output: {
    path: __dirname + '/public',
    filename: "[name].bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {test: /\.css$/, loaders: ['style', 'css']},
      {test: /\.less$/, loaders: ['style', 'css', 'less']},
      {test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff'},
      {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/octet-stream'},
      {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file'},
      {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml'}
    ]
  },
  plugins: [
    new CommonsChunkPlugin("commons.chunk.js")
  ],
  externals: [ 'Primus' ]
}