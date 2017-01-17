const request = require('supertest');
const passportStub = require('passport-stub');

describe('When not authenticated', () => {
  let app;

  before(() => {
    app = require('./server');
  });

  it('returns 302 for /', done => {
    request(app)
      .get('/')
      .expect(302, done);
  });

  it('returns 302 for /callback', done => {
    request(app)
      .get('/callback')
      .expect(302, done);
  });

  it('returns 302 for /login', done => {
    request(app)
      .get('/login')
      .expect(302, done);
  });
});

describe('When authenticated', () => {
  let app;

  before(() => {
    app = require('./server');
    passportStub.install(app);

    passportStub.login({ username: 'test@example.org' });
  });

  it('returns expected content for /', done => {
    request(app)
      .get('/')
      .expect(200, done);
  });

  it('returns expected content for /2017/01/01/a-test-post.html', done => {
    request(app)
      .get('/2017/01/01/a-test-post.html')
      .expect(200, done);
  });
});
