const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.json());

app.post('/events', (req, res) => {
    //whatever comes in the event body, that is an event
    const event = req.body;
    
    axios.post('http://localhost:4000/events', event);
    axios.post('http://localhost:4001/events', event);
    axios.post('http://localhost:4002/events', event);
    
    res.send({ status: 'OK'});
});

//skipped a couple ports to set up event bus listening port.
app.listen(4005, () => {
    console.log('Listening on 4005');
});