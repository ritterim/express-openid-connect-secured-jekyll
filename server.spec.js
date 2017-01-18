const assert = require('assert');
const request = require('supertest');
const passportStub = require('passport-stub');

describe('When not authenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    app = require('./server');
  });

  it('returns expected response for /', done => {
    request(app)
      .get('/')
      .expect('Location', '/login')
      .expect('Found. Redirecting to /login')
      .expect(302, done);
  });

  it('returns expected response for a page that does not exist', done => {
    request(app)
      .get('/does-not-exist')
      .expect('Location', '/login')
      .expect('Found. Redirecting to /login')
      .expect(302, done);
  });

  it('returns expected response for /callback', done => {
    request(app)
      .get('/callback')
      .expect(res => {
        assert.ok(res.headers.location.startsWith(
          `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid%20profile%20email&state=`));
      })
      .expect(302, done);
  });

  it('returns expected response for /login', done => {
    request(app)
      .get('/login')
      .expect(res => {
        assert.ok(res.headers.location.startsWith(
          `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid%20profile%20email&state=`));
      })
      .expect(302, done);
  });
});

describe('When authenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    app = require('./server');
    passportStub.install(app);

    passportStub.login({ username: 'test@example.org' });
  });

  it('returns expected response for /', done => {
    request(app)
      .get('/')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('returns expected response for /2017/01/01/a-test-post.html', done => {
    request(app)
      .get('/2017/01/01/a-test-post.html')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('returns expected response for a page that does not exist', done => {
    request(app)
      .get('/does-not-exist')
      .expect('Content-Type', /text\/html/)
      .expect(404, done);
  });
});

function setupTestEnvironment() {
  process.env.ISSUER = 'https://example.org';
  process.env.AUTHORIZATION_URL = 'https://example.org/connect/authorize';
  process.env.TOKEN_URL = 'https://example.org/connect/token';
  process.env.USER_INFO_URL = 'https://example.org/connect/userinfo';
  process.env.CLIENT_ID = 'TestClient';
  process.env.CLIENT_SECRET = 'the_secret';
  process.env.CALLBACK_URL = 'https://example.com/callback';
  process.env.EXPRESS_SESSION_SECRET = 'abc123';
}
