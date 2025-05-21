import { getGPT } from "../apiHandlers/gptapi";
import React, { useState } from 'react';

function createGpt() {
  const [gpt, setGpt] = useState(getGPT());

  return (
      <h1 style={{color: "whitesmoke", textAlign: "center"}}>{gpt}</h1>
  );
};

export default createGpt;