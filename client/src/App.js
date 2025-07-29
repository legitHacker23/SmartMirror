import React from 'react';
import CreateClock from './components/CreateClock';
import CreateWeather from './components/CreateWeather';
import CreateCalendar from './components/CreateCalendar';
import CreateStocks from './components/CreateStocks';
import WakeWord from './components/WakeWord';
import './style.css';

function App() {
  return (
    <div className="App">
        <CreateClock />
      <div className="container">
        <div className="left-panel">
          <CreateCalendar />
          <CreateStocks />
        </div>
        <CreateWeather />
      </div>
      <WakeWord />
      </div>
  );
};

export default App;

