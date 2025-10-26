import React from 'react';
import MenuComponent from './MenuComponent';
import MainContainer from './MainContainer';
import FooterComponent from './FooterComponent';

function HomePage() {
    return (
        <div className="App">
            <MenuComponent />
            <MainContainer />
            <FooterComponent />
        </div>
    );
}

export default HomePage;