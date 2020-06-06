const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const url = process.env.DATABASE;

mongoose.connect(url, {
    useNewUrlParser: true
})
    .then(() => {
        console.log('sucessfully connceted to DB');
    })
    .catch(err => {
        console.log('Error ocuuured while connecting ' + err);
        process.exit();
    })