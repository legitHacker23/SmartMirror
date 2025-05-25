import React from 'react';
import CreateClock from './components/CreateClock';
import CreateWeather from './components/CreateWeather';
import CreateCalendar from './components/CreateCalendar';
import CreateGpt from './components/CreateGpt';
import './style.css';

function App() {
  return (
    <div className="App">
        <CreateClock />
      <div className="container">
        <CreateCalendar />
        <CreateWeather />
      </div>
      <CreateGpt />
    </div>
  );
};

export default App;

