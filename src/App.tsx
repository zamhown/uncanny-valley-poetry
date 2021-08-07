import React, { CSSProperties, useState } from 'react';
import './styles/App.css';

import Background from './components/Background'
import Poetry from './components/Poetry';
import Index from './components/Index'

function App() {
  const [loaded, setLoaded] = useState(false)
  const handleLoad = () => setLoaded(true)

  const beforeLoading: CSSProperties = {opacity: loaded ? 0 : 1, transition: '0.5s'}
  const afterLoading: CSSProperties = {opacity: loaded ? 1 : 0, transition: '1s'}

  return (
    <div className="App">
      <Background />
      <div className="container">
        <Index style={beforeLoading} onLoad={handleLoad} />
        <div className="frame" style={afterLoading}></div>
        <p className="link" style={afterLoading}>
          <a href="https://github.com/zamhown/uncanny-valley-poetry" target="_blank" rel="noreferrer">fork me on GitHub</a>
        </p>
        <Poetry show={loaded} />
      </div>
    </div>
  );
}

export default App;
