// https://github.com/passport/express-4.x-openidconnect-example/blob/master/server.js

if (!process.env.SKIP_DOTENV_CONFIG) {
  require('dotenv').config();
}

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const express = require('express');
const passport = require('passport');
const OidcStrategy = require('passport-openidconnect').Strategy;

const port = process.env.port || 3000;
const publicUrls = process.env.PUBLIC_URLS
  ? process.env.PUBLIC_URLS.split(/\s*[,;]\s*/)
  : [];

// Begin serving a potential previous version of the site immediately
setTimeout(() => {
  const options = {};

  if (process.env.SILENT) {
    options.silent = true;
  }

  shell.exec('bundle exec jekyll build', options);
});

passport.use(new OidcStrategy({
  issuer: process.env.ISSUER,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  authorizationURL: process.env.AUTHORIZATION_URL,
  tokenURL: process.env.TOKEN_URL,
  userInfoURL: process.env.USER_INFO_URL,
  callbackURL: process.env.CALLBACK_URL,
  scope: 'openid profile email'
}, verify));

function verify(token, tokenSecret, profile, cb) {
  return cb(null, profile);
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const app = express();

if (process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

if (!process.env.SILENT) {
  app.use(require('morgan')('combined'));
}
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({
  cookie: {
    httpOnly: process.env.SESSION_COOKIE_ALLOW_JS_ACCESS === 'true' ? false : true,
    secure: process.env.EXPRESS_INSECURE === 'true' ? false : true
  },
  resave: true,
  saveUninitialized: true,
  secret: process.env.EXPRESS_SESSION_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('openidconnect'));

app.get('/callback', passport.authenticate('openidconnect'), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

// Reference: https://github.com/jaredhanson/connect-ensure-login/blob/cdb5769a3db7b8075b2ce90fab647f75f91b3c9a/lib/ensureLoggedIn.js
app.use((req, res, next) => {
  if (req.isAuthenticated() || publicUrls.some(u => u && new RegExp(`^${u}`, 'i').test(req.originalUrl))) {
    next();
  } else {
    if (req.session) {
      req.session.returnTo = req.originalUrl || req.url;
    }

    res.redirect('/login');
  }
});

app.use(express.static(path.join(__dirname, '_site')));

app.use((req, res) => {
  const http404FilePath = path.join(__dirname, '_site/404.html');

  fs.access(http404FilePath, fs.constants.F_OK, err => {
    if (err) {
      res.sendStatus(404);
    } else {
      res.status(404).sendFile(http404FilePath);
    }
  });
});

if (!process.env.EXPRESS_NO_LISTEN) {
  app.listen(port, () => {
    console.log(`Express listening on port ${port}`); // eslint-disable-line no-console
  });
}

module.exports = app;
