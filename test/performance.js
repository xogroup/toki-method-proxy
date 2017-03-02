'use strict';

const expect = require('code').expect;   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

const Hapi = require('hapi');
const Promise = require('bluebird');

let mockSourceServer;
let mockDestinationServer;

const ProxyMethod = require('./../lib/implementation');

describe('performance benchmark', () => {

    lab.before((done) => {
        //Mocked forwarding destination server

        mockDestinationServer = new Hapi.Server({
            debug: false
        });

        mockDestinationServer.connection({
            port: 5002
        });

        const successHandler = (request, reply) => {
            //send back all the headers we got
            reply({
                content: 'foo',
                query: request.query,
                path: request.path
            });
        };

        mockDestinationServer.route({
            method : 'POST',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.start(done);
    });

    lab.after( (done) => {

        mockDestinationServer.stop(done);
    });

    lab.beforeEach( (done) => {
        //Mocked source server

        mockSourceServer = new Hapi.Server({
            debug: false
        });

        mockSourceServer.connection({
            port: 5003
        });

        mockSourceServer.start(done);
    });

    lab.afterEach( (done) => {

        mockSourceServer.stop(done);
    });

    it('should successfully proxy a 1000 requests', { timeout: 3000 }, () => {

        const context = {
            config: {
                destination: 'http://localhost:5002/success'
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

                return ProxyMethod.bind(context)();
            }
        });

        const requests = [];

        for (let i = 0; i < 1001; ++i) {
            requests.push('/test');
        }

        return Promise.reduce(requests, (prev, url) => {

            return mockSourceServer.inject({
                method: 'POST',
                url
            }).then((res) => {

                const payload = JSON.parse(res.payload);

                expect(res.statusCode).to.equal(200);
                expect(payload.content).to.equal('foo');
            });
        });

    });

});
