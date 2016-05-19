var primus = require('Primus').connect()
var $ = require('jquery')
require('expose?$!expose?jQuery!jquery')
var Bacon = require('baconjs')
var _ = require('lodash')
var util = require('../server/util.js')
require("bootstrap-webpack")
require('./less/autopilot.less')

$('body').show(0)

var autopilotEvents = Bacon.fromEvent(primus, 'data').filter(data => _.has(data, 'autopilotEnabled'))
var magneticVariation = Bacon.fromPromise($.get('/signalk/v1/api/vessels/self/navigation/magneticVariation')).map('.value').toProperty(undefined)

Bacon.combineAsArray(autopilotEvents, magneticVariation).onValues((status, magneticVariation) => {
  $('#standby').prop('disabled', !status.autopilotEnabled)
  $('#adjustments button').prop('disabled', !status.autopilotEnabled)
  $('#auto').prop('disabled', status.autopilotEnabled)
  $('#course').empty().html(calculateCourse())

  function calculateCourse() {
    return status.course && magneticVariation ? Math.round(util.radsToDeg(status.course + magneticVariation)) : ''
  }
})


$('#standby').click(() => $.post('/autopilot/state/off'))
$('#auto').click(() => $.post('/autopilot/state/on'))
$('#adjustments button').click(e => {
  var adjustment = parseFloat(util.degToRads($(e.target).data('adjustment')))
  post('/autopilot/adjust-course', { adjustment })
})


function post(url, dataObj) {
  return $.ajax({
    type: "POST",
    url: url,
    data: JSON.stringify(dataObj),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  })
}