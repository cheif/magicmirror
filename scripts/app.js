var skycons = new Skycons({"color": "white"});
var state = queryStringToObjectDecodeJSON(window.location.search).state || {};

// Start everything
function init() {
  if (!state.env) {
    var div = document.getElementById('input-env');
    div.className = '';
    // Ask the user for env, API-keys etc
    document.getElementById('save-env').addEventListener('click', function() {
      var keys = ['FORECAST_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
      var inputs = div.getElementsByTagName('input');
      var env = keys.reduce(function(env, key) {
        var eln = inputs[key];
        env[eln.name] = eln.value;
        return env;
      }, {});
      state.env = env;
      div.className = 'hidden';
      window.location.search = objectToQueryStringEncodeJSON({state: state});
    });
  }
  skycons.add('weather-icon', null);
  skycons.play();
  // Do initial setup
  updateClock();
  updateWeather();
  updateCalendar();
  // Set interval for different updates
  setInterval(updateClock, 60*1000);
  setInterval(updateWeather, 60*1000*10);
  setInterval(updateCalendar, 60*1000*10);
  document.getElementById('weather-icon').addEventListener('click', function() {
    document.body.webkitRequestFullscreen();
  });

}

// Update the calendar, fetch data for all logged-in users and update the UI
function updateCalendar() {
  getAuth(function(access_tokens) {
    async.reduce(access_tokens, [], function(events, access_token, callback) {
      getSelectedEventsForTokenWithUser(access_token, function(newEvents) {
        callback(null, events.concat(newEvents));
      });
    }, function(err, events) {
      events = events.sort(function(ev1, ev2) {return ev1.date - ev2.date;});
      // Make sure that events only show up once, if multiple users have the same event we just add them to the users-property;
      events = events.reduce(function(events, ev) {
        var present = events.find(function(oldEv) {return oldEv.id === ev.id;});
        if (present) {
          present.users.push(ev.users[0]);
        } else {
          events.push(ev);
        }
        return events;
      }, []);
      var users = Array.from(events.reduce(function(users, ev) {
        return ev.users.reduce(function(users, user) {
          return users.add(user);
        }, users);
      }, new Set()));
      users = users.sort(function(u1, u2) {return u1.given_name - u2.given_name;});
      updateCalendarUI({
        events: events,
        users: users
      });
    });
  });
}

// Update the UI for the calendar with a calendar-object
function updateCalendarUI(calendar) {
  var calendarEln = $(".calendar");
  calendarEln.empty();
  if (calendar.users.length > 1) {
    // Add users to top of calendar if we have more than one
    calendarEln.append('<span style="float: left;">' + calendar.users[0].given_name + '</span>');
    calendarEln.append('<span style="float: right;">' + calendar.users[1].given_name + '</span>');
  }
  var days = calendar.events.reduce(eventsByDay, []);
  days.forEach(function(day) {
    var eln = new Day();
    eln.day = day;
    eln.users = calendar.users;
    eln.events = day.events;
    calendarEln.append(eln);
  });
  return;
}

function updateClock() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  $('.clock').html(h + ":" + zeroPad(m));
}

// Fetch location and fetch weather for this location for the next hour
function updateWeather() {
  navigator.geolocation.getCurrentPosition(function(pos) {
    var latLongPart = [pos.coords.latitude, pos.coords.longitude].join(',');
    var url = 'https://api.forecast.io/forecast/' + state.env.FORECAST_API_KEY + '/' + latLongPart + '?units=si&callback=?';
    $.getJSON(url, function(data) {
      var now = data.hourly.data[0];
      var iconName = now.icon;
      $(".weather-text").html(now.summary);
      $(".temperature").html(Math.round(now.temperature*10)/10 + '&deg;C');
      var skyconsName = iconName.toUpperCase().replace(/-/g, '_');
      skycons.set('weather-icon', Skycons[skyconsName]);
    });
  });
}
