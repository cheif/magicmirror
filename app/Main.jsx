const React = require('react')
const ReactDOM = require('react-dom')
const Calendar = require('./components/Calendar.jsx')
const Time = require('./components/Time.jsx')
const Weather = require('./components/Weather.jsx')
const SL = require('./components/SL.jsx')

class Main extends React.Component {
  render() {
    return (
      <div>
        <div className='left'>
          <Calendar />
        </div>
        <div className='right'>
          <Time />
          <Weather />
          <SL />
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Main />,
  document.getElementById('content')
)
