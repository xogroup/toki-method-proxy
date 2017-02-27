'use strict';

const expect = require('code').expect;   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

const Hapi         = require('hapi');
const Boom         = require('boom');
const fs           = require('fs');
const stream       = require('stream');
const proxyMethod  = require('../');
// const JwtAuth      = require('xo-jwt-auth');
// const jwtAuth      = new JwtAuth();

let mockTokiBridge;
let mockDestinationServer;
let rawMock;

//need to mock out xo-jwt-auth or just check that auth headers get passed?

//How to mock out the rawRequest with the stream.

describe('proxyMethod', () => {

    lab.before((done) => {

        //Mocked Toki Bridge server

        mockTokiBridge = new Hapi.Server({
            debug: false
        });

        mockTokiBridge.connection({
            port: 5000
        });

        //Mocked forwarding destination server

        mockDestinationServer = new Hapi.Server({
            debug: false
        });

        mockDestinationServer.connection({
            port: 5001
        });

        mockDestinationServer.route({
            method : 'POST',
            path   : '/test',
            handler: function (request, reply) {
                console.log('PAYLOAD::: ', request.payload);

                if (request.payload && request.payload.test === 'abc'){
                    console.log('before success reply');
                    reply('Success!');
                }
                else {
                    console.log('before boom');
                    reply(Boom.notFound('Missing'));
                }
            }
        });

        mockTokiBridge.start(() => {
            mockDestinationServer.start(done());
        });
    });

    lab.after((done) => {
        mockTokiBridge.stop(() => {
            mockDestinationServer.stop(done());
        });
    });

    it('checks to make sure proxyMethod is a function', (done) => {

        expect(proxyMethod).to.be.a.function();
        done();
    });

    it('should successfully proxy a basic POST request', () => {
        let rawRequest;
        let rawResponse;

        mockTokiBridge.route({
            method: 'POST',
            path: '/test',
            handler: function (request, reply) {

                rawRequest  = request.raw.req;
                rawResponse = request.raw.res;

                reply(true);
            }
        });

        const context = {
            action: {
                method: 'post',
                destinationUrl: 'http://localhost:5001'
            },
            server: {
                request: {
                    headers: {},
                    path: '/test',
                    rawRequest: null,
                    method: 'post'
                },
                response: {
                    rawResponse: null
                }
            }
        };

        return mockTokiBridge.inject({
            method : 'POST',
            url    : '/test',
            payload: {
                test: 'abc'
            }
        })
            .then(() => {
                context.server.request.rawRequest   = rawRequest;
                context.server.response.rawResponse = rawResponse;

                // console.log('rawResponse before: ', context.server.response.rawResponse);
            })
            .then(() => {
                const proxyRequest = proxyMethod.bind(context);

                return proxyRequest();
            })
            .then((data) => {
                console.log('rawResponse after ', context.server.response.rawResponse);
                console.log('data after ', data);

                expect(context.server.response.rawResponse).to.exist();
                expect(context.server.response.rawResponse.statusCode).to.equal(200);
                expect(context.server.response.rawResponse.statusMessage).to.equal('OK');
            })
            .catch((err) => {
                console.log('err: ', err);
            });
    });
});
