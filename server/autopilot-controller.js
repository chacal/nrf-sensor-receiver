var can = require('./can-tranceiver.js')('can0', { id: 0xff5000, mask: 0xffff00 })
var Bacon = require('baconjs')
var _ = require('lodash')
var util = require('./util.js')

function turnOn() {
  var frames = ['80110163ff00f804', '81013b0703040440', '820005ffffffffff']
  frames.forEach(frame => can.send(233688064, new Buffer(frame, 'hex')))
}

function turnOff() {
  var frames = ['80110163ff00f804', '81013b0703040400', '820005ffffffffff']
  frames.forEach(frame => can.send(233688064, new Buffer(frame, 'hex')))
}

function setCourse(courseRads) {
  var intRadians = Math.round(courseRads * 10000)

  var lowerByte = intRadians & 0xff  // mask away upper bits
  var secondFrame = new Buffer('21013b0703040600')
  secondFrame[7] = lowerByte

  var upperByte = intRadians >> 8  // shift away lower bits
  var thirdFrame = new Buffer('2200ffffffffffff')
  thirdFrame[1] = upperByte

  var frames = [new Buffer('200e0150ff00f803', 'hex'), secondFrame, thirdFrame]
  frames.forEach(frame => can.send(233688064, frame))
}

function adjustCourse(adjustmentRads) {
  status.first().filter('.autopilotEnabled').map('.course').onValue(currentCourse => {
    var newCourse = currentCourse + adjustmentRads
    setCourse(newCourse)
  })
}

var state = Bacon.interval(300, false)
  .merge(can.rxFrames.map(true))
  .slidingWindow(2)
  .map(values => ! _.every(values, value => value === false))
  .skipDuplicates()

var trackedCourse = can.rxFrames
  .map('.data')
  .map(parseTrackedCourse)
  .skipDuplicates()
  .toProperty(undefined)

var status = Bacon.combineWith(state, trackedCourse, (autopilotEnabled, course) => ({
  autopilotEnabled,
  course: autopilotEnabled ? course : undefined
}))


function parseTrackedCourse(pgn65360Buffer) {
  return pgn65360Buffer.readUInt16LE(5) / 10000
}


module.exports = {
  turnOn,
  turnOff,
  setCourse,
  adjustCourse,
  status
}