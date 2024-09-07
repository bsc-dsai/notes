const axios = require('axios');
const interval = 15 * 60 * 1000; // 15 minutes in milliseconds

// URL of your Glitch app
const url = 'https://marmalade-ordinary-earwig.glitch.me/';

// Function to send a wake-up request
function sendWakeUpRequest() {
    axios.get(url)
        .then(response => {
            console.log('Wake-up request successful');
        })
        .catch(error => {
            console.error('Error sending wake-up request:', error);
        });
}

// Send wake-up request every 15 minutes
setInterval(sendWakeUpRequest, interval);

// Send an initial wake-up request
sendWakeUpRequest();
