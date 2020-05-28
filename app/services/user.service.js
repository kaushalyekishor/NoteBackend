var crypto = require('crypto');
var nodemailer = require('nodemailer');
var User = require('../models/user.model');
var bcrypt = require('bcrypt-nodejs');
var Token = require('../models/token.model');
var eventEmitter = require('../../events/event');

exports.signup = async function(req, res){
    var userExist = await User.findOne({
        email: req.body.email
    })
    if(userExist){
        res.send({
            message: 'user alreadt exist, pls try it differesnt email id'
        })
    }
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })
    
    await bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), null, async function(err, hash){
        if(err){
            throw err
        }
        else{
            user.password = hash
        }

        let userResponse = await User.create(user);
         var token = await new Token({
             _userId: userResponse._id,
             token: crypto.randomBytes(16).toString('hex')
         });
         await token.save(async function(err){
             if(err){
                 return res.status(500).send({
                     message:err.message
                 });
             }
             else {
                 let subject = 'Account verification token';
                 //let text = token.token
                 let text = 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 'localhost:3000' + '\/confirmation\/' + token.token + '\n';
                 eventEmitter.emit('sendEmail', subject, user, text)
             }
         })
         res.send({
             status: userResponse.name+' registered'
         })
    })
 }