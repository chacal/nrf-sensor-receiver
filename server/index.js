var Primus = require('primus')
var express = require('express')
var http = require('http')
var sensorStream = process.platform === 'linux' ? require('./nrf-receiver.js') : require('./sensor-simulator.js')
var logToConsole = process.env.LOG_TO_CONSOLE
var autopilot = require('./autopilot-controller.js')

var app = express()
app.use(express.static(__dirname + '/../public'))
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

function start() {
  sensorStream.onValue(value => {
    if(logToConsole) {
      console.log(JSON.stringify(value))
    }
    primus.write(value)
  })
}