var primus = require('Primus').connect()
var $ = require('jquery')
var Bacon = require('baconjs')
var moment = require('moment')

const temperatures = Bacon.fromEvent(primus, 'data').filter(data => data.tag === 't')

bindRenderer(temperatures, $('#temperatures'), temperatureRowTemplate, renderTemperature)


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
  $row.find('td.time').html(moment().format('HH:mm:ss'))
}

function temperatureRowTemplate(temperature) {
  return `<tr class="temperature${temperature.instance}">
            <td>Sensor ${temperature.instance}</td>
            <td class="temperature"></td>
            <td class="vcc"></td>
            <td class="time"></td>
          </tr>
        `
}