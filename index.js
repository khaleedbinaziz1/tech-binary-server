const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const SSLCommerzPayment = require('sslcommerz')
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
    app.delete('/delete/:id', (req, res) => {
        serviceCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then( result => {
          console.log(result)
        })
      })
    
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({email: email})
        .toArray((err, admins) => {
            res.send(admins.length > 0);
        })
    })
});

app.listen(process.env.PORT || port)



app.use("/ssl-request", async (req, res, next) => {
    const data = {
        total_amount: 100,
        currency: 'EUR',
        tran_id: 'REF123',
        success_url: 'https://peaceful-hamlet-50331.herokuapp.com/ssl-payment-success',
        fail_url: 'https://peaceful-hamlet-50331.herokuapp.com/ssl-payment-fail',
        cancel_url: 'https://peaceful-hamlet-50331.herokuapp.com/ssl-payment-cancel',
        ipn_url: 'https://peaceful-hamlet-50331.herokuapp.com/ssl-payment-ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'cust@yahoo.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
        multi_card_name: 'mastercard',
        value_a: 'ref001_A',
        value_b: 'ref002_B',
        value_c: 'ref003_C',
        value_d: 'ref004_D'
    };
    const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWD, false) //true for live default false for sandbox
    sslcommer.init(data).then(data => {
        //process the response that got from sslcommerz 
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        console.log("data", data);
        if (data?.GatewayPageURL) {
            return res.status(200).redirect(data?.GatewayPageURL);
        }
        else {
            return res.status(400).json({
                message: "Ssl session was not successful"
            })
        }
    });

})

app.post("/ssl-payment-success", async (req, res, next) => {
    return res.status(200).json({
        data: req.body
    })
});

app.post("/ssl-payment-failure", async (req, res, next) => {
    return res.status(200).json({
        data: req.body
    })
});
app.post("/ssl-payment-cancel", async (req, res, next) => {
    return res.status(200).json({
        data: req.body
    })
});
app.post("/ssl-payment-inp", async (req, res, next) => {
    return res.status(200).json({
        data: req.body
    })
});