var can = require('socketcan')
var Bacon = require('baconjs')
var _ = require('lodash')

module.exports = function(canDevice, rxFilters) {
  var channel = can.createRawChannel(canDevice)
  if(rxFilters) {
    channel.setRxFilters(rxFilters)
  }
  var rxFrames = Bacon.fromBinder(sink => {
    channel.addListener('onMessage', sink)
    return () => {}
  })
  .map(frame => _.assign(frame, { pgn: extractPgn(frame) }))

  channel.start()


  function send(canId, data) {
    channel.send({ id: canId, length: data.length, data: data, ext: true })
  }

  return {
    send,
    rxFrames: rxFrames
  }
}


function extractPgn(frame) {
  return (frame.id >> 8) & 0x1ffff
}