//read from env?    ]
require('dotenv').config();


const KEYS = {
    'googleOauth': {
        'clientID': process.env.clientID,
        'clientSecret': process.env.clientSecret,
        'callback': '/auth/google/redirect'
    },
    "session_key": "secret123"
}

module.exports = KEYS