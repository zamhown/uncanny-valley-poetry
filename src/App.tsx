import React from 'react';
import './App.css';

import Background from './components/Background'
import Poetry from './components/Poetry';

function App() {
  return (
    <div className="App">
      <Background />
      <div className="container">
        <div className="frame"></div>
        <Poetry />
      </div>
    </div>
  );
}

export default App;
