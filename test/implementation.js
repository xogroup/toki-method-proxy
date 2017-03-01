'use strict';

const expect = require('code').expect;   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

const Hapi         = require('hapi');
const Boom         = require('boom');

let mockSourceServer;
let mockDestinationServer;

const ProxyMethod = require('./../lib/implementation');

describe('proxyMethod', () => {

    lab.before((done) => {

        //Mocked source server

        mockSourceServer = new Hapi.Server({
            debug: false
        });

        mockSourceServer.connection({
            port: 5000
        });

        //Mocked forwarding destination server

        mockDestinationServer = new Hapi.Server({
            debug: false
        });

        mockDestinationServer.connection({
            port: 5001
        });

        const successHandler = (request, reply) => {

            return reply('foo');
        };

        const errorHandler = (request, reply) => {

            return reply(new Boom.implementationError());
        };

        mockDestinationServer.route({
            method : 'POST',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.route({
            method : 'POST',
            path   : '/error',
            handler: errorHandler
        });

        mockDestinationServer.start(done);
    });

    lab.beforeEach( (done) => {

        mockSourceServer.start(done);
    });

    lab.afterEach( (done) => {

        mockSourceServer.stop(done);
    });

    it('checks to make sure proxyMethod is a function', (done) => {

        expect(ProxyMethod).to.be.a.function();
        done();
    });

    it('should successfully proxy a basic POST request', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success'
            },
            server: {
                request: {
                    rawRequest: null
                },
                response: {
                    rawResponse: null
                }
            }
        };

        mockSourceServer.route({
            method: 'POST',
            path: '/test',
            handler: (hapiReq, hapiRes) => {

                context.server.request.rawRequest = hapiReq.raw.req;
                context.server.response.rawResponse = hapiReq.raw.res;

                ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'POST',
            url: '/test'
        }).then((res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.equal('foo');
        });
    });
});
