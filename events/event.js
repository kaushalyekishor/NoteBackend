var events = require('events');
var eventEmitter = new events.EventEmitter();
var nodemailer = require('nodemailer');
var dotenv = require('dotenv');
dotenv.config();

/// Create event handler
var sendEmail = function (subject, user, text) {
    return new Promise(async function(resolve, reject){
        try {
            var transporter = await nodemailer.createTransport({
                service:'gmail',
               
               // secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            var mailOptions =  {
                from: process.env.EMAIL,
                to: user.email,
                subject: subject,
                text: text,
            }
            await transporter.sendMail(mailOptions, async function (error, info) {
                if (error) {
                    return await resolve(error.message)
                }
                else {
                    return resolve('Verfication mail has been sent to ' + user.email + '.');
                }
            });
        } catch (error) {
            return reject(error)
        }
    })
       
}

/// Assign the event handler to an event
eventEmitter.on('sendEmail', sendEmail);

module.exports = eventEmitter;
