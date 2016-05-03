var Bacon = require('baconjs')
var _ = require('lodash')

var simulatorStream = Bacon.interval(2000)
  .map(() => Math.random() > 0.25 ? randomTemperature() : randomPressure())


function randomTemperature() {
  return {
    tag:  't',
    instance: _.random(1, 5),
    temperature: _.random(0, 28, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000)
  }
}

function randomPressure() {
  return {
    tag:  'p',
    instance: _.random(1, 5),
    pressure: _.random(960, 1028, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000)
  }
}

module.exports = simulatorStream