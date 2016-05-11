var can = require('socketcan')
var Bacon = require('baconjs')

module.exports = function(canDevice, rxFilters) {
  var channel = can.createRawChannel(canDevice)
  if(rxFilters) {
    channel.setRxFilters(rxFilters)
  }
  var rxFrames = Bacon.fromBinder(sink => {
    channel.addListener('onMessage', sink)
    return () => {}
  })
  channel.start()


  function send(canId, data) {
    channel.send({ id: canId, length: data.length, data: data, ext: true })
  }

  return {
    send,
    rxFrames: rxFrames
  }
}
