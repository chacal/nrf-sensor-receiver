var Primus = require('primus')
var express = require('express')
var http = require('http')
var rawSensorStream = process.platform === 'linux' ? require('./nrf-receiver.js') : require('./sensor-simulator.js')
var logToConsole = process.env.LOG_TO_CONSOLE
var SIGNALK_SERVER = process.env.SIGNALK_SERVER_URL ? process.env.SIGNALK_SERVER_URL : 'http://10.90.100.1'  // Defaults to Freya
var autopilot = process.env.USE_AUTOPILOT_SIMULATOR ? require('./autopilot-simulator') : require('./autopilot-controller.js')
var util = require('./util.js')
var requestProxy = require('express-request-proxy')
var Bacon = require('baconjs')
var _ = require('lodash')
var influxDbSender = require('./influxdb-sender')
var fs = require('fs')

var app = express()
app.use(express.static(__dirname + '/../public'))
var server = http.createServer(app)
var primus = new Primus(server)

server.listen(8080, () => {
  console.log('Listening on http://localhost:8080')
  start(rawSensorStream)
})

app.use('/signalk/*', requestProxy({ url: `${SIGNALK_SERVER}/signalk/*` }))

app.use(require('body-parser').json())

app.post('/autopilot/state/:state', (req, res) => {
  if(req.params.state === 'on') {
    autopilot.turnOn()
    res.status(204).end()
  } else if(req.params.state === 'off') {
    autopilot.turnOff()
    res.status(204).end()
  } else {
    res.status(400).json({error: 'Expected state on/off'})
  }
})

app.post('/autopilot/adjust-course', (req, res) => {
  var adjustment = Number.parseFloat(req.body.adjustment)
  if(adjustment >= util.degToRads(-20) && adjustment <= util.degToRads(20)) {
    autopilot.adjustCourse(adjustment)
    res.status(204).end()
  } else {
    res.status(400).json({error: `Invalid course adjustment: ${adjustment} Expecting ±20 degrees in radians.`})
  }
})


function start(originalSensorStream) {
  var cumulativeCurrents = createCumulativeCurrents(originalSensorStream)
  cumulativeCurrents.sampledBy(Bacon.interval(10000)).onValue(saveCumulativeCurrentToFile)
  var augmentedSensorStream = originalSensorStream.merge(cumulativeCurrents)
  var liveViewSensorStream = createLiveViewSensorStream(augmentedSensorStream)
  var latestSensorValues = liveViewSensorStream.scan({}, (result, val) => { result[val.instance + val.tag] = val; return result }).map(_.values).toProperty()
  var newWsClients = Bacon.fromEvent(primus, 'connection')

  propertyOnNewConnection(latestSensorValues)
    .onValues((latestValues, spark) => latestValues.forEach(v => spark.write(v)))

  propertyOnNewConnection(autopilot.status)
    .onValues((status, spark) => spark.write(status))

  liveViewSensorStream.onValue(value => {
    if(logToConsole) {
      console.log(JSON.stringify(value))
    }
    primus.write(value)
  })
  autopilot.status.onValue(value => primus.write(value))

  influxDbSender.start(augmentedSensorStream)
  startAutopilotRemoteReceiver(originalSensorStream)

  function propertyOnNewConnection(property) {
    return property.sampledBy(newWsClients, (propertyValue, newClient) => [propertyValue, newClient])
  }
}

function startAutopilotRemoteReceiver(sensorStream) {
  var autopilotEvents = sensorStream.filter(event => event.tag === 'a')

  autopilotEvents.filter(e => e.buttonId === 1).onValue(autopilot.turnOn)
  autopilotEvents.filter(e => e.buttonId === 2).onValue(autopilot.turnOff)
  autopilotEvents.filter(e => e.buttonId === 3).onValue(() => autopilot.adjustCourse(util.degToRads(10)))
  autopilotEvents.filter(e => e.buttonId === 4).onValue(() => autopilot.adjustCourse(util.degToRads(1)))
  autopilotEvents.filter(e => e.buttonId === 5).onValue(() => autopilot.adjustCourse(util.degToRads(-1)))
  autopilotEvents.filter(e => e.buttonId === 6).onValue(() => autopilot.adjustCourse(util.degToRads(-10)))
}

function createLiveViewSensorStream(sensorStream) {
  var CURRENT_AVERAGING_SLIDING_WINDOW = 4

  var withoutCurrent = sensorStream.filter(event => event.tag !== 'c')
  var currents = util.averagedCurrents(sensorStream, stream => stream.slidingWindow(CURRENT_AVERAGING_SLIDING_WINDOW, 1))
  return withoutCurrent.merge(currents)
}

function createCumulativeCurrents(sensorStream) {
  return sensorStream.filter(data => data.tag === 'c')
    .groupBy(value => value.instance)
    .flatMap(streamByInstance => streamByInstance.first()
      .flatMapFirst(firstEvent => streamByInstance.scan(getInitialValue(firstEvent), (acc, event) => {
        var hoursSinceLastUpdate = (new Date() - acc.ts) / 1000 / 60 / 60
        var ampHoursDelta = event.current * hoursSinceLastUpdate

        return {
          tag: 'e',
          instance: event.instance,
          ts: new Date(),
          ampHours: acc.ampHours + ampHoursDelta
        }
      }))
    )
    .filter('.tag')  // Filter away initial values

  function getInitialValue(event) {
    try {
      var savedState = JSON.parse(fs.readFileSync(getCumulativeCurrentStateFileName(event.instance), 'utf8'))
      savedState.ts = new Date()  // Override saved date to avoid (mis)calculating current during the time the server was not running
      return savedState
    } catch(err) {
      return { ampHours: 0, ts: new Date() }
    }
  }
}

function saveCumulativeCurrentToFile(state) {
  fs.writeFile(getCumulativeCurrentStateFileName(state.instance), JSON.stringify(state))
}

function getCumulativeCurrentStateFileName(instance) { return `${__dirname}/../cumulativeCurrentsState_${instance}.json` }
