const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }

});

transporter.verify((error, success) => {
    if (error) {
        console.log("Email connection failed:", error);

    } else {
        console.log("Email server is ready");
    }

});
//
async function sendVerificationMail(to, link) {

    return transporter.sendMail({

        from: `"Fish Dice" <${process.env.SMTP_EMAIL}>`,

        to,

        subject: "Verify Your FishDice Account",

        html: `

            <h2>Verify Your Email</h2>

            <p>Click the link below to verify your account:</p>
            <a href="${link}" 
               style="padding:10px 15px;background:#0af;color:#fff;border-radius:6px;">
                Verify Email
            </a>
        `
    });

}

module.exports = sendVerificationMail;


