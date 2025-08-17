import { validateCreateRequest, validateQikCode, validateDeletionCode } from '../src/middlewares/validation.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

// Minimal mock req/res
function mockReq(body = {}, params = {}, ip='127.0.0.1') { return { body, params, ip }; }
function mockRes() {
  const res = { statusCode: 200 };
  res.status = code => { res.statusCode = code; return res; };
  res.json = payload => { res.payload = payload; return res; };
  res.redirect = (code, url) => { res.statusCode = code; res.location = url; return res; };
  return res;
}
function mockNext() { let called = false; return () => called = true; }

describe('validation middlewares', () => {
  test('validateCreateRequest passes valid body', () => {
    const req = mockReq({ long_url: 'https://example.com' });
    const res = mockRes();
    const next = mockNext();
    validateCreateRequest(req, res, next);
    expect(res.statusCode).toBe(200); // Should not have changed
  });

  test('validateCreateRequest rejects invalid url', () => {
    const req = mockReq({ long_url: 'bad' });
    const res = mockRes();
    const next = mockNext();
    validateCreateRequest(req, res, next);
    expect(res.statusCode).toBe(400);
  });

  test('validateQikCode rejects too short', () => {
    const req = mockReq({}, { qik_code: 'abc' });
    const res = mockRes();
    const next = mockNext();
    validateQikCode(req, res, next);
    expect(res.statusCode).toBe(404);
  });

  test('validateDeletionCode rejects invalid', () => {
    const req = mockReq({}, { deletion_code: 'short' });
    const res = mockRes();
    const next = mockNext();
    validateDeletionCode(req, res, next);
    expect(res.statusCode).toBe(401);
  });
});

describe('errorHandler', () => {
  test('maps known status', () => {
    const err = new Error('Short URL not found or expired.');
    err.status = 404;
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.payload.error).toMatch(/not found/i);
  });
});
