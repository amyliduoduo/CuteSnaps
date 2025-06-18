// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage         from './components/Homepage';
import LayoutSelector   from './components/LayoutSelector';
import PhotocapturePage from './components/PhotocapturePage';
import CaptureSequencePage from './components/CaptureSequencePage';

function App() {
  // this will receive the timer+filter settings from your capture page
  function handleCaptureNext(opts) {
    console.log('Capture settings:', opts);
    // e.g. navigate to a review page or save to state here
  }

  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Homepage />} />
        <Route path="/layout"  element={<LayoutSelector />} />
        <Route path="/capture" element={<PhotocapturePage />} />
        <Route path="/sequence" element={<CaptureSequencePage />} />
      </Routes>
    </Router>
  );
}

export default App;
