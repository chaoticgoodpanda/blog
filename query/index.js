const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const posts = {};

//helper function for processing event types
const handleEvent = (type, data) => {
    if (type === 'PostCreated') {
        const {id, title} = data;

        posts[id] = {id, title, comments: []};
    }

    if (type === 'CommentCreated') {
        const {id, content, postId, status} = data;

        const post = posts[postId];
        post.comments.push({id, content, status});
    }

    if (type === 'CommentUpdated') {
        const {id, postId, content, status } = data;

        const post = posts[postId];
        const comment = post.comments.find(comment => {
            return comment.id === id;
        });

        comment.status = status;
        comment.content = content;
    }
}

app.get('/posts', (req, res) => {
    res.send(posts);
});

//event that receives events from event bus
//posts requests handler
app.post('/events', (req, res) => {
    const { type, data} = req.body;

    //call helper function above
    handleEvent(type, data);
    
    res.send({});
});

app.listen(4002, async () => {
    console.log('Listening on 4002');
    try {
        //gives us all the events that have occurred over time
        const res = await axios.get('http://localhost:4005/events');

        //when using axios, data we get back is in res.data
        for (let event of res.data) {
            console.log('Processing event', event.type);

            handleEvent(event.type, event.data);
        }
    } catch (error) {
        console.log(error.message);
    }

});