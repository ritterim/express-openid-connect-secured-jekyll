// https://github.com/passport/express-4.x-openidconnect-example/blob/master/server.js

require('dotenv-safe').load();

const path = require('path');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const shell = require('shelljs');
const express = require('express');
const passport = require('passport');
const OidcStrategy = require('passport-openidconnect').Strategy;

const port = process.env.port || 3000;

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

if (!process.env.SILENT) {
  app.use(require('morgan')('combined'));
}
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: process.env.EXPRESS_SESSION_SECRET, resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('openidconnect'));

app.get('/callback', passport.authenticate('openidconnect'), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

app.use(ensureLoggedIn(), express.static(path.join(__dirname, '_site')));

if (!process.env.EXPRESS_NO_LISTEN) {
  app.listen(port, () => {
    console.log(`Express listening on port ${port}`);
  });
}

module.exports = app;
