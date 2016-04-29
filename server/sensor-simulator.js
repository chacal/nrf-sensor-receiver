var Bacon = require('baconjs')
var _ = require('lodash')

var simulatorStream = Bacon.interval(2000)
  .map(() => ({
    tag: 't',
    instance: _.random(1, 3),
    temperature: _.random(0, 28, true),
    vcc: _.random(3500, 4200)
  }))

module.exports = simulatorStream