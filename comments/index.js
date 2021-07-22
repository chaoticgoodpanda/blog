const express = require('express');
const bodyParser = require('body-parser');
const {randomBytes} = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

//all comments associated with a given post
const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []) ;
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const {content} = req.body;
    
    const comments = commentsByPostId[req.params.id] || [];
    
    //push new comment into the comments array
    //this is the actual object for the new comment
    //initial status for new comment is 'pending' to be sent to the event bus, which then sends it to the moderation service
    comments.push({id: commentId, content, status: 'pending'});
    
    commentsByPostId[req.params.id] = comments;

    //send new comment to events bus
    await axios.post('http://localhost:4005/events', {
        type: "CommentCreated",
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });
    
    res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
    console.log('Event received', req.body.type);

    const {type, data} = req.body;

    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];

        //iterate on comments and pull out ones we want
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;

        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content
            }
        })
    }

    res.send({});
})

app.listen(4001, () => {
    console.log('Listening on 4001');
})
