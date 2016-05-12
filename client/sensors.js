var primus = require('Primus').connect()
var $ = require('jquery')
var Bacon = require('baconjs')
var moment = require('moment')

const temperatures = eventsWithTag('t')
const pressures = eventsWithTag('p')

bindRenderer(temperatures, $('#temperatures'), temperatureRowTemplate, renderTemperature)
bindRenderer(pressures, $('#pressures'), pressureRowTemplate, renderPressure)


function eventsWithTag(tag) { return Bacon.fromEvent(primus, 'data').filter(data => data.tag === tag) }

function bindRenderer(sensorStream, $displayTable, rowTemplateCreator, renderer) {
  sensorStream
    .groupBy(value => value.instance)
    .flatMap(streamByInstance => {
      var rowCreator = streamByInstance.first().doAction(value => $displayTable.append(rowTemplateCreator(value)))
      return rowCreator.concat(streamByInstance)
    })
    .onValue(renderer)
}

function renderTemperature(temperature) {
  var $row = $(`tr.temperature${temperature.instance}`)
  $row.find('td.temperature').html(temperature.temperature.toFixed(2) + '&deg;C')
  $row.find('td.vcc').html((temperature.vcc / 1000).toFixed(3) + 'V')
  $row.find('td.sampleTime').html(temperature.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment().format('HH:mm:ss'))
}

function renderPressure(pressure) {
  var $row = $(`tr.pressure${pressure.instance}`)
  $row.find('td.pressure').html(pressure.pressure.toFixed(2) + 'mbar')
  $row.find('td.vcc').html((pressure.vcc / 1000).toFixed(3) + 'V')
  $row.find('td.sampleTime').html(pressure.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment().format('HH:mm:ss'))
}

function temperatureRowTemplate(temperature) {
  return `<tr class="temperature${temperature.instance}">
            <td>Sensor ${temperature.instance}</td>
            <td class="temperature"></td>
            <td class="vcc"></td>
            <td class="sampleTime"></td>
            <td class="time"></td>
          </tr>
        `
}

function pressureRowTemplate(pressure) {
  return `<tr class="pressure${pressure.instance}">
            <td>Sensor ${pressure.instance}</td>
            <td class="pressure"></td>
            <td class="vcc"></td>
            <td class="sampleTime"></td>
            <td class="time"></td>
          </tr>
        `
}