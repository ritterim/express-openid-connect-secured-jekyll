const assert = require('assert');
const httpMocks = require('node-mocks-http');
const request = require('supertest');
const passportStub = require('passport-stub');
const requireUncached = require('require-uncached');
const sinon = require('sinon');

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
        const expectedStartsWith = `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid&state=`;

        assert.ok(res.headers.location.startsWith(expectedStartsWith),
          `The Location header of ${res.headers.location} does not start with ${expectedStartsWith}`);
      })
      .expect(302, done);
  });

  it('returns expected response for /login', done => {
    request(app)
      .get('/login')
      .expect(res => {
        const expectedStartsWith = `${process.env.AUTHORIZATION_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CALLBACK_URL)}&scope=openid%20openid&state=`;

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

describe('authenticateRequestsMiddleware: Unauthenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    process.env.PUBLIC_URLS = '/assets';

    app = requireUncached('./server');
  });

  it('should permit any url defined in process.env.PUBLIC_URLS', done => {
    app.authenticateRequestsMiddleware(
      httpMocks.createRequest({ method: 'GET', url: '/assets/main.css', isAuthenticated: () => false }),
      httpMocks.createResponse(),
      done);
  });

  it('should redirect to /login when browser not authenticated', done => {
    const res = httpMocks.createResponse();

    app.authenticateRequestsMiddleware(
      httpMocks.createRequest({ method: 'GET', url: '/', isAuthenticated: () => false }),
      res,
      () => { });

    assert.equal(res.statusCode, 302);
    done();
  });
});

describe('authenticateRequestsMiddleware: Authenticated', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    app = requireUncached('./server');
  });

  it('should call next', done => {
    app.authenticateRequestsMiddleware(
      httpMocks.createRequest({ isAuthenticated: () => true }),
      httpMocks.createResponse(),
      done);
  });
});

describe('authenticateRequestsMiddleware: Bearer tokens authentication enabled', () => {
  let app;
  let requestPackage;

  before(() => {
    requestPackage = require('request');

    setupTestEnvironment();

    process.env.TOKEN_VALIDATION_URL = 'https://example.org';

    app = requireUncached('./server');
  });

  afterEach(() => {
    requestPackage.post.restore();
  });

  it('should set req.user.sub for success response from Bearer token validation endpoint', done => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      headers: { Authorization: 'Bearer abc123' },
      isAuthenticated: () => false
    });

    sinon.stub(requestPackage, 'post').yields(null, { statusCode: 200 }, { sub: 'sub_value' });

    app.authenticateRequestsMiddleware(
      req,
      httpMocks.createResponse(),
      () => { });

    assert.equal(req.user.sub, 'sub_value');

    done();
  });

  it('should return 401 for non-success response from Bearer token validation endpoint', done => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      headers: { Authorization: 'Bearer abc123' },
      isAuthenticated: () => false
    });

    const res = httpMocks.createResponse();

    sinon.stub(requestPackage, 'post').yields(null, { statusCode: 400 });

    app.authenticateRequestsMiddleware(
      req,
      res,
      () => { });

    assert.equal(res.statusCode, 401);

    done();
  });
});

describe('authenticateRequestsMiddleware: Bearer token authentication not enabled', () => {
  let app;

  before(() => {
    setupTestEnvironment();

    process.env.TOKEN_VALIDATION_URL = null;

    app = requireUncached('./server');
  });

  it('should return 401 for any requests with Bearer token', done => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/',
      headers: { Authorization: 'Bearer abc123' },
      isAuthenticated: () => false
    });

    const res = httpMocks.createResponse();

    app.authenticateRequestsMiddleware(
      req,
      res,
      () => { });

    assert.equal(res.statusCode, 401);

    done();
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
  delete process.env.TOKEN_VALIDATION_URL;
}
