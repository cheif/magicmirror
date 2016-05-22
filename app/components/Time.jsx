const React = require('react')
const {zeroPad} = require('../lib/utils.js')

class Time extends React.Component {
  constructor() {
    super()
    this.state = {
      'time': new Date()
    }
  }
  componentDidMount() {
    setInterval(this.updateClock.bind(this), 1000)
  }
  updateClock() {
    this.setState({
      'time': new Date()
    })
  }
  render() {
    return (
      <div className='clock'>{zeroPad(this.state.time.getHours())}:{zeroPad(this.state.time.getMinutes())}</div>
    )
  }
}

module.exports = Time
