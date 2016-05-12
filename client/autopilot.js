var primus = require('Primus').connect()
var $ = require('jquery')
var Bacon = require('baconjs')
var _ = require('lodash')
var util = require('../server/util.js')



var autopilotEvents = Bacon.fromEvent(primus, 'data').filter(data => _.has(data, 'autopilotEnabled'))

autopilotEvents.onValue(status => {
  $('#standby').prop('disabled', !status.autopilotEnabled)
  $('#auto').prop('disabled', status.autopilotEnabled)
  $('#course').empty().html(util.radsToDeg(status.course))
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
    dataType: "json",
  })
}