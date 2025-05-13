import React from 'react';
import CreateClock from './components/CreateClock';
import CreateWeather from './components/CreateWeather';
import CreateCalendar from './components/CreateCalendar';

function App() {
  return (
    <div className="App">
      <CreateClock />
      <CreateWeather />
      <CreateCalendar />
    </div>
  )
};

export default App;