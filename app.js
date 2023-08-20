const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const stripe = require('stripe')('sk_test_XXXXXXXXXXXXXXXXXXXXXXXX');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const request = require('request');
const razorpay = require('razorpay');
const ipapi = require('ipapi.co');

const geoip = require('geoip-lite');

const app = express();

// Create an instance of the Razorpay client
const razorpayInstance = new razorpay({
  key_id: 'rzp_test_XXXXXXXXXXXX',
  key_secret: 'XXXXXXXXXXXXXXXXXXX',
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true; // Reformat HTML code after rendering

// Set up express application
app.use(favicon(path.join(__dirname, 'public', '/img/ico/favicon.ico')));
app.use(morgan('dev')); // Log every request to the console
app.use(bodyParser.json()); // Parse JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
app.use(session({ secret: 'anhpham1509', saveUninitialized: true, resave: true })); // Set session secret
require('./config/passport')(passport); // Configure passport
app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport for persistent login sessions
app.use(flash()); // Use connect-flash for flash messages stored in session




app.use(async function (req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const response = await ipapi.location(ip);
    const countryCode = response.country_code;
    req.userCountry = countryCode || 'Unknown';
  } catch (error) {
    console.error('Error retrieving user country:', error);
    req.userCountry = 'Unknown';
  }
  next();
});

// Routes
const routes = require('./routes/routes');
const users = require('./routes/users')(app, passport);
const products = require('./routes/cart');
const checkout = require('./routes/checkout');
const press = require('./routes/press');
const services = require('./routes/services');
const contact = require('./routes/contact');
const admin = require('./routes/admin');
const profile = require('./routes/profile');

app.get('/checkout/delivery/', (req, res) => {
  const userCountry = req.userCountry;
  res.render('checkout/review', { userCountry });
});

const cors = require('cors');
const corsOptions = {
  origin: 'http://cyberspacebuds.com',
  credentials: true, // Allow sending cookies from the frontend to the backend
};
app.use(cors(corsOptions));

app.use('/', routes);
app.use('/cart', products);
app.use('/checkout', checkout);
app.use('/press', press);
app.use('/services', services);
app.use('/contact-us', contact);
app.use('/admin', admin);
app.use('/usr', profile);

// Middleware for session-persisted messages
app.use(function(req, res, next) {
  const err = req.session.error;
  const msg = req.session.notice;
  const success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

app.post('/payment', function(req, res) {
  const amount = req.body.amount;
  const currency = req.body.currency;
  const token = req.body.stripeToken;

  stripe.charges.create(
    {
      amount: amount,
      currency: currency,
      source: token,
      description: 'Payment for your e-commerce order',
    },
    function(err, charge) {
      if (err) {
        console.error(err);
        req.session.error = 'Payment failed.';
        res.redirect('/checkout/invoice');
      } else {
        req.session.success = 'Payment successful!';
        res.redirect('/checkout/invoice');
      }
    }
  );
});

// Handle the Razorpay payment callback
app.post('/razorpay-payment', (req, res) => {
  const { amount, currency } = req.body;

  // Create an order
  razorpayInstance.orders.create(
    {
      amount: parseInt(amount),
      currency: currency,
      payment_capture: 1, // Automatically capture the payment
    },
    (err, order) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create order' });
      }

      res.redirect('/checkout/invoice');
    }
  );
});

let product =
  'https://drive.google.com/file/d/1TT5AwkFh8byxvRwreqA32bJd2hfbaa0I/view?usp=share_link';

app.post('/generate-invoice', (req, res) => {
  // Get the invoice data from the request body
  const invoiceData = req.body;

  // Create a new PDF document
  const doc = new PDFDocument();

  // Set the response headers for PDF file download
  res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
  res.setHeader('Content-Type', 'application/pdf');

  // Pipe the PDF document to the response
  doc.pipe(res);

  // Add content to the PDF document
  doc.fontSize(18).text('Invoice', { align: 'center' });
  // Add more content based on your invoice data

  // Finalize the PDF document
  doc.end();
});

app.post('/send-invoice', (req, res) => {
  // Get the invoice ID from the request body
  const invoiceId = req.body.invoiceId;

  // Create a transporter for sending email
  const transporter = nodemailer.createTransport({
    // Configure your email provider settings here
    // Example: Gmail SMTP
    service: 'test@cyberspacebud.com',
    auth: {
      user: 'test@cyberspacebud.com',
      pass: 'Pass@#$12345',
    },
  });

  // Compose the email message
  const mailOptions = {
    from: 'test@cyberspacebud.com',
    to: 'hs1472539@gmail.com',
    subject: 'Invoice',
    text: 'Please find the attached invoice.',
    attachments: [
      {
        filename: 'invoice.pdf',
        path: `${invoiceId}.pdf`, // Specify the path to the generated invoice PDF
      },
    ],
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // Handle email sending error
      console.error(error);
      res.json({ success: false, error: 'Failed to send the invoice via email.' });
    } else {
      // Email sent successfully
      res.json({ success: true });
    }
  });
});

// Method to get user's country based on IP geolocation
// function getUserCountry(callback) {
//   request.get('https://ipinfo.io', function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       const location = JSON.parse(body).country;
//       callback(null, location);
//     } else {
//       callback(error, null);
//     }
//   });
// }



// Route to retrieve user's country
// app.get('/get-user-country', function(req, res) {
//   getUserCountry(function(error, country) {
//     if (error) {
//       console.log('Error retrieving user country:', error);
//       res.status(500).json({ error: 'Failed to retrieve user country' });
//     } else {
//       console.log('User country:', country);
//       res.status(200).json({ country: country });
//     }
//   });
// });

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
