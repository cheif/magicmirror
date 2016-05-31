const request = require('request')

module.exports.getNearbyStops = ({lat, lon}) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.sl.se/api2/nearbystops.json?maxResults=100&radius=2000&key=' + process.env.SL_STOPS_API_KEY + '&originCoordLat=' + lat + '&originCoordLong=' + lon
    request.get(url, (err, resp, body) => {
      if (err) {
        return reject(err)
      }
      const data = JSON.parse(body)
      resolve(data.LocationList.StopLocation.map(site => {
        site.siteid = parseInt(site.id.slice(4))
        site.name = site.name.slice(0, site.name.length - ' (Stockholm)'.length)
        if (site.name.includes('t-banan')) {
          site.type = 'subway'
          site.name = site.name.slice(0, site.name.length - ' (t-banan)'.length)
        } else {
          site.type = 'bus'
        }
        return site
      }))
    })
  })
}

module.exports.getDepartures = (stop) => {
  return new Promise((resolve, reject) => {
    const url = 'https://api.sl.se/api2/realtimedepartures.json?key=' + process.env.SL_REALTIME_API_KEY + '&siteId=' + stop.siteid
    request.get(url, (err, resp, body) => {
      if (err) {
        return reject(err)
      }
      const data = JSON.parse(body)
      const fixedDepartures = data.ResponseData.Buses.concat(data.ResponseData.Metros).map(dep => {
        if (dep.TransportMode === 'BUS') {
          dep.ExpectedDateTime = new Date(dep.ExpectedDateTime)
          dep.ExpectedDateTime.setHours(dep.ExpectedDateTime.getHours() - 2)
        } else if (dep.TransportMode === 'METRO') {
          // Metro don't have a expecteddatetime, calculate one on our own
          dep.ExpectedDateTime = new Date()
          const timeLeftMatch = dep.DisplayTime.match(/(\d+) min/)
          if (timeLeftMatch) {
            dep.ExpectedDateTime.setMinutes(dep.ExpectedDateTime.getMinutes() + parseInt(timeLeftMatch[1]))
          }
        }
        return dep
      })

      const departures = fixedDepartures.sort((dep1, dep2) => dep1.ExpectedDateTime - dep2.ExpectedDateTime)
      resolve(departures.slice(0, 5))
    })
  })
}
