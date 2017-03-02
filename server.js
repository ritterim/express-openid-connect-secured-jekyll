// https://github.com/passport/express-4.x-openidconnect-example/blob/master/server.js

/* eslint-disable no-console */

if (!process.env.SKIP_DOTENV_CONFIG) {
  require('dotenv').config();
}

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const express = require('express');
const NodeCache = require('node-cache');
const passport = require('passport');
const OidcStrategy = require('passport-openidconnect').Strategy;
const request = require('request');

const memoryCache = new NodeCache();
const tokenCacheLifetimeSeconds = process.env.TOKEN_CACHE_SECONDS || 60 * 60; // Default: 1 hour in seconds
const port = process.env.port || 3000;
const publicUrls = process.env.PUBLIC_URLS
  ? process.env.PUBLIC_URLS.split(/\s*[,;]\s*/).map(x => x.trim())
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
  scope: 'openid'
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

// Reference: https://github.com/jaredhanson/connect-ensure-login/blob/cdb5769a3db7b8075b2ce90fab647f75f91b3c9a/lib/ensureLoggedIn.js
app.authenticateRequestsMiddleware = function(req, res, next) {
  if (publicUrls.some(u => u && new RegExp(`^${u}`, 'i').test(req.originalUrl))) {
    next();
  } else if (req.headers.authorization && /bearer/i.test(req.headers.authorization)) {
    const token = req.headers.authorization.split(' ')[1];

    if (token && process.env.TOKEN_VALIDATION_URL) {
      const userFromCache = memoryCache.get(token);
      if (userFromCache) {
        req.user = userFromCache;
        next();
      } else {
        request.post({
          url: process.env.TOKEN_VALIDATION_URL,
          form: { token: token }
        }, (tokenErr, tokenRes, tokenBody) => {
          if (tokenErr || tokenRes.statusCode >= 300) {
            res.sendStatus(401);
          } else if (tokenBody.sub) {
            req.user = { sub: tokenBody.sub };
            memoryCache.set(token, req.user, tokenCacheLifetimeSeconds);
            next();
          } else {
            res.sendStatus(401);
          }
        });
      }
    } else {
      res.sendStatus(401);
    }
  } else {
    if (req.isAuthenticated()) {
      next();
    } else {
      if (req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }

      res.redirect('/login');
    }
  }
};

if (process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

if (!process.env.SILENT) {
  app.use(require('morgan')('combined'));
}
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
  if (process.env.SET_BEARER_TOKEN_COOKIE_FOR_JAVASCRIPT) {
    if (!process.env.CLIENT_CREDENTIALS_SCOPE) {
      console.error('process.env.CLIENT_CREDENTIALS_SCOPE must be set.');
      res.redirect(req.session.returnTo || '/');
    } else {
      const bearerTokenCookieName = process.env.BEARER_TOKEN_COOKIE_NAME || 'token';

      request.post({
        url: process.env.TOKEN_URL,
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')}`
        },
        form: {
          grant_type: 'client_credentials',
          scope: process.env.CLIENT_CREDENTIALS_SCOPE,
        },
      }, (tokenErr, tokenRes, tokenBody) => {
        if (tokenErr) {
          console.log('tokenErr:', tokenErr);
        }

        if (tokenErr || tokenRes.statusCode >= 400) {
          // Allow static HTML pages to load if there is a failure
          console.warn(`Unable to set ${bearerTokenCookieName} cookie due to failure retrieving token for req.user.id: '${req.user.id}'. tokenBody: ${tokenBody}`);
        } else {
          res.cookie(bearerTokenCookieName, JSON.parse(tokenBody).access_token, {
            httpOnly: false,
            secure: process.env.EXPRESS_INSECURE === 'true' ? false : true
          });
        }

        res.redirect(req.session.returnTo || '/');
      });
    }
  } else {
    res.redirect(req.session.returnTo || '/');
  }
});

app.use(app.authenticateRequestsMiddleware);

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
    console.log(`Express listening on port ${port}`);
  });
}

module.exports = app;
