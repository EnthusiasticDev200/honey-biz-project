import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Nita Honey Biz" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your OTP for Password Reset",
    html: `<h3>Hello from Nita Honey Biz!</h3><p>Your OTP is: <strong>${otp}</strong>. 
        It expires in 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendOtpEmail 
