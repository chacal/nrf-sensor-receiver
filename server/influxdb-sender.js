var influx = require('influx')
var _ = require('lodash')

var client = influx({
  host : process.env.INFLUXDB_HOST ? process.env.INFLUXDB_HOST : 'influxdb.chacal.online',
  protocol : 'https',
  username : process.env.INFLUXDB_USERNAME,
  password : process.env.INFLUXDB_PASSWORD,
  database : process.env.INFLUXDB_DB
})

function start(sensorStream) {
  sensorStream.onValue(event => {
    const series = {
      sensorVoltage: eventPoint(event, e => ({ value: e.vcc / 1000 })),
      measurementDuration: eventPoint(event, e => ({ value: e.previousSampleTimeMicros / 1000 / 1000 }))
    }

    switch (event.tag) {
      case 't':
        series.temperature = eventPoint(event, e => ({ value: e.temperature }))
        break;
      case 'p':
        series.pressure = eventPoint(event, e => ({ value: e.pressure }))
        break;
      case 'c':
        series.current = eventPoint(event, e => ({
          value: e.current,
          shuntVoltage: e.shuntVoltageMilliVolts / 1000,
          rawMeasurement: e.rawMeasurement
        }))
        break;
    }

    client.writeSeries(series, {}, (err, res) => {
      if(err) {
        console.log(err)
      }
    })
  })
}


function eventPoint(event, valuesExtractor) {
  return [[_.assign({ time: event.ts }, valuesExtractor(event)), { instance: event.instance }]]
}


module.exports = {
  start
}