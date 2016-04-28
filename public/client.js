var primus = new Primus()

primus.on('data', function received(data) {
  $('#data').html(JSON.stringify(data))
})