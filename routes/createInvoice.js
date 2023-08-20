const fs = require("fs");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");




async function createInvoice(invoice, path) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });




  generateHeader(doc);
  generateInvoiceInformation(doc, invoice);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateSummary(doc, invoice);
  generateTransactions(doc, invoice);
  generateNotes(doc, invoice);
  generateTermsAndConditions(doc);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path));
  sendEmailWithAttachment(email, path);
}

function generateHeader(doc) {
  doc
    // .image("logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("RV TECHNOLOGIES", 110, 57)
    .fontSize(10)
    .text("Office Number 174, Shiv Shakti Plaza, L-1, Palam Dabri Marg,", 300, 50, { align: "right" })
    .text("supervisor")
    .text("Opp. Shiv Vani School, Kali Nagar", 200, 65, { align: "right" })
    .text("Delhi, India - 110045", 200, 80, { align: "right" })
    .text("+91 8700357353", 200, 95, { align: "right" })
    .text("Email ID: admin@rvtechnologies.in.net", 200, 110, { align: "right" })
    .text("Support Id: support@rvtechnologies.in.net", 200, 125, { align: "right" })
    .moveDown();
}

function generateInvoiceInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(10)
    .text("INVOICE", 50, 160)
    .font("Helvetica-Bold")
    .text(`# RV/INVOICE ID/${invoice.invoice_nr}`, 150, 160)
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Bill To:", 50, 200)
    .font("Helvetica")
    .text(invoice.shipping.name, 50, 215)
    .text(invoice.shipping.address, 50, 230)
    .text(`${invoice.shipping.city}, ${invoice.shipping.state}`, 50, 245)
    .text(`IN ${invoice.shipping.postal_code}`, 50, 260)
    .moveDown();
}

function generateInvoiceTable(doc, invoice) {
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Qty",
    "Rate",
    "Amount"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.item,
      item.description,
      item.quantity,
      formatCurrency(item.amount / item.quantity),
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }
}

function generateSummaryRow(doc, y, label, description, amountLabel, amountValue) {
  doc
    .fontSize(10)
    .text(label, 50, y)
    .text(description, 150, y)
    .text(amountLabel, 370, y, { width: 90, align: "right" })
    .text(amountValue, 0, y, { align: "right" });
}

function calculateTax(amount, taxPercentage) {
  return (amount * (taxPercentage / 100)).toFixed(2);
}

function generateSummary(doc, invoice) {
  const summaryTop = 330 + (invoice.items.length + 3) * 30 + 60 + 60;

  doc.font("Helvetica-Bold");
  generateSummaryRow(
    doc,
    summaryTop,
    "",
    "Sub Total",
    "",
    formatCurrency(invoice.subtotal)
  );
  generateSummaryRow(
    doc,
    summaryTop + 20,
    "CGST (9.00%)",
    "",
    formatCurrency(calculateTax(invoice.subtotal, 9)),
    ""
  );
  generateSummaryRow(
    doc,
    summaryTop + 40,
    "SGST (9.00%)",
    "",
    formatCurrency(calculateTax(invoice.subtotal, 9)),
    ""
  );
  generateHr(doc, summaryTop + 60);
  doc.font("Helvetica-Bold");
  generateSummaryRow(
    doc,
    summaryTop + 80,
    "",
    "Total",
    "",
    formatCurrency(invoice.total)
  );
  generateSummaryRow(
    doc,
    summaryTop + 100,
    "Total Paid",
    "",
    formatCurrency(invoice.paid),
    ""
  );
  generateSummaryRow(
    doc,
    summaryTop + 120,
    "",
    "Amount Due",
    "",
    formatCurrency(invoice.total - invoice.paid)
  );
  doc.font("Helvetica");
}

function generateTransactions(doc, invoice) {
  if (invoice.transactions && invoice.transactions.length > 0) {
    const transactionsTop = 330 + (invoice.items.length + 3) * 30;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Transactions:", 50, transactionsTop)
      .font("Helvetica")
      .fontSize(10);

    for (let i = 0; i < invoice.transactions.length; i++) {
      const transaction = invoice.transactions[i];
      const position = transactionsTop + (i + 1) * 15;

      doc.text(
        `${transaction.payment} (${transaction.mode}) - ${transaction.date}`,
        50,
        position
      );
    }
  }
}

function generateNotes(doc, invoice) {
  if (invoice.notes && invoice.notes.length > 0) {
    const notesTop = 330 + (invoice.items.length + 3) * 30 + 60;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Notes:", 50, notesTop)
      .font("Helvetica")
      .fontSize(10);

    for (let i = 0; i < invoice.notes.length; i++) {
      const note = invoice.notes[i];
      const position = notesTop + (i + 1) * 15;

      doc.text(note, 50, position);
    }
  }
}

function generateTermsAndConditions(doc) {
  // const termsAndConditionsTop =
  //   330 + (invoice.items.length + 3) * 30 + 60 + 60;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Terms and Conditions:", 50, termsAndConditionsTop)
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Late payment is subject to fees.",
      50,
      termsAndConditionsTop + 15
    )
    .text("No refunds or exchanges after 30 days.", 50, termsAndConditionsTop + 30);
}

function generateFooter(doc) {
  // const footerTop =
  //   330 + (invoice.items.length + 3) * 30 + 60 + 60 + 40;

  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      footerTop,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  sac,
  quantity,
  rate,
  amount
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(sac, 200, y, { width: 90, align: "right" })
    .text(quantity, 280, y, { width: 90, align: "right" })
    .text(rate, 370, y, { width: 90, align: "right" })
    .text(amount, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(amount) {
  if (typeof amount !== "undefined") {
    return "₹" + parseFloat(amount).toFixed(2);
  }
  return "";
}

async function sendEmailWithAttachment(email, path) {
  const transporter = nodemailer.createTransport({
    service: "",
    auth: {
      user: "test@cyberspacebud.com",
      pass: "Pass@#$12345",
    },
  });

  const mailOptions = {
    from: "test@cyberspacebud.com",
    to: "hs1472539@gmail.com",
    subject: "Invoice",
    text: "Please find attached the invoice PDF.",
    attachments: [
      {
        filename: "invoice.pdf",
        path: path,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Invoice sent successfully to", email);
  } catch (error) {
    console.error("Error sending invoice:", error);
  }
}

module.exports = { createInvoice };