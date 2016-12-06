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
  txAddress: process.env.NRF24_TX_ADDRESS ? process.env.NRF24_TX_ADDRESS : "nrf02",
  dataRate: '250kbps',
  crcBytes: 2,
  txPower: 'PA_MAX'
}

console.log("Starting with configuration:\n", config)


var radio = nrf.connect(config.spiDevice, config.cePin, config.irqPin)
var radioStarted = Bacon.fromCallback(radio.reset)
  .flatMapLatest(() => Bacon.fromCallback(radio.dataRate, config.dataRate))
  .flatMapLatest(() => Bacon.fromCallback(radio.channel, config.channel))
  .flatMapLatest(() => Bacon.fromCallback(radio.crcBytes, config.crcBytes))
  .flatMapLatest(() => Bacon.fromCallback(radio.transmitPower, config.txPower))
  .flatMapLatest(() => Bacon.fromCallback(radio.autoRetransmit, {count:10, delay:2000}))
  .flatMapLatest(() => Bacon.fromCallback(radio.begin))
  .flatMapLatest(() => Bacon.fromCallback(radio.setStates, {EN_ACK_PAY:false, EN_DYN_ACK:false}))  // Disable ACK payloads & dynamic ack to get auto ACK function with PA+LNA module

function sensorStream() {
  var rx = radio.openPipe('rx', new Buffer(reverse(config.rxAddress))) // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  return Bacon.fromEvent(rx, 'data').map(dataReceived).filter(_.identity)
    .merge(Bacon.fromEvent(rx, 'error', Bacon.Error))
}

function radioSender() {
  var tx = radio.openPipe('tx', new Buffer(reverse(config.txAddress)))  // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  tx.on('error', e => console.log('Error while sending data', e))
  return tx
}

function dataReceived(buffer) {
  Array.prototype.reverse.call(buffer)        // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  var data = _.assign(parseTagAndInstance(buffer), { ts: new Date() })

  try {
    switch(data.tag) {
      case 't':
        fillTemperatureData(buffer, data)
        break;
      case 'p':
        fillPressureData(buffer, data)
        break;
      case 'h':
        fillHumidityData(buffer, data)
        break;
      case 'c':
        fillCurrentData(buffer, data)
        break;
      case 'a':
        fillAutopilotRemoteData(buffer, data)
        break;
      case 'w':
        fillTankData(buffer, data)
        break;
      case 's':
        fillRFMGatewayData(buffer, data)
        break;
      default:
        console.error("Received unknown data!", buffer)
        return
    }
  } catch(err) {
    console.error("Error while decoding received data! Data: ", buffer, "\nError:", err)
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

function fillHumidityData(buffer, data) {
  data.humidity = buffer.readFloatLE(2)
  data.vcc = buffer.readInt16LE(6)
  data.previousSampleTimeMicros = buffer.readUInt32LE(8)
}

function fillCurrentData(buffer, data) {
  data.rawMeasurement = buffer.readInt16LE(2)
  data.shuntVoltageMilliVolts = buffer.readFloatLE(4)
  data.current = buffer.readFloatLE(8)
  data.vcc = buffer.readInt16LE(12)
  data.previousSampleTimeMicros = buffer.readUInt32LE(14)
}

function fillAutopilotRemoteData(buffer, data) {
  data.buttonId = buffer.readUInt8(2)
  data.isLongPress = buffer.readUInt8(3) !== 0
  data.vcc = buffer.readInt16LE(4)
  data.previousSampleTimeMicros = buffer.readUInt32LE(6)
}

function fillTankData(buffer, data) {
  data.tankLevel = buffer.readUInt8(2)
  data.vcc = buffer.readInt16LE(3)
  data.previousSampleTimeMicros = buffer.readUInt32LE(5)
}

function fillRFMGatewayData(buffer, data) {
  data.rssi = buffer.readInt16LE(2)
  data.ackSent = buffer.readUInt8(4) !== 0
  data.previousSampleTimeMicros = buffer.readUInt32LE(5)
}

module.exports = radioStarted.map(() => ({
  sensorStream: sensorStream(),
  radioSender: radioSender()
}))