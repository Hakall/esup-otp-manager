var express = require('express');
var router = express.Router();
var request = require('request');
var properties = require(__dirname+'/../properties/properties');
var utils = require(__dirname+'/../services/utils');

var passport;

function requesting(req, res, opts) {
    console.log("requesting api");
    //console.log(opts.method +':'+ opts.url);
    //console.log(req.session.passport);
    request(opts, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var infos = JSON.parse(body);
            if(req.session.passport.user.uid)infos.uid = req.session.passport.user.uid;
            infos.api_url = properties.esup.api_url;
            //console.log(infos)
            res.send(infos);
        } else res.send({
            "code": "Error",
            "message": error
        });
    });
}

function isAuthenticated(req, res) {
    if (req.session.passport) {
        if (req.session.passport.user) {
            return true;
        }
    }
    return false;
}

function isUser(req, res, next) {
    if (isAuthenticated(req, res)) return next();
    res.redirect('/login');
}

function isManager(req, res, next) {
    if (isAuthenticated(req, res)) {
        if (utils.is_manager(req.session.passport.user.uid) || utils.is_admin(req.session.passport.user.uid))return next();
        res.redirect('/forbidden');
    }
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (isAuthenticated(req, res)) {
        if(utils.is_admin(req.session.passport.user.uid))return next();
        res.redirect('/forbidden');
    }
    res.redirect('/login');
}

function routing() {
    router.get('/', function(req, res) {
        res.render('index', {
            title: 'Esup Otp Manager',
            messages : properties.messages
        });
    });

    router.get('/forbidden', isUser, function(req, res) {
        res.render('forbidden', {
            title: 'Esup Otp Manager',
            user: req.session.passport.user
        });
    });

    router.get('/preferences', isUser, function(req, res) {
        var right = "user";
        if (utils.is_manager(req.session.passport.user.uid))right = "manager";
        if (utils.is_admin(req.session.passport.user.uid))right = "admin";
        res.render('dashboard', {
            title: 'Esup Otp Manager : Test',
            user: req.session.passport.user,
            right : right
        });
    });

    router.get('/login', function(req, res, next) {
        passport.authenticate('cas', function(err, user, info) {
            if (err) {
                console.log(err);
                return next(err);
            }

            if (!user) {
                console.log(info.message);
                return res.redirect('/');
            }

            req.logIn(user, function(err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                req.session.messages = '';
                return res.redirect('/preferences');
            });
        })(req, res, next);
    });

    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect(properties.esup.CAS.ssoBaseURL+'/logout');
    });

    //API
    router.get('/api/user', isUser, function(req, res) {
        var opts = {};
        opts.url = properties.esup.api_url+'users/' + req.session.passport.user.uid + '/' + utils.get_hash(req.session.passport.user.uid);
        requesting(req, res, opts);
    });

    router.get('/api/messages', isUser, function(req, res) {
        var languages = req.acceptsLanguages();
        for(language in languages){
            switch (languages[language]){
                case "fr":
                case "fr-FR": res.json(require("../properties/messages_fr.json"));break;
                case "en":
                case "en-US": res.json(require("../properties/messages_en.json")); break;
                default : res.json(require("../properties/messages.json")); break;
            }
        }
    });

    router.get('/api/messages/:language', isUser, function(req, res) {
            switch (req.params.language){
                case "français": res.json(require("../properties/messages_fr.json"));break;
                case "english": res.json(require("../properties/messages_en.json")); break;
                default : res.json(require("../properties/messages.json")); break;
            }
    });

    router.get('/api/transport/:transport/test', isUser, function(req, res) {
        var opts = {};
        opts.url = properties.esup.api_url+'protected/users/' + req.session.passport.user.uid + '/transports/'+ req.params.transport+'/test/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.get('/api/methods', isUser, function(req, res) {
        var opts = {};
        opts.url = properties.esup.api_url+'protected/methods/' + properties.esup.api_password
        requesting(req, res, opts);
    });

    router.get('/api/secret/:method', isUser, function(req, res) {
        var opts = {};
        opts.url = properties.esup.api_url+'protected/users/'+req.session.passport.user.uid+'/methods/'+req.params.method+'/secret/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/:method/activate', isUser, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'protected/users/'+req.session.passport.user.uid+'/methods/'+req.params.method+'/activate/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/:method/deactivate', isUser, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'protected/users/'+req.session.passport.user.uid+'/methods/'+req.params.method+'/deactivate/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/transport/:transport/:new_transport', isUser, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'protected/users/'+req.session.passport.user.uid+'/transports/'+req.params.transport+'/'+req.params.new_transport+'/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.delete('/api/transport/:transport', isUser, function(req, res) {
        var opts = {};
        opts.method = 'DELETE';
        opts.url = properties.esup.api_url+'protected/users/'+req.session.passport.user.uid+'/transports/'+req.params.transport+'/'+ properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.post('/api/generate/:method', isUser, function(req, res) {
        var opts = {};
        opts.method = 'POST';
        opts.url = properties.esup.api_url+'protected/users/'+ req.session.passport.user.uid + '/methods/' + req.params.method + '/secret/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.get('/api/admin/users', isManager, function(req, res) {
        var opts={};
        opts.url = properties.esup.api_url + 'admin/users/' + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.get('/api/admin/user/:uid', isManager, function(req, res) {
        var opts = {};
        opts.url = properties.esup.api_url+'admin/users/' + req.params.uid + '/' + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:uid/:method/activate', isManager, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'protected/users/'+ req.params.uid + '/methods/' + req.params.method + '/activate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:uid/:method/deactivate', isManager, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'protected/users/'+ req.params.uid + '/methods/' + req.params.method + '/deactivate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:method/activate', isAdmin, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'admin/methods/' + req.params.method + '/activate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:method/deactivate', isAdmin, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'admin/methods/' + req.params.method + '/deactivate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:method/transport/:transport/activate', isAdmin, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'admin/methods/' + req.params.method + '/transports/'+req.params.transport+'/activate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.put('/api/admin/:method/transport/:transport/deactivate', isAdmin, function(req, res) {
        var opts = {};
        opts.method = 'PUT';
        opts.url = properties.esup.api_url+'admin/methods/' + req.params.method + '/transports/'+req.params.transport+'/deactivate/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.post('/api/admin/generate/:method/:uid', isManager, function(req, res) {
        var opts = {};
        opts.method = 'POST';
        opts.url = properties.esup.api_url+'protected/users/'+ req.params.uid + '/methods/' + req.params.method + '/secret/'  + properties.esup.api_password;
        requesting(req, res, opts);
    });

    router.delete('/api/admin/delete_method_secret/:method/:uid', isManager, function(req, res) {
        var opts = {};
        opts.method = 'DELETE';
        opts.url = properties.esup.api_url+'admin/users/'+req.params.uid +'/methods/' + req.params.method+ '/secret/' + properties.esup.api_password;
        requesting(req, res, opts);
    });
}

module.exports = function(_passport) {
    passport = _passport;

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        var _user = {};
        _user.uid=user.uid;
        if(utils.is_admin(user.uid))_user.role="admin";
        else if(utils.is_manager(user.uid))_user.role="manager";
        else _user.role="user";
        done(null, _user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(user, done) {
            done(null, user);
    });

    passport.use(new(require('passport-cas').Strategy)(properties.esup.CAS, function(login, done) {
        return done(null, {uid:login});
    }));

    routing();

    return router
};