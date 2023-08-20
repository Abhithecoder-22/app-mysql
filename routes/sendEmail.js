const nodemailer = require('nodemailer');
var express = require('express');
var router = express.Router();

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@example.com', // Replace with your email address
    pass: 'your-password', // Replace with your email password
  },
});

// Function to generate the email content for the invoice
const generateInvoiceEmailContent = (invoiceData) => {
  const {
    invoiceId,
    invoiceDate,
    dueDate,
    gstNumber,
    panNumber,
    billTo,
    items,
    subTotal,
    cgst,
    sgst,
    total,
    totalPaid,
    amountDue,
    transactions,
  } = invoiceData;

  // Create the HTML content of the email
  const emailContent = `
    <h2>INVOICE</h2>
    <p># ${invoiceId}</p>
    <p>PAID</p>
    <p>Bill To:</p>
    <p>${billTo}</p>
    <p>Invoice Date: ${invoiceDate}</p>
    <p>Due Date: ${dueDate}</p>
    <p>GST Number: ${gstNumber}</p>
    <p>PAN Number: ${panNumber}</p>
    <p>Item Sac Qty Rate Amount</p>
    ${items
      .map(
        (item, index) => `
        <p>${index + 1} ${item.name}</p>
        <p>${item.sac} ${item.qty} ${item.rate} ${item.amount}</p>
      `
      )
      .join('')}
    <p>Sub Total Rs${subTotal}</p>
    <p>CGST (9.00%) Rs${cgst}</p>
    <p>SGST (9.00%) Rs${sgst}</p>
    <p>Total Rs${total}</p>
    <p>Total Paid -Rs${totalPaid}</p>
    <p>Amount Due Rs${amountDue}</p>
    <p>Transactions:</p>
    ${transactions
      .map(
        (transaction) => `
        <p>Payment # ${transaction.paymentNumber}</p>
        <p>Payment Mode ${transaction.paymentMode}</p>
        <p>Date ${transaction.paymentDate}</p>
        <p>Amount ${transaction.paymentAmount}</p>
      `
      )
      .join('')}
    <p>Note:</p>
    <p>*Do Not Use Business Mail As A Bulk Mail Service As Per Our Policies It Will Be Discontinued With Immediate Effect.</p>
    <p>*Will Only Provide Server Support 24*7 (+91 8700357353)</p>
    <p>*Application Part Will Not Cover Under This. *backup Part Of Application/server Is Also Not Under This.</p>
    <p>*Increase Price Of IP Address Will Also Increase The Price Of IP</p>
    <p>Terms & Conditions:</p>
    <ul>
      <li><a href="https://rvpolicies.com">https://rvpolicies.com</a></li>
      <li><a href="https://rvtechnologies.in.net/wp-content/uploads/2021/11/TERMS-AND-CONDITIONS.pdf">https://rvtechnologies.in.net/wp-content/uploads/2021/11/TERMS-AND-CONDITIONS.pdf</a></li>
      <li><a href="https://rvtechnologies.in.net/wp-content/uploads/2021/11/SERVICE-LEVEL-AGREEMENT.pdf">https://rvtechnologies.in.net/wp-content/uploads/2021/11/SERVICE-LEVEL-AGREEMENT.pdf</a></li>
      <li><a href="https://rvtechnologies.in.net/wp-content/uploads/2021/11/PRIVACY-POLICY.pdf">https://rvtechnologies.in.net/wp-content/uploads/2021/11/PRIVACY-POLICY.pdf</a></li>
    </ul>
    <p>Authorized Signature ________________________</p>
  `;

  return emailContent;
};


// Function to send the invoice email
const sendInvoiceEmail = (customerEmail, invoiceData) => {
  const emailContent = generateInvoiceEmailContent(invoiceData);

  // Configure the email options
  const mailOptions = {
    from: 'your-email@example.com', // Replace with your email address
    to: customerEmail,
    subject: 'Invoice',
    html: emailContent,
  };

  // Send the email using the transporter
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Export the sendInvoiceEmail function
module.exports = {
  sendInvoiceEmail: sendInvoiceEmail,
};
