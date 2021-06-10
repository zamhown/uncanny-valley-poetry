import React, { useState } from 'react';
import './styles/App.css';

import Background from './components/Background'
import Poetry from './components/Poetry';
import Index from './components/Index'

function App() {
  const [loaded, setLoaded] = useState(false)
  const handleLoad = () => setLoaded(true)

  return (
    <div className="App">
      <Background />
      <div className="container">
        <div className="frame"></div>
        <Poetry show={loaded} />
        {!loaded ? <Index onLoad={handleLoad} /> : null}
      </div>
    </div>
  );
}

export default App;
