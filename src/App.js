// src/App.js
// 🚀 Redeploy trigger
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import Homepage         from './components/Homepage';
import LayoutSelector   from './components/LayoutSelector';
import PhotocapturePage from './components/PhotocapturePage';
import CaptureSequencePage from './components/CaptureSequencePage';
import EditPage from './components/EditPage';
import DownloadPage from './components/DownloadPage';
import TextboxPage from './components/TextboxPage';
import LetterPage from './components/LetterPage';
import { useLocation } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
inject();

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
        <Route path="/edit" element={<EditPage />} />
        <Route path="/download" element={<DownloadPageWrapper />} />
        <Route path="/textbox" element={<TextboxPage />} />
        <Route path="/final-letter" element={<LetterPage />} />
      </Routes>
    </Router>
  );
}

// Wrapper to pass photostripUrl from location.state
function DownloadPageWrapper() {
  const location = useLocation();
  const photostripUrl = location.state?.photostripUrl;
  return <DownloadPage photostripUrl={photostripUrl} />;
}

export default App;
