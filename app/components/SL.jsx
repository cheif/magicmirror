const React = require('react')

class SL extends React.Component {
  constructor() {
    super()
    this.state = {stops: []}
  }
  componentDidMount() {
    this.updateDepartures()
    setInterval(this.updateDepartures.bind(this), 30*1000)
  }
  updateDepartures() {
    navigator.geolocation.getCurrentPosition(({coords}) => {
      fetch('/getRealTime?lat=' + coords.latitude + '&lon=' + coords.longitude)
        .then(resp => resp.json()).then(stops => this.setState({stops: stops}))
    })
  }
  render() {
    const icons = {
      'BUS': (<i className='fa fa-bus' />),
      'METRO': (<i className='fa fa-subway' />),
    }
    return (
      <div className='sl'>
      {this.state.stops.map(stop => (
        <div className='stop'>
          <span>{stop.name}</span>
          <div className='departures'>
            {stop.departures.map(dep => (
              <div className='departure'>
              {icons[dep.TransportMode]} {dep.LineNumber} {'->'} {dep.Destination}. {dep.DisplayTime}
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>
    )
  }
}

module.exports = SL
