// These tests, unlike others, require mocking of requests and responses.
// Because this header should only be set for HTTPS and that's hard to
// reliably determine, heuristics are used.

var helmet = require('../');

var assert = require('assert');
var sinon = require('sinon');

describe('hsts', function () {

    var maxAge = 7776000000; // 90 days in milliseconds
    var defaultHeader = 'max-age=' + (maxAge / 1000);

    var handler, req, res, next;
    beforeEach(function () {
        handler = helmet.hsts({ maxAge: maxAge });
        req = {};
        res = { setHeader: sinon.spy() };
        next = sinon.spy();
    });

    it('throws an error with invalid parameters', function () {
        function test(value) {
            assert.throws(function () {
                helmet.hsts(value);
            }, Error);
        }
        test();
        test(undefined);
        test(null);
        test('1234');
        test(1234);
        test(1234, true);
        test({});
        test({ includeSubdomains: true });
        test({ force: true });
        test({ maxAge: '123' });
        test({ maxAge: true });
        test({ setIf: 123 });
        test({ setIf: true });
        test({ setIf: function() {}, force: true });
    });

    it('is unset if req.secure is false', function () {
        req.secure = false;
        handler(req, res, next);
        assert(!res.setHeader.called);
    });

    it('is set if req.secure is true', function () {
        req.secure = true;
        handler(req, res, next);
        assert(res.setHeader.calledWith('Strict-Transport-Security', defaultHeader));
    });

    it('is always set if forced', function () {
        handler = helmet.hsts({ maxAge: maxAge, force: true });
        req.secure = false;
        handler(req, res, next);
        assert(res.setHeader.calledWith('Strict-Transport-Security', defaultHeader));
    });

    it('rounds down properly', function () {
        req.secure = true;
        handler = helmet.hsts({ maxAge: 1400 });
        handler(req, res, next);
        assert(res.setHeader.calledWith('Strict-Transport-Security', 'max-age=1'));
    });

    it('rounds up properly', function () {
        req.secure = true;
        handler = helmet.hsts({ maxAge: 600 });
        handler(req, res, next);
        assert(res.setHeader.calledWith('Strict-Transport-Security', 'max-age=1'));
    });

    it('can include subdomains', function () {
        var expectedHeader = defaultHeader + '; includeSubdomains';
        req.secure = true;
        handler = helmet.hsts({ maxAge: maxAge, includeSubdomains: true });
        handler(req, res, next);
        assert(res.setHeader.calledWith('Strict-Transport-Security', expectedHeader));
    });

    it('lets you decide whether it should be set', function () {
        handler = helmet.hsts({
            maxAge: maxAge,
            setIf: function(req, res) {
                return req.pleaseSet;
            }
        });
        handler(req, res, next);
        req.pleaseSet = true;
        handler(req, res, next);
        assert(res.setHeader.calledOnce);
    });

});
