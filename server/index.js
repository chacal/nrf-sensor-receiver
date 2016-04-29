var Primus = require('primus')
var express = require('express')
var http = require('http')
var sensorStream = process.platform === 'linux' ? require('./nrf-receiver.js') : require('./sensor-simulator.js')

var app = express()
app.use(express.static(__dirname + '/../public'))
var server = http.createServer(app)
var primus = new Primus(server)

server.listen(8080, () => {
  console.log('Listening on http://localhost:8080')
  start()
})


function start() {
  sensorStream.onValue(value => {
    console.log(JSON.stringify(value))
    primus.write(value)
  })
}