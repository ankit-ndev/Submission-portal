"use strict";

// for declaring environment variables
require('dotenv').config();

// some of the dependencies use nconf therefore define this in starting
require("./config").loadConfig();

//dependencies
const express        = require("express");
const app            = express();
const cookieParser   = require('cookie-parser');
const session        = require("express-session");
const logger         = require("morgan");
const FSStore  	     = require('./js/session')({ session });
const bodyParser     = require("body-parser");
const nconf          = require("nconf");
const MongoDb        = require("./database/mongo");

app.set('etag', false);
app.use(cookieParser());

//Remove console in production environment
const override_console = nconf.get("override_console") || false;
console.log1 = console.log;
if (override_console) console.log = ()=> {};

// connect with mongodb
MongoDb.connect()
    .then(()=> { console.log1(`Connected to mongodb successfully`) })
    .catch(err=> { console.log1(`Error while connecting to database`) });

// to log all request
const env = nconf.get("environment");
if (env !== "test") app.use(logger('dev'));

app.use("/api", express.static(__dirname + '/storage'));
app.use(express.static(__dirname + '/build'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

//parse application/json
app.use(bodyParser.json());

app.use((req, res, callback)=> {
    if(req.headers.origin) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Secure");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    callback()
});

app.use(session({
    key: 'sessionid',
    secret: 'aersda@#$32sfas2342',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    store: new FSStore({ path: __dirname + '/tmp/sessions', reapInterval: -1 })
}));


require("./routes")(app);

app.use((err, req, res, next) => {
    let code = err.status || 500;
    res.status(code);
    res.json({ code: code, status: 'ERR', error: { error: err.message }})
});


const port = nconf.get("port");

let server = app.listen(port, ()=> {
    console.log1(`Express server listening on port ${server.address().port}`);
});

module.exports = app;
