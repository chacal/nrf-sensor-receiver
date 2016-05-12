var Bacon = require('baconjs')
var _ = require('lodash')
var util = require('./util.js')

var state = new Bacon.Bus()
var course = new Bacon.Bus()

var status = Bacon.combineWith(state.toProperty(false), course.toProperty(undefined), (autopilotEnabled, course) => ({
  autopilotEnabled,
  course: autopilotEnabled ? course : undefined
})).filter(s => !(s.autopilotEnabled && !s.course))

function adjustCourse(adjustmentRads) {
  status.first().filter('.autopilotEnabled').map('.course').onValue(currentCourse => course.push(currentCourse + adjustmentRads))
}


module.exports = {
  turnOn: () => { state.push(true); course.push(_.random(0, util.degToRads(360), true)) },
  turnOff: () => state.push(false),
  setCourse: course => course.push(course),
  adjustCourse,
  status
}