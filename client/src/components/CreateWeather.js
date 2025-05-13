import React, { useState } from 'react';
import getWeather from '../apiHandlers/weatherapi';

function createWeather() {
  return (
    <div style={{color: "whitesmoke"}}>
      <h2> Created Weather Attribute </h2>
    </div>
  );
};

export default createWeather;