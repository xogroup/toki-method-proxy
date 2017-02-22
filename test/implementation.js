'use strict';

const expect = require('code').expect;   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

const Hapi         = require('hapi');
const Boom         = require('boom');
const fs           = require('fs');
const proxyMethod = require('../');
// const JwtAuth      = require('xo-jwt-auth');
// const jwtAuth      = new JwtAuth();

//need to mock out xo-jwt-auth or just check that auth headers get passed?

//How to mock out the rawRequest with the stream.

const requestHandlerWithOptions = function (request, reply) {
    let basicResponse = {
            success: true
        },
        queryParams   = Object.keys(request.query);

    if (request.headers.authorization) {
        if (request.headers.authorization === 'Basic bXlVc2VyTmFtZTpteVBhc3N3b3Jk' || request.headers.authorization === 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQxMjM0NTY3OCJ9.3LehD6KeFqV97-i6267qs-bH6owueCcyZXwrb9eFrZU') {
            if (request.payload) {
                request.payload.authorized = true;
            }
            else {
                basicResponse.authorized = true;
            }
        }
        else {
            return reply(Boom.unauthorized());
        }
    }

    if (request.headers.otherheader || request.headers['membership-session-token']) {
        if (request.payload) {
            request.payload.otherHeader = request.headers.otherheader || false;
            request.payload['membership-session-token'] = request.headers['membership-session-token'] || false;
        }
        else {
            basicResponse.otherHeader = request.headers.otherheader || false;
            basicResponse['membership-session-token'] = request.headers['membership-session-token'] || false;
        }
    }

    if (queryParams.length) {
        queryParams.forEach((queryParam) => {
            basicResponse[queryParam] = request.query[queryParam];
        });
    }

    if (request.payload && request.payload.failThis) {
        return reply(Boom.badRequest());
    }

    return request.payload ? reply(request.payload) : reply(basicResponse);
};

describe('proxyMethod', () => {

    lab.before((done) => {
        let server = new Hapi.Server({
            debug: false
        });

        server.connection({
            port: 3000
        });

        server.route({
            method: [
                'GET',
                'POST',
                'PUT',
                'DELETE'
            ],
            path   : '/real',
            handler: requestHandlerWithOptions
        });

        server.route({
            method : 'GET',
            path   : '/test',
            handler: function(request, reply) {
                return reply('success');
            }
        });

        server.start(done())
    });

    it('checks to make sure proxyMethod is an object', (done) => {

        console.log('proxyMethod: ', proxyMethod);

        expect(proxyMethod).to.be.a.object();
        expect(proxyMethod).to.include('proxyRequest');
        done();
    });

    it('should successfully proxy a basic GET request', (done) => {

        const context = {
            config: {
                options: {
                    method: 'get',
                    destinationUrl: 'localhost:3000'
                }
            },
            server: {
                request: {
                    headers: {},
                    path: '/test',
                    rawRequest: {},
                    method: 'get'
                },
                response: {}
            }
        };

        const proxyRequest = proxyMethod.proxyRequest.bind(context);

        console.log('proxyRequest()::: ', Object.keys(proxyRequest()));

        expect(proxyRequest()).to.be.a.object();
        done();
    });
});
