require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Authenticated routes using referrer domain
const auth = (req, res, next) => {
    const referrer = req.headers.referer;
    console.log(referrer);
    try {
        if (referrer === 'https://shadikur.com/' || referrer === 'https://www.shadikur.com/' || referrer === 'http://localhost:5173/') {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    }
    catch (err) {
        res.status(401).send('Unauthorized');
    }
};

// Nodemail transporter
const transporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com", // "smtp.mailtrap.io
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: process.env.MAILJET_USER,
        pass: process.env.MAILJET_PASS
    }
});

// verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

// Nodemail options
const mailOptions = {
    from: 'Shadikur - Portfolio <web@shadikur.com>',
    to: 'me@shadikur.com',
    subject: 'Portfolio Contact Form',
    text: 'Contact form submission from Shadikur Portfolio',
    html: '<b>Hello world?</b>'
};

// Nodemail send mail
const sendMail = (mailOptions) => {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Email validator
const validateEmail = async (email) => {
    try {
        const result = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`);
        // console.log(result.data);
        if (result.data.deliverability === 'DELIVERABLE' && result.data.is_valid_format.value === true && result.data.is_disposable_email.value === false && result.data.is_mx_found.value === true && result.data.is_smtp_valid.value === true) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
};

// Routes
// Send email
app.post('/send', auth, async (req, res) => {
    const { name, email, phone, subject, message, ipAddress } = req.body;
    const isValidEmail = await validateEmail(email);
    if (isValidEmail) {
        mailOptions.html = `
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone}</p>
        <p>Subject: ${subject}</p>
        <p>Message: ${message}</p>
        <p>IP: ${ipAddress}</p>
        `;
        sendMail(mailOptions);
        res.status(200).send('Email sent');
    } else {
        res.status(400).send('The email address you entered is invalid. Please try again.');
    }
});

// Request Resume
app.post('/resume', auth, async (req, res) => {
    const { email, ipAddress } = req.body;
    const isValidEmail = await validateEmail(email);
    if (isValidEmail) {
        mailOptions.html = `
    <p> You have a new resume request from ${email} </p>
    <p>IP: ${ipAddress}</p>
    `;
        sendMail(mailOptions);
        res.status(200).send('Email sent');
    } else {
        res.status(400).send('The email address you entered is invalid. Please try again.');
    }
});


// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));