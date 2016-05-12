var can = require('./can-tranceiver.js')('can0', { id: 0xff5000, mask: 0xffff00 })
var Bacon = require('baconjs')
var _ = require('lodash')

function turnOn() {
  var frames = ['80110163ff00f804', '81013b0703040440', '820005ffffffffff']
  frames.forEach(frame => can.send(233688064, new Buffer(frame, 'hex')))
}

function turnOff() {
  var frames = ['80110163ff00f804', '81013b0703040400', '820005ffffffffff']
  frames.forEach(frame => can.send(233688064, new Buffer(frame, 'hex')))
}

var state = Bacon.interval(300, false)
  .merge(can.rxFrames.map(true))
  .slidingWindow(2)
  .map(values => ! _.every(values, value => value === false))


module.exports = {
  turnOn,
  turnOff,
  state
}