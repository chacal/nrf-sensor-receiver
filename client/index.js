require('jquery')
require('expose?$!expose?jQuery!jquery')
require("bootstrap-webpack")
require('./less/index.less')

$.get('http://10.90.100.1:8080/signalk/v1/api/vessels/self/navigation/position')
  .then(res => $.get(`http://www.tuuleeko.fi:8000/nearest-station?lat=${res.latitude}&lon=${res.longitude}`))
  .then(station => {
    $.get(`http://www.tuuleeko.fi:8000/observations?geoid=${station.geoid}`)
      .then(stationObservations => {
        var obs = stationObservations.observations[stationObservations.observations.length - 1]
        var forecastHtml = `
        <h3>${stationObservations.name} (${(station.distanceMeters / 1000).toFixed(1)} km)</h3>
        <table class='table'>
          <tr><th>Wind direction</th><th>Wind speed</th><th>Wind gusts</th></tr>
          <tr><td>${obs.windDir}°</td><td>${obs.windSpeedMs} m/s</td><td>${obs.windGustMs} m/s</td></tr>
        </table>`
        $('body').append(forecastHtml)
      })
  })