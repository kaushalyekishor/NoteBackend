var crypto = require('crypto');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');
var eventEmitter = require('../../events/event');
var jwt = require('jsonwebtoken');

// Models
var User = require('../models/user.model');
var Token = require('../models/token.model');


exports.signUp = async function (req, res) {
    /**
     * Gets users details with respective email id
     * Basically we are using this to find unique email id
     */
    var userExist = await User.findOne({
        email: req.body.email
    });

    /**
     * if user already exist it will throw an error that email id should be unque
     */
    if (userExist) {
        res.send({
            message: 'user alreadt exist, pls try it differesnt email id'
        });
    }
    /**
     * creating an object of User model and asigning the values which 
     * recieve from client side
     */
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })
    /**
     * encrypting the plain text password store in database
     */
    await bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), null, async function (err, hash) {
        if (err) {
            throw err
        }
        else {
            user.password = hash
        }
        /**
         * write a creating in database using mongoose create method
         */
        let userResponse = await User.create(user);
        /**
         * creating an object of Token model and asigning the userid which 
         * get after creting record of user in database and creating token
         * by crypto method
         */
        var token = await new Token({
            _userId: userResponse._id,
            token: crypto.randomBytes(16).toString('hex')
        });
        /**
         * creating the record of token in database
         * if it is successful event is triggered to send email
         */
        await token.save(async function (err) {
            if (err) {
                res.status(500).send({
                    message: err.message
                });
            }
            else {
                let subject = 'Account verification token';
                text = token.token
                //let text = 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 'localhost:3000' + '\/confirmation\/' + token.token + '\n';
                eventEmitter.emit('sendEmail', subject, user, text);
            }
        })
        res.send({
            status: userResponse.name + ' registered'
        })
    })
}

exports.confirmAccount = async function (req, res) {
/**
 * get Token object from databse
 */
    var tokenData = await Token.findOne({ token: req.params.token })
    if (!tokenData) {
        return res.send({
            message: 'invalid token passed'
        })
    }
    /**
     * get User object from database
     */
    var userData = await User.findOne({
        _id: tokenData._userId
    })
    /**
     * check user exist or not
     */
    if (!userData) {
        return res.status(401).send({
            message: 'User does not exist, may be account is deleted'
        })
    }
    /**
     * check user is verified or not
     */
    if (userData.isVerified) {
        return res.send({
            message: 'User is already verified'
        })
    }
    /**
     * if user is Not verified then user verified is true and save it in Database
     */
    userData.isVerified = true
    userData.save()
        .then((resForVerify) => {
            return res.send({
                message: 'Account Successfully verified'
            })
        })
        .catch(err => {
            return res.send(err)
        })
}

exports.login = async function (req, res) {
    try {
        /**
         * check user Exist or Not
         */
        var userExist = await User.findOne({
            email: req.body.email
        })
        /**
         * if user Exist then compare user password & encrypted database password
         */
        if (userExist) {
            if (bcrypt.compareSync(req.body.password, userExist.password)) {
                if (!userExist.isVerified) {
                    return res.status(400).send({
                        message: 'User is not varified'
                    })
                }
                const payload = {
                    _id: userExist._id,
                    email: userExist.email,
                    name: userExist.name
                }
                /**
                 * create JWT Token
                 */
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 1440
                })
                
                //res.send(token:token)
                res.json({ user_id: userExist._id, token: token });
            } else {
                return res.status(401).send({
                    message: "wrong password please check"
                })
            }

        } else {
            res.status(401).send({
                message: 'Invalid user email address please check'
            })
        }
    } catch (err) {
        res.send(err)
    }
}


exports.getToken = async (req, res) => {
    /**
     * find user in databse 
     */
    User.findOne({
        email: req.body.email
    })
        .then(async userExist => {
            if (!userExist) {
                return res.status(401).send({
                    message: 'Email id does not Exist, PLease enter Valid email id'
                });
            }
            //  Token.findOne({_userId: userExist._id})
            // .then(token =>{

            var token = await new Token({
                _userId: userExist._id,
                token: crypto.randomBytes(16).toString('hex')
            });
            /**
             * creating the record of token in database
             * if it is successful event is triggered to send email
             */
            await token.save(async function (err) {
                if (err) {
                    res.status(500).send({
                        message: err.message
                    });
                }
                else {
                    let subject = 'Account verification token';
                    text = 'reset password token :' + token.token
                    eventEmitter.emit('sendEmail', subject, userExist, text);
                }
            })
            res.send({
                status: 'congrats ' + userExist.name + '!, the reset password token has been sent to your email id'
            })

        })
}



exports.passwordReset = async function (req, res) {
    try {
        /**
         * find user Exist or Not in Database
         */
        let userExist = await User.findOne({
            email: req.body.email
        })
        /**
         * if user Exist then Generate an token 
         */
        if (userExist) {
            var token = await new Token({
                _userId: userExist._id,
                token: crypto.randomBytes(16).toString('hex')
            })

            token.save(function (err) {
                if (err) {
                    return res.status(500).send({
                        message: err.message
                    })
                }
                else {
                    let subject = 'keepNotes, Please reset your password'
                    text = token.token
                    eventEmitter.emit('sendEmail', subject, userExist, text)
                }
            })
            res.status(200).send({
                message: 'reset password Token sent to your email id'
            })
        }
    } catch (error) {
        throw error
    }
}


exports.updatePassword = async (req, res) => {
    /**
     * find token object present in Database
     */
    var userToken = await Token.findOne({
        token: req.params.token
    })
    /**
     * if user token Exist then find user Exist or Not through user id
     */
    if (userToken) {
        var user = await User.findOne({
            _id: userToken._userId
        })
        if (user) {
            await bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), null, async function (err, hash) {
                if (err) {
                    throw err
                }
                else {
                    user.password = hash
                }
            })
            user.save(function (err) {
                if (err) {
                    return res.status(500).send({
                        message: 'something went wrong'
                    })
                } else {
                    return res.status(200).send({
                        message: 'password reset successfully '
                    })
                }
            })

        } else {
            res.status(401).send({
                message: 'user does not exist'
            })
        }
    }
}