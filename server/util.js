var _ = require('lodash')

module.exports = {
  radsToDeg: radians => radians * 180 / Math.PI,
  degToRads: deg => deg * Math.PI / 180,
  averagedCurrents
}


function averagedCurrents(rawSensorStream, streamBufferer) {
  var averagedCurrents = rawSensorStream.filter(data => data.tag === 'c')
    .groupBy(value => value.instance)
    .flatMap(streamByInstance => streamBufferer(streamByInstance).map(averageCurrentEvents))

  return averagedCurrents

  function averageCurrentEvents(events) {
    return _.assign(events[0], {
      current: _.meanBy(events, 'current'),
      vcc: _.meanBy(events, 'vcc'),
      rawMeasurement: _.meanBy(events, 'rawMeasurement'),
      shuntVoltageMilliVolts: _.meanBy(events, 'shuntVoltageMilliVolts'),
      previousSampleTimeMicros: _.meanBy(events, 'previousSampleTimeMicros'),
      ts: new Date()
    })
  }
}