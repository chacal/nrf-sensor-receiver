var influx = require('influx')
var _ = require('lodash')
var util = require('./util.js')

var client = influx({
  host : process.env.INFLUXDB_HOST ? process.env.INFLUXDB_HOST : 'influxdb.chacal.online',
  protocol : 'https',
  username : process.env.INFLUXDB_USERNAME,
  password : process.env.INFLUXDB_PASSWORD,
  database : process.env.INFLUXDB_DB
})

function start(rawSensorStream) {
  var loggedSensorStream = createLoggedSensorStream(rawSensorStream)
  loggedSensorStream.onValue(event => {
    switch (event.tag) {
      case 't':
        var series = sensorEventSeries(event)
        series.temperature = eventPoint(event, e => ({ value: e.temperature }))
        break;
      case 'p':
        var series = sensorEventSeries(event)
        series.pressure = eventPoint(event, e => ({ value: e.pressure }))
        break;
      case 'c':
        var series = sensorEventSeries(event)
        series.current = eventPoint(event, e => ({
          value: e.current
        }))
        break;
      case 'e':
        var series = {}
        series.ampHours = eventPoint(event, e => ({
          value: e.ampHours
        }))
        break;
    }

    client.writeSeries(series, {}, (err, res) => {
      if(err) {
        console.log(err)
      }
    })

    function sensorEventSeries(event) {
      return {
        sensorVoltage: eventPoint(event, e => ({ value: e.vcc / 1000 })),
        measurementDuration: eventPoint(event, e => ({ value: e.previousSampleTimeMicros / 1000 / 1000 }))
      }
    }
  })
}


function eventPoint(event, valuesExtractor) {
  return [[_.assign({ time: event.ts }, valuesExtractor(event)), { instance: event.instance }]]
}

function createLoggedSensorStream(sensorStream) {
  var CURRENT_AVERAGING_TIME = 5000

  var withoutCurrentOrAmpHours = sensorStream.filter(event => event.tag !== 'c' && event.tag !== 'e')
  var currents = util.averagedCurrents(sensorStream, stream => stream.bufferWithTime(CURRENT_AVERAGING_TIME))
  var throttledAmpHours = sensorStream
    .filter(event => event.tag === 'e')
    .groupBy(value => value.instance)
    .flatMap(streamByInstance => streamByInstance.throttle(CURRENT_AVERAGING_TIME))

  return withoutCurrentOrAmpHours.merge(currents).merge(throttledAmpHours)
}

module.exports = {
  start
}