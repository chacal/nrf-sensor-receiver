var nrf = require('nrf')
var reverse = require('reverse-string')

var config = {
  spiDevice: "/dev/spidev0.1",
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

radio.begin(() => {
  var rx = radio.openPipe('rx', new Buffer(reverse(config.rxAddress))) // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  rx.on('data', dataReceived)
  rx.on('error', err => console.log("Error: ", err))
})


function dataReceived(buffer) {
  Array.prototype.reverse.call(buffer)        // RF24 on Arduino doesn't send data in LSB order -> reverse to match
  var data = parseTagAndInstance(buffer)

  switch(data.tag) {
    case 't':
      fillTemperatureData(buffer, data)
      break;
    default:
      console.error("Received unknown data!", buffer)
      return
  }

  console.log(JSON.stringify(data))
}


function parseTagAndInstance(buffer, data) {
  return { tag: buffer.toString('utf8', 0, 1), instance: buffer.readUInt8(1) }
}

function fillTemperatureData(buffer, data) {
  data.temperature = buffer.readFloatLE(2)
  data.vcc = buffer.readInt16LE(6)
}