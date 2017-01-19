const assert = require('assert');
const request = require('supertest');
const passportStub = require('passport-stub');
const requireUncached = require('require-uncached');

describe('When not authenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    app = requireUncached('./server');
  });

  it('returns expected response for /', done => {
    request(app)
      .get('/')
      .expect('Location', '/login')
      .expect('Found. Redirecting to /login')
      .expect(302, done);
  });

  it('returns expected response for /2017/01/01/a-test-post.html', done => {
    request(app)
      .get('/2017/01/01/a-test-post.html')
      .expect('Location', '/login')
      .expect('Found. Redirecting to /login')
      .expect(302, done);
  });

  it('returns expected response for /assets/main.css', done => {
    request(app)
      .get('/assets/main.css')
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
        const expectedStartsWith = `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid%20profile%20email&state=`;

        assert.ok(res.headers.location.startsWith(expectedStartsWith),
          `The Location header of ${res.headers.location} does not start with ${expectedStartsWith}`);
      })
      .expect(302, done);
  });

  it('returns expected response for /login', done => {
    request(app)
      .get('/login')
      .expect(res => {
        const expectedStartsWith = `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid%20profile%20email&state=`;

        assert.ok(res.headers.location.startsWith(expectedStartsWith),
          `The Location header of ${res.headers.location} does not start with ${expectedStartsWith}`);
      })
      .expect(302, done);
  });
});

describe('When not authenticated: process.env.PUBLIC_URLS tests', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    process.env.PUBLIC_URLS = '/2017/01/01/a-test-post.html;/assets';

    app = requireUncached('./server');
  });

  it('returns expected response for /2017/01/01/a-test-post.html when url is in process.env.PUBLIC_URLS', done => {
    request(app)
      .get('/2017/01/01/a-test-post.html')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('returns expected response for /assets/main.css when url is in process.env.PUBLIC_URLS', done => {
    request(app)
      .get('/assets/main.css')
      .expect('Content-Type', /text\/css/)
      .expect(200, done);
  });

  it('returns expected response for /ASSETS/MAIN.CSS when url is in process.env.PUBLIC_URLS', done => {
    request(app)
      .get('/ASSETS/MAIN.CSS')
      .expect('Content-Type', /text\/css/)
      .expect(200, done);
  });
});

describe('When authenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    app = requireUncached('./server');
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

  it('returns expected response for /assets/main.css', done => {
    request(app)
      .get('/assets/main.css')
      .expect('Content-Type', /text\/css/)
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

  delete process.env.PUBLIC_URLS;
}
