var SCOPE = "https://www.googleapis.com/auth/calendar.readonly profile";

const querystring = require('querystring')
const utils = require('./utils')
const request = require('request')

const serialize = (data) => {
    return Object.keys(data).map(function (keyName) {
        return encodeURIComponent(keyName) + '=' + encodeURIComponent(data[keyName])
    }).join('&');
};

module.exports.getAuthUrl = (req) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/codeCallback`;
  const params = {
    scope: SCOPE,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    client_id: process.env.GOOGLE_CLIENT_ID,
    state: req.query.state,
  }
  return 'https://accounts.google.com/o/oauth2/v2/auth' + utils.objectToQueryStringEncodeJSON(params)
}

module.exports.getRefreshToken = (code, redirectUri) => {
  return new Promise((resolve, reject) => {
    request.post('https://www.googleapis.com/oauth2/v4/token', {
      form: {
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }
    }, (err, resp, body) => {
      if (err) {
        return reject(err)
      }
      const data = JSON.parse(body)
      resolve(data.refresh_token)
    })
  })
}

module.exports.getAccessToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    request.post('https://www.googleapis.com/oauth2/v4/token', {
      form: {
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }
    }, (err, resp, body) => {
      if (err) {
        return reject(err)
      }
      const data = JSON.parse(body)
      resolve(data)
    })
  })
}


module.exports.getAuth = (cb) => {
  return new Promise((resolve, reject) => {
    var query = utils.queryStringToObjectDecodeJSON(window.location.search);

    var state = query.state || {};
    state.refresh_tokens = state.refresh_tokens || [];

    if (state.refresh_tokens.length > 0) {
      Promise.all(state.refresh_tokens.map(refreshToken =>
        fetch('/getToken?refreshToken=' + refreshToken).then(r => r.json()))
       ).then(responses => resolve(responses.map(resp => resp.access_token)))
    } else {
      window.location.href = '/addUser';
    }
  })
}

module.exports.getSelectedEventsForTokenWithUser = (access_token) => {
  return getSelectedCalendarsForToken(access_token)
    .then(cals => getEventsFromCalendarsAndToken(access_token, cals))
    .then(events =>
      // Fetch user-info
      fetch('https://www.googleapis.com/oauth2/v2/userinfo?access_token='+ access_token)
        .then(resp => resp.json()).then(user => Promise.resolve(events.map(ev => {
          ev.users = [user]
          return ev
        }))))
}

function getSelectedCalendarsForToken(access_token, callback) {
  return fetch('https://content.googleapis.com/calendar/v3/users/me/calendarList?access_token=' + access_token)
    .then(resp => resp.json())
    .then(data => Promise.resolve(data.items.filter(cal => cal.selected)))
}

function getEventsFromCalendarsAndToken(access_token, calendars, callback) {
  var endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(0,0,0);
  return Promise.all(calendars.map(cal => {
    return fetch('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(cal.id) + '/events?' +
                 querystring.stringify({
                   access_token: access_token,
                   'timeMin': (new Date()).toISOString(),
                   'timeMax': endDate.toISOString(),
                   'showDeleted': false,
                   'singleEvents': true,
                   'maxResults': 10,
                   'orderBy': 'startTime'
                 }))
                 .then(resp => resp.json())
                 .then(data => Promise.resolve(data.items.map(ev => {
                   ev.date = new Date(ev.start.dateTime || ev.start.date)
                   return ev
                 })))
  })).then(eventsList => Promise.resolve(eventsList.reduce((events, l) => events.concat(l), [])))
}

module.exports.eventsByDay = (days, ev) => {
  const today = new Date().toISOString().slice(0, 10)
  let date = ev.date.toISOString().slice(0, 10)
  if (date < today) {
    date = today
  }
  const lastDay = days[days.length - 1]
  const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  if (lastDay && lastDay.date == date) {
    lastDay.events.push(ev)
  } else {
    let name = dayNames[new Date(date).getDay()]
    if (date == today) {
      name = 'Idag'
    }
    days.push({
      date: date,
      name: name,
      events: [ev],
    });
  }
  return days;
}
