module.exports = {
  entry: {
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
      }
    ]
  },
  externals: [ 'Primus' ]
}