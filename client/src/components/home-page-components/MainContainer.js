//import React, { useState, useEffect } from 'react';

const MainContainer = () => {
    const checkHealth = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert(`Server status: ${data.status}`);
            } catch (error) {
                console.error('Error checking server health:', error);
            }
        };
    return (
        <div className="main-container">
            <h1>Welcome to HighView Engage</h1>
            <p>Your platform for enhanced student engagement.</p>
             <div>
                <button onClick={checkHealth}>Check Server Health</button>
            </div>
        </div>

        // alert username if logged in, and call /api/health to check server status in an alert box
        // define checkHealth function
    );
};

export default MainContainer;
