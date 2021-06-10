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
        {
          loaded ? (
            <p className="link">
              <a href="https://github.com/zamhown/uncanny-valley-poetry" target="_blank">fork me on GitHub</a>
            </p>
          ) : null
        }
        <Poetry show={loaded} />
        {!loaded ? <Index onLoad={handleLoad} /> : null}
      </div>
    </div>
  );
}

export default App;
