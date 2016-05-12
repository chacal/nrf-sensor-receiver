var Primus = require('primus')
var express = require('express')
var http = require('http')
var sensorStream = process.platform === 'linux' ? require('./nrf-receiver.js') : require('./sensor-simulator.js')
var logToConsole = process.env.LOG_TO_CONSOLE
var autopilot = process.platform === 'linux' ? require('./autopilot-controller.js') : require('./autopilot-simulator')
var util = require('./util.js')

var app = express()
app.use(express.static(__dirname + '/../public'))
app.use(require('body-parser').json())
var server = http.createServer(app)
var primus = new Primus(server)

server.listen(8080, () => {
  console.log('Listening on http://localhost:8080')
  start()
})

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


function start() {
  primus.on('connection', spark => {
    autopilot.status.first().onValue(status => spark.write(status))
  })
  autopilot.status.onValue(status => primus.write(status))

  sensorStream.onValue(value => {
    if(logToConsole) {
      console.log(JSON.stringify(value))
    }
    primus.write(value)
  })
  autopilot.status.log()
}