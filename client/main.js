var primus = require('Primus').connect()
var $ = require('jquery')

primus.on('data', data => $('#data').html(JSON.stringify(data)))