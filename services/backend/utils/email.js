const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Fallback for development if credentials are not set
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com' || process.env.NODE_ENV === 'development' && !process.env.EMAIL_PASS) {
    console.log('\x1b[33m%s\x1b[0m', '--- DEVELOPMENT EMAIL LOG ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.message}`);
    console.log('\x1b[33m%s\x1b[0m', '-----------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
