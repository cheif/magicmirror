var DayProto = Object.create(HTMLElement.prototype);
DayProto.attachedCallback = function() {
  var shadow = this.createShadowRoot();
  shadow.innerHTML = '<style>' +
    '.title { font-size: 2rem; text-decoration: underline; margin: 0 auto 10px auto; text-align: center;}' +
      '.event {width: 100%;}' +
        '</style>';
        var title = document.createElement('div');
        title.className = 'title';
        title.innerHTML = this.day.name;
        var timesEln = document.createElement('div');
        timesEln.className = 'times';
        var users = this.users;
        var times = this.events.reduce(function(times, event) {
          var lastTime = times[times.length-1];
          if (lastTime && lastTime.time.getTime() == event.date.getTime()){
            lastTime.events.push(event);
          } else {
            times.push({
              time: event.date,
              hasTime: event.start.dateTime !== undefined,
              events: [event]
            });
          }
          return times;
        }, []);
        times.forEach(function(t) {
          var time = document.createElement('div');
          time.className = 'time';
          if (t.hasTime) {
            timeSpan = document.createElement('span');
            timeSpan.style = 'float: left; margin-left: -4rem;';
            timeSpan.innerHTML = zeroPad(t.time.getHours()) + ':' + zeroPad(t.time.getMinutes());
            time.appendChild(timeSpan);
          }
          timesEln.appendChild(time);
          t.events.forEach(function(ev) {
            var event = document.createElement('div');
            event.className = 'event';
            if (ev.users.length > 1) {
              // Both users participating
              event.style = 'text-align: center;';
            } else if (ev.users[0].id === users[0].id) {
              event.style = 'text-align: left;';
            } else {
              event.style = 'text-align: right;';
            }
            event.innerHTML += ev.summary;
            time.appendChild(event);
          });
        });
        shadow.appendChild(title);
        shadow.appendChild(timesEln);
        window.shadow = shadow;
};

var Day = document.registerElement('x-day', {
  prototype: DayProto
});
