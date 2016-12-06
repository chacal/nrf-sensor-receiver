var Bacon = require('baconjs')
var _ = require('lodash')

var simulatorStream = Bacon.interval(2000)
  .map(() => _.sample([randomTemperature, randomPressure, randomCurrent, randomTankLevel, randomRFM69Gw, randomHumidity])())


function randomTemperature() {
  return {
    tag:  't',
    instance: _.random(1, 5),
    temperature: _.random(0, 28, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

function randomPressure() {
  return {
    tag:  'p',
    instance: _.random(1, 5),
    pressure: _.random(960, 1028, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

function randomHumidity() {
  return {
    tag:  'h',
    instance: _.random(1, 8),
    humidity: _.random(0, 100, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

function randomCurrent() {
  return {
    tag:  'c',
    instance: _.random(1, 5),
    rawMeasurement: _.random(-1000, 1000),
    shuntVoltageMilliVolts: _.random(-50, 50, true),
    current: _.random(-20, 40, true),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

function randomTankLevel() {
  return {
    tag:  'w',
    instance: _.random(1, 5),
    tankLevel: _.random(0, 100),
    vcc: _.random(3500, 4200),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

function randomRFM69Gw() {
  return {
    tag:  's',
    instance: _.random(1, 5),
    rssi: _.random(-90, -30),
    ackSent: _.random(0, 1),
    previousSampleTimeMicros: _.random(2000, 25000),
    ts: new Date()
  }
}

module.exports = Bacon.once({
  sensorStream: simulatorStream,
  radioSender: undefined
})