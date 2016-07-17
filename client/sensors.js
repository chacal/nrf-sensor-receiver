var primus = require('Primus').connect()
var $ = require('jquery')
var Bacon = require('baconjs')
var moment = require('moment')

const temperatures = eventsWithTag('t')
const pressures = eventsWithTag('p')
const currents = eventsWithTag('c')
const ampHours = eventsWithTag('e')
const tanks = eventsWithTag('w')
const rfm69gws = eventsWithTag('s')

bindRenderer(temperatures, $('#temperatures'), temperatureRowTemplate, renderTemperature)
bindRenderer(pressures, $('#pressures'), pressureRowTemplate, renderPressure)
bindRenderer(currents, $('#currents'), currentRowTemplate, renderCurrent)
bindRenderer(tanks, $('#tanks'), tankRowTemplate, renderTankLevel)
bindRenderer(rfm69gws, $('#rfm69gateways'), rfm69GwRowTemplate, renderRfm69Gw)
ampHours.onValue(renderAmpHours)

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
  $row.find('td.time').html(moment(temperature.ts).format('HH:mm:ss'))
}

function renderPressure(pressure) {
  var $row = $(`tr.pressure${pressure.instance}`)
  $row.find('td.pressure').html(pressure.pressure.toFixed(2) + 'mbar')
  $row.find('td.vcc').html((pressure.vcc / 1000).toFixed(3) + 'V')
  $row.find('td.sampleTime').html(pressure.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment(pressure.ts).format('HH:mm:ss'))
}

function renderCurrent(current) {
  var $row = $(`tr.current${current.instance}`)
  $row.find('td.raw').html(current.rawMeasurement)
  $row.find('td.shunt').html(current.shuntVoltageMilliVolts.toFixed(6) + 'mV')
  $row.find('td.current').html(current.current.toFixed(3) + 'A')
  $row.find('td.vcc').html((current.vcc / 1000).toFixed(3) + 'V')
  $row.find('td.sampleTime').html(current.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment(current.ts).format('HH:mm:ss'))
}

function renderAmpHours(ampHoursEvent) {
  var $row = $(`tr.current${ampHoursEvent.instance}`)
  $row.find('td.ampHours').html(ampHoursEvent.ampHours.toFixed(3) + 'Ah')
}

function renderTankLevel(tankLevel) {
  var $row = $(`tr.tank${tankLevel.instance}`)
  $row.find('td.level').html(tankLevel.tankLevel + '%')
  $row.find('td.vcc').html((tankLevel.vcc / 1000).toFixed(3) + 'V')
  $row.find('td.sampleTime').html(tankLevel.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment(tankLevel.ts).format('HH:mm:ss'))
}

function renderRfm69Gw(rfm69Gw) {
  var $row = $(`tr.rfm69Gw${rfm69Gw.instance}`)
  $row.find('td.rssi').html(rfm69Gw.rssi + 'dB')
  $row.find('td.ackSent').html(rfm69Gw.ackSent ? 'Yes' : 'No')
  $row.find('td.sampleTime').html(rfm69Gw.previousSampleTimeMicros + 'µs')
  $row.find('td.time').html(moment(rfm69Gw.ts).format('HH:mm:ss'))
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

function currentRowTemplate(current) {
  return `<tr class="current${current.instance}">
            <td>Sensor ${current.instance}</td>
            <td class="raw"></td>
            <td class="shunt"></td>
            <td class="current"></td>
            <td class="vcc"></td>
            <td class="ampHours"></td>
            <td class="sampleTime"></td>
            <td class="time"></td>
          </tr>
        `
}

function tankRowTemplate(tankLevel) {
  return `<tr class="tank${tankLevel.instance}">
            <td>Sensor ${tankLevel.instance}</td>
            <td class="level"></td>
            <td class="vcc"></td>
            <td class="sampleTime"></td>
            <td class="time"></td>
          </tr>
        `
}

function rfm69GwRowTemplate(rfm69gw) {
  return `<tr class="rfm69Gw${rfm69gw.instance}">
            <td>RFM69 GW ${rfm69gw.instance}</td>
            <td class="rssi"></td>
            <td class="ackSent"></td>
            <td class="sampleTime"></td>
            <td class="time"></td>
          </tr>
        `
}
