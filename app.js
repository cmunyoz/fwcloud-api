/**
 * FWCloud NET APP ENTRY POINT
 * 
 *
 * @module APP
 * 
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require("log4js");
//var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cors = require('cors');




var methodOverride = require('method-override');

// custom libraries
// routes
var route = require('./route');
// model
var Model = require('./model');


var app = express();


passport.use(new LocalStrategy(function (username, password, done) {
    new Model.User({username: username}).fetch().then(function (data) {
        var user = data;
        if (user === null) {
            return done(null, false, {message: 'Invalid username or password'});
        } else {
            user = data.toJSON();
            // Generate a salt
            var salt = bcrypt.genSaltSync(10);
            // Hash the password with the salt
            var hash = bcrypt.hashSync(password, salt);

            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, {message: 'Invalid username or password'});
            } else {
                return done(null, user);
            }
        }
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    new Model.User({username: username}).fetch().then(function (user) {
        done(null, user);
    });
});


//configuración para ejs
app.set('views', path.join(__dirname, 'views'));
app.engine("html", require("ejs").renderFile);
app.set('view engine', 'html');

//configuración para Logger and morgan


var logger = log4js.getLogger('app');


app.use(log4js.connectLogger(log4js.getLogger("http"), {level: 'auto'}));

//var http_logger = log4js.getLogger('http');

//var theHTTPLog = morgan({
//  "format": "default",
//  "stream": {
//    write: function(str) { http_logger.debug(str); }
//  }
//});
//
//app.use(morgan('dev'));

//app.use(theHTTPLog);




// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));



//configuramos methodOverride
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var whitelist = [undefined, 'undefined', 'null','http://localhost:4200', 'http://webtest.fwcloud.net', 'http://webtest-out.fwcloud.net:8080'];
var corsOptions = {
    origin: function (origin, callback) {
        logger.debug("ORIGIN: " + origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));


logger.debug("\n\n-------------- INIT FWCLOUD.NET API REST -----------------");

app.use(function (req, res, next) {
    logger.debug("---------------- RECEIVED HEADERS-----------------");
    logger.debug(req.headers);
    logger.debug("--------------------------------------------------");
    next();
});

var db = require('./db');


app.use(session({secret: 'La nieve cae blanca', cookie: {maxAge: 60000}, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());


// GET
app.get('/', route.index);

// signin
// GET
app.get('/signin', route.signIn);
// POST
app.post('/signin', route.signInPost);

// signup
// GET
app.get('/signup', route.signUp);
// POST
app.post('/signup', route.signUpPost);

// logout
// GET
app.get('/signout', route.signOut);

//CONTROL de LOGIN



//var routes = require('./routes/index');
var users = require('./routes/user/users');
var user__firewalls = require('./routes/user/user__firewalls');
var customers = require('./routes/user/customers');
var clusters = require('./routes/firewall/clusters');
var firewalls = require('./routes/firewall/firewalls');
var fwclouds = require('./routes/fwcloud/fwclouds');
var routing_gs = require('./routes/routing/routing_gs');
var routing_rs = require('./routes/routing/routing_rs');
var interfaces = require('./routes/interface/interfaces');
var policy_gs = require('./routes/policy/policy_gs');
var policy_rs = require('./routes/policy/policy_rs');
var policy_types = require('./routes/policy/policy_types');
var ipobj_gs = require('./routes/ipobj/ipobj_gs');
var ipobjs = require('./routes/ipobj/ipobjs');
var ipobj__ipobjgs = require('./routes/ipobj/ipobj__ipobjgs');
var ipobj_types = require('./routes/ipobj/ipobj_types');
var policy_r__ipobjs = require('./routes/policy/policy_r__ipobjs');
var routing_r__ipobjs = require('./routes/routing/routing_r__ipobjs');
var policy_r__interfaces = require('./routes/policy/policy_r__interfaces');
var routing_r__interfaces = require('./routes/routing/routing_r__interfaces');
var interface__ipobjs = require('./routes/interface/interface__ipobjs');
var ipobj_type__policy_positions = require('./routes/ipobj/ipobj_type__policy_positions');
var ipobj_type__routing_positions = require('./routes/ipobj/ipobj_type__routing_positions');
var policy_positions = require('./routes/policy/policy_positions');
var fwc_tree = require('./routes/tree/fwc_tree');
var policy_compile = require('./routes/policy/compile');
var policy_install = require('./routes/policy/install');
var ipobj_protocols = require('./routes/ipobj/ipobj_protocols');

var importxml = require('./routes../../utils/importxml');
app.use('/importxml', importxml);

//app.use('/', routes);
app.use('/users', users);
app.use('/user__firewalls', user__firewalls);
app.use('/customers', customers);
app.use('/clusters', clusters);
app.use('/firewalls', firewalls);
app.use('/fwclouds', fwclouds);
app.use('/policy-gs', policy_gs);
app.use('/policy-rs', policy_rs);
app.use('/policy-types', policy_types);
app.use('/policy-r__ipobjs', policy_r__ipobjs);
app.use('/policy-r__interfaces', policy_r__interfaces);
app.use('/policy-positions', policy_positions);
app.use('/policy/compile', policy_compile);
app.use('/policy/install', policy_install);
app.use('/routing-gs', routing_gs);
app.use('/routing-rs', routing_rs);
app.use('/routing-r__ipobjs', routing_r__ipobjs);
app.use('/routing-r__interfaces', routing_r__interfaces);
app.use('/ipobj-gs', ipobj_gs);
app.use('/ipobj__ipobjgs', ipobj__ipobjgs);
app.use('/ipobjs', ipobjs);
app.use('/ipobj-types', ipobj_types);
app.use('/ipobj-types__policy_positions', ipobj_type__policy_positions);
app.use('/ipobj-types__routing_positions', ipobj_type__routing_positions);
app.use('/ipobj-protocols', ipobj_protocols);
app.use('/interfaces', interfaces);
app.use('/interface__ipobjs', interface__ipobjs);

app.use('/fwc-tree', fwc_tree);


var dbconf=process.argv[2] || "dblocal";

// Connect to MySQL on start
db.connect(dbconf, function (err) {
    if (err) {
        console.log('Unable to connect to MySQL.');
        process.exit(1);
    }
});


//Interval control for unlock FWCLouds 
var FwcloudModel = require('./models/fwcloud/fwcloud');
var config = require('./config/apiconf.json');

const intervalObj = setInterval(() => {    
    FwcloudModel.checkFwcloudLockTimeout(config.lock.unlock_timeout_min)
            .then(result =>{logger.debug("OK CHECKLOCK: " + result);})
            .catch(result =>{});
}, config.lock.check_interval_mls);



// error handlers

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        logger.error("Something went wrong: ", err.message);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    logger.error("Something went wrong: ", err.message);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});




module.exports = app;

