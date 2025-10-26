import React from 'react';
import './styles/App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/home-page-components/HomePage';
import AboutContainer from './components/about-components/AboutContainer';
import SignInComponent from './components/signin-components/SignInComponent';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutContainer />} />
      <Route path="/signin" element={<SignInComponent />} /> 
      <Route path="/signout" element={<SingOutComponent />} />
      <Route path="/viewregistrations" element={<HomePage />} />
      <Route path="/profile" element={<HomePage />} />
    </Routes>
  );
}

export default App;