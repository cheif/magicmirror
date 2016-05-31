const path = require('path')
const request = require('request')
const express = require('express')
const app = express()
const google = require('./lib/google.js')
const sl = require('./lib/sl.js')
const utils = require('./lib/utils.js')

app.use(express.static('static'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/codeCallback', (req, res) => {
  const redirectUri = req.protocol + '://' + req.get('host') + req.path;
  google.getRefreshToken(req.query.code, redirectUri)
    .then(refresh_token => {
      let state = utils.queryStringToObjectDecodeJSON(req.query.state)
      state.refresh_tokens = state.refresh_tokens || [];
      state.refresh_tokens.push(refresh_token)
      res.redirect('/' + utils.objectToQueryStringEncodeJSON({state: state}))
    }).catch(err => res.status(400).send(err))
})

app.get('/addUser', (req, res) => {
  res.redirect(302, google.getAuthUrl(req))
})

app.get('/getToken', (req, res) => {
  google.getAccessToken(req.query.refreshToken).then(resp => res.status(200).send(resp)).catch(err => res.status(400).send(err))
})

app.get('/getWeather', (req, res) => {
  const url = 'https://api.forecast.io/forecast/' + process.env.FORECAST_API_KEY + '/' + req.query.latLong + '?units=si';
  request.get(url, (err, resp, body) => {
    if (err) {
      return res.status(400).send(err)
    }
    res.status(200).send(body)
  })
})

app.get('/getRealTime', (req, res) => {
  sl.getNearbyStops(req.query).then(stops => {
    // Just use nearest stop for now
    const closest = stops[0]
    const closestSubway = stops.filter(s => s.type === 'subway')[0]
    const usedStops = [closest, closestSubway]
    return Promise.all(usedStops.map(stop =>
      sl.getDepartures(stop).then(departures => {
        stop.departures = departures
        return Promise.resolve(stop)
      })))
  }).then(stops => {
    res.status(200).send(stops)
  }).catch(err => res.status(400).send(err))

})

app.listen(8080)
