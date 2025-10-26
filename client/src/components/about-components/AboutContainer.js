import React from 'react';
import MenuComponent from '../home-page-components/MenuComponent';
import FooterComponent from '../home-page-components/FooterComponent';

export default function AboutContainer() {
  return (
    
    <div className="main-container">
    <MenuComponent />
      <h1>About Us</h1>
      <p>This is the About Us page.</p>
      <FooterComponent />
    </div>
    
  );
}