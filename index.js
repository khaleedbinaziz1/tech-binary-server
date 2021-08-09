const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ujcbv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('reviews'));
app.use(fileUpload());


const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookingCollection = client.db("buildTech").collection("bookings");
    const reviewCollection = client.db("buildTech").collection("reviews");
    const serviceCollection = client.db("buildTech").collection("services");
    const adminCollection = client.db("buildTech").collection("admins");


    app.post('/addBooking', (req, res) => {
        const booking = req.body;
        console.log(booking);
        bookingCollection.insertOne(booking)
            .then(result => {
                res.send(result.insertedCount)
            })
    });
    app.post('/addAdmin', (req, res) => {
        const admin = req.body;
        console.log(admin);
        adminCollection.insertOne(admin)
            .then(result => {
                res.send(result.insertedCount)
            })
    });

    app.post('/addReview', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const testimonial = req.body.testimonial;
        const company = req.body.company;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        reviewCollection.insertOne({ name, testimonial, company, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })



    app.post('/addServices', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const details = req.body.details;
        const newImg = req.files.file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ name, details, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })
    app.get('/bookings', (req, res) => {
        bookingCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.get('/reviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.get('/services', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({email: email})
        .toArray((err, admins) => {
            res.send(admins.length > 0);
        })
    })
});

app.listen(process.env.PORT || port)