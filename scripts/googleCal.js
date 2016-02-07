var SCOPE = "https://www.googleapis.com/auth/calendar.readonly profile";
var REDIRECT_URI = location.origin;

function getAuth(cb) {
  var query = queryStringToObjectDecodeJSON(window.location.search);

  var state = query.state || {};
  state.refresh_tokens = state.refresh_tokens || [];

  if (query.hasOwnProperty('code')) {
    $.post('https://www.googleapis.com/oauth2/v4/token', {
      code: query.code,
      client_id: state.env.GOOGLE_CLIENT_ID,
      client_secret: state.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:8080',
      grant_type: 'authorization_code',
    })
    .done(function(data) {
      state.refresh_tokens.push(data.refresh_token);
      window.location.href = 'http://localhost:8080' + objectToQueryStringEncodeJSON({state: state});
    });
  } else if (query.hasOwnProperty('addUser')) {
    // Start a login
    var params = {
      scope: SCOPE,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      access_type: 'offline',
      immediate: 'true',
      client_id: state.env.GOOGLE_CLIENT_ID,
      state: state,
    };
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth' + objectToQueryStringEncodeJSON(params);
  } else if (state.refresh_tokens.length > 0) {
    async.map(state.refresh_tokens, function(refreshToken, callback) {
      $.post('https://www.googleapis.com/oauth2/v4/token', {
        refresh_token: refreshToken,
        client_id: state.env.GOOGLE_CLIENT_ID,
        client_secret: state.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      })
      .done(function(data) {
        // Now we have a access_token!
        callback(null, data.access_token);
      });
    }, function(err, tokens) {
      cb(tokens);
    });
  }
}

function getSelectedEventsForTokenWithUser(access_token, callback) {
  // Fetch user-info
  $.getJSON('https://www.googleapis.com/oauth2/v2/userinfo', {access_token: access_token}).done(function(user) {
    // Get selected calendars
    getSelectedCalendarsForToken(access_token, function(cals) {
      // Get the events
      getEventsFromCalendarsAndToken(access_token, cals, function(events) {
        // Attach the user to the events
        events = events.map(function(ev) {
          ev.users = [user];
          return ev;
        });
        callback(events);
      });
    });
  });
}

function getSelectedCalendarsForToken(access_token, callback) {
  $.getJSON('https://content.googleapis.com/calendar/v3/users/me/calendarList', {access_token: access_token})
  .done(function(resp) {
    var calendars = resp.items;
    callback(calendars.filter(function(cal) {
      return cal.selected;
    }));
  });
}

function getEventsFromCalendarsAndToken(access_token, calendars, callback) {
  var endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(0,0,0);
  async.reduce(calendars, [], function(events, cal, cb) {
    $.getJSON('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(cal.id) + '/events', {
      access_token: access_token,
      'timeMin': (new Date()).toISOString(),
      'timeMax': endDate.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    })
    .done(function(resp) {
      newEvents = resp.items.map(function(ev) {
        ev.date = new Date(ev.start.dateTime || ev.start.date);
        return ev;
      });
      cb(null, events.concat(newEvents));
    });
  }, function(err, events) {
    callback(events);
  });
}

function eventsByDay(days, ev) {
  var today = new Date().toISOString().slice(0, 10);
  var date = ev.date.toISOString().slice(0, 10);
  if (date < today) {
    date = today;
  }
  var lastDay = days[days.length - 1];
  if (lastDay && lastDay.date == date) {
    lastDay.events.push(ev);
  } else {
    var name = ['S&ouml;ndag', 'M&aring;ndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'L&ouml;rdag'][new Date(date).getDay()];
    if (date == today) {
      name = 'Idag';
    }
    days.push({
      date: date,
      name: name,
      events: [ev],
    });
  }
  return days;
}
