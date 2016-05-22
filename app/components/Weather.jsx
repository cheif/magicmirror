const React = require('react')
const ReactDOM = require('react-dom')
const Skycons = require('skycons')(window)

class Weather extends React.Component {
  constructor() {
    super()
    this.state = {
      temperature: 0,
      text: '',
      skycons: new Skycons({color: 'white'}),
    }
  }
  componentDidMount() {
    setInterval(this.updateWeather.bind(this), 10*60*1000)
    this.updateWeather()
  }
  updateWeather() {
    navigator.geolocation.getCurrentPosition(pos => {
      const latLongPart = [pos.coords.latitude, pos.coords.longitude].join(',');
      fetch('/getWeather?latLong=' + latLongPart).then(resp => resp.json())
      .then(data => {
        const temperature = data.currently.temperature;
        const today = data.daily.data[0];
        const iconName = today.icon;
        this.setState({
          text: today.summary,
          temperature: Math.round(temperature*10)/10,
        })
        const skyconsName = iconName.toUpperCase().replace(/-/g, '_')
        window.state = this.state
        this.state.skycons.set(this.weatherIcon, Skycons[skyconsName])
        this.state.skycons.play()
      })
    });
  }
  render() {
    return (
      <div className='weather'>
      <div className='weather-top'>
      <canvas ref={(ref) => this.weatherIcon = ref} width="128" height="128"></canvas>
      <div className='temperature'>{this.state.temperature}°C</div>
      </div>
      <div className='weather-text'>{this.state.text}</div>
      </div>
    )
  }
}

module.exports = Weather
