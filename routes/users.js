const bcrypt = require("bcrypt");
const router = require("express").Router()
const User = require("../models/User")
const Account = require("../models/Account")
const {verifyToken} = require("../middlewares")

router.post('/', async function (req, res) {

    // Validate password
    if (req.body.password === undefined || req.body.password.length < 8) {
        return res.status(400).send({error: 'Invalid password'});
    }

    // Hash the password
    req.body.password = await bcrypt.hash(req.body.password, 10)

    try {

        // Store user into database
        const user = await new User(req.body).save()

        // Create an account for the user
        await new Account({userId: user.id}).save()

    } catch (e) {

        // 409 Username already exists
        if (/E11000.*username.* dup key.*/.test(e.message)) {
            return res.status(409).send({error: 'Username already exists'})
        }

        // 400 Required parameter missing
        if (/User validation failed: .*: Path `.*` is required.*/.test(e.message)) {
            return res.status(400).send({error: e.message})
        }
        return res.status(500).send({error: e.message})
    }

    return res.status(201).send('');

})

router.get('/current', verifyToken, async function (req, res) {


    // Retrieve user data from database
    const user = await User.findOne({_id: req.userId})
    console.log(user)

    // Get user a account data
    const accounts = await Account.find({userId: req.userId})

    res.status(200).send({
        id: user.id,
        name: user.name,
        username: user.username,
        accounts: accounts
    })

})



module.exports = router