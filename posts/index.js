const express = require('express');
const bodyParser = require('body-parser');
const {randomBytes} = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

app.get('/posts', (req, res) => {
    res.send(posts);
});

//need to rename to /posts/create/ in order to prevent ingress-nginx conflict (since ingress only reads paths, not GET / POST w/ the query endpoint
app.post('/posts/create', async (req, res) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;
    
    posts[id] = {
        id, title
    };

    //sending event data to the events bus
    //since we've spun up docker + k8s, that informs URL
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });
    
    res.status(201).send(posts[id]);
});

app.post('/events', (req, res) => {
    console.log('Received event', req.body.type);

    res.send({});
});

app.listen(4000, () => {
    console.log('v93');
    console.log('Listening on 4000');
});