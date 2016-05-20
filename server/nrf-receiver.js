var nrf = require('nrf')
var reverse = require('reverse-string')
var Bacon = require('baconjs')
var _ = require('lodash')

var config = {
  spiDevice: process.env.NRF24_SPI_DEVICE ? process.env.NRF24_SPI_DEVICE : "/dev/spidev0.1",
  cePin: 25,                     // GPIO_25
  irqPin: 24,                    // GPIO_24
  channel: 76,                   // 76 is the default channel for RF24 Arduino library
  rxAddress: process.env.NRF24_RX_ADDRESS ? process.env.NRF24_RX_ADDRESS : "nrf01",
  dataRate: '250kbps',
  crcBytes: 2,
  txPower: 'PA_MAX'
}

console.log("Starting with configuration:\n", config)


var radio = nrf.connect(config.spiDevice, config.cePin, config.irqPin)
radio
  .dataRate(config.dataRate)
  .channel(config.channel)
  .crcBytes(config.crcBytes)
  .transmitPower(config.txPower)

var sensorStream = Bacon.fromCallback(radio.begin)
  .flatMapLatest(() => Bacon.fromCallback(radio.setStates, {EN_ACK_PAY:false, EN_DYN_ACK:false}))   // Disable ACK payloads & dynamic ack to get auto ACK function with PA+LNA module
  .flatMapLatest(() => {
    var rx = radio.openPipe('rx', new Buffer(reverse(config.rxAddress))) // RF24 on Arduino doesn't send data in LSB order -> reverse to match
    return Bacon.fromEvent(rx, 'data').map(dataReceived)
      .merge(Bacon.fromEvent(rx, 'error', Bacon.Error))
  })

function dataReceived(buffer) {
  Array.prototype.reverse.call(buffer)        // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  var data = _.assign(parseTagAndInstance(buffer), { ts: new Date() })

  switch(data.tag) {
    case 't':
      fillTemperatureData(buffer, data)
      break;
    case 'p':
      fillPressureData(buffer, data)
      break;
    default:
      console.error("Received unknown data!", buffer)
      return
  }

  return data
}


function parseTagAndInstance(buffer) {
  return { tag: buffer.toString('utf8', 0, 1), instance: buffer.readUInt8(1) }
}

function fillTemperatureData(buffer, data) {
  data.temperature = buffer.readFloatLE(2)
  data.vcc = buffer.readInt16LE(6)
  data.previousSampleTimeMicros = buffer.readUInt32LE(8)
}

function fillPressureData(buffer, data) {
  data.pressure = buffer.readFloatLE(2)
  data.vcc = buffer.readInt16LE(6)
  data.previousSampleTimeMicros = buffer.readUInt32LE(8)
}

module.exports = sensorStream