var express = require('express');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT;
const app = express();
const database = require('./config/config.database');
var userRoute = require('./app/routes/user.routes')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/user', userRoute);

app.post('submit', function (req, res) {
    console.log(req.body);
    res.render('index', {
        title: 'Data Saved',
        message: 'Data saved successfully.'
    })
})

database.mongoose;

app.listen(port, () => {
    console.log("Server is listening on port ", port);
});