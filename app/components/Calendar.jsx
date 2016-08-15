const React = require('react')
const google = require('../lib/google.js')
const utils = require('../lib/utils.js')

class Time extends React.Component {
  get timeStyle() {
    return {
      float: 'left',
      marginLeft: '-4rem',
    }
  }
  getAlign(ev) {
    if (ev.users.length > 1) {
      // Both users participating
      return 'center'
    } else if (ev.users[0].id === this.props.users[0].id) {
      return 'left'
    } else {
      return 'right'
    }
  }
  render() {
    const t = this.props.data;
    return (
      <div className='time'>
        {t.hasTime ? (<span style={this.timeStyle}>{utils.zeroPad(t.time.getHours())}:{utils.zeroPad(t.time.getMinutes())}</span>):(<span />)}
        {t.events.map((ev, i) => {
          return (
            <div className='event' key={i}>
            {ev.summary}
            </div>
          )
        })}
      </div>
    )
  }

}

class Day extends React.Component {
  render() {
    const {name, users} = this.props
    return (
      <div className='day'>
        <div className='title'>{name}</div>
        <div className='times'>
          {this.times.map((time, i) => <Time data={time} users={users} key={i}/>)}
        </div>
      </div>
    )
  }
  get times() {
    return this.props.events.reduce((times, event) => {
      const lastTime = times[times.length-1];
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
  }
}

class Calendar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      'users': [],
      'events': [],
    }
  }
  componentDidMount() {
    setInterval(this.updateEvents.bind(this), 10*60*1000)
    this.updateEvents()
  }
  updateEvents() {
    google.getAuth().then(tokens => {
      Promise.all(tokens.map(token => google.getSelectedEventsForTokenWithUser(token)))
      .then(userEvents => {
        // Merge events for all users, sort them and, join if many users have the same event
        const events = userEvents.reduce((events, l) => events.concat(l), []).sort((ev1, ev2) => ev1.date - ev2.date).reduce((events, ev) => {
          const present = events.find(oldEv => oldEv.id === ev.id)
          if (present) {
            present.users.push(ev.users[0]);
          } else {
            events.push(ev);
          }
          return events;
        }, [])
        const users = Array.from(events.reduce((users, ev) =>
          ev.users.reduce((users, user) => users.add(user), users),
        new Set())).sort((u1, u2) => u1.given_name - u2.given_name)
        this.setState({
          'users': users,
          'events': events
        })
      })
    })
  }
  render() {
    return (
      <div className='calendar'>
      {this.state.events.reduce(google.eventsByDay, []).map((day, i) =>
        <Day events={day.events} name={day.name} users={this.state.users} key={i}/>
      )}
      </div>
    )
  }
}

module.exports = Calendar
