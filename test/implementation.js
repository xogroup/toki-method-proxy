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
        //Mocked forwarding destination server

        mockDestinationServer = new Hapi.Server({
            debug: false
        });

        mockDestinationServer.connection({
            port: 5001
        });

        const successHandler = (request, reply) => {
            //send back all the headers we got
            const res = reply({
                content: 'foo',
                query: request.query,
                path: request.path
            });

            for (const header in request.headers) {
                if (header.indexOf('toki-') !== -1) {
                    res.header(header, request.headers[header]);
                }
            }
        };

        const errorHandler = (request, reply) => {

            return reply(Boom.implementationError('Awww crap'));
        };

        mockDestinationServer.route({
            method : 'GET',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.route({
            method : 'POST',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.route({
            method : 'PUT',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.route({
            method : 'DELETE',
            path   : '/success',
            handler: successHandler
        });

        mockDestinationServer.route({
            method : 'PATCH',
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
        //Mocked source server

        mockSourceServer = new Hapi.Server({
            debug: false
        });

        mockSourceServer.connection({
            port: 5000
        });

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

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'POST',
            url: '/test'
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
        });
    });

    it('should successfully pass along query params', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?bar=buz'
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

        return mockSourceServer.inject({
            method: 'POST',
            url: '/test'
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.bar).to.equal('buz');
        });
    });

    it('should successfully pass along headers', () => {

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

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'POST',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    // it.only('should successfully append a path', () => {
    //
    //     const context = {
    //         config: {
    //             destination: 'http://localhost:5001/?name=bob',
    //             joinPaths: true
    //         },
    //         server: {
    //             request: {
    //                 rawRequest: null
    //             },
    //             response: {
    //                 rawResponse: null
    //             }
    //         }
    //     };
    //
    //     mockSourceServer.route({
    //         method: 'GET',
    //         path: '/test/success',
    //         handler: (hapiReq, hapiRes) => {
    //
    //             context.server.request.rawRequest = hapiReq.raw.req;
    //             context.server.response.rawResponse = hapiReq.raw.res;
    //
    //             return ProxyMethod.bind(context)();
    //         }
    //     });
    //
    //     return mockSourceServer.inject({
    //         method: 'GET',
    //         url: '/test/success',
    //         headers: {
    //             'toki-test1': 'foobar',
    //             'toki-test2': 'knope'
    //         }
    //     }).then((res) => {
    //
    //         const payload = JSON.parse(res.payload);
    //
    //         expect(res.statusCode).to.equal(200);
    //         expect(payload.content).to.equal('foo');
    //         expect(payload.query.name).to.equal('bob');
    //         expect(res.headers['toki-test1']).to.equal('foobar');
    //         expect(res.headers['toki-test2']).to.equal('knope');
    //     });
    // });

    it('should successfully test GET', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?name=bob'
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
            method: 'GET',
            path: '/test',
            handler: (hapiReq, hapiRes) => {

                context.server.request.rawRequest = hapiReq.raw.req;
                context.server.response.rawResponse = hapiReq.raw.res;

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'GET',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.name).to.equal('bob');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    it('should successfully test POST', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?name=bob'
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

        return mockSourceServer.inject({
            method: 'POST',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.name).to.equal('bob');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    it('should successfully test PUT', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?name=bob'
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
            method: 'PUT',
            path: '/test',
            handler: (hapiReq, hapiRes) => {

                context.server.request.rawRequest = hapiReq.raw.req;
                context.server.response.rawResponse = hapiReq.raw.res;

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'PUT',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.name).to.equal('bob');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    it('should successfully test PATCH', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?name=bob'
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
            method: 'PATCH',
            path: '/test',
            handler: (hapiReq, hapiRes) => {

                context.server.request.rawRequest = hapiReq.raw.req;
                context.server.response.rawResponse = hapiReq.raw.res;

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'PATCH',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.name).to.equal('bob');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    it('should successfully test DELETE', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/success?name=bob'
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
            method: 'DELETE',
            path: '/test',
            handler: (hapiReq, hapiRes) => {

                context.server.request.rawRequest = hapiReq.raw.req;
                context.server.response.rawResponse = hapiReq.raw.res;

                return ProxyMethod.bind(context)();
            }
        });

        return mockSourceServer.inject({
            method: 'DELETE',
            url: '/test',
            headers: {
                'toki-test1': 'foobar',
                'toki-test2': 'knope'
            }
        }).then((res) => {

            const payload = JSON.parse(res.payload);

            expect(res.statusCode).to.equal(200);
            expect(payload.content).to.equal('foo');
            expect(payload.query.name).to.equal('bob');
            expect(res.headers['toki-test1']).to.equal('foobar');
            expect(res.headers['toki-test2']).to.equal('knope');
        });
    });

    it('should pass along errors when the remote throws an error', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/error'
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

            expect(res.statusCode).to.equal(500);
        });
    });

    it('should pass along 404 when the remote gives a 404', () => {

        const context = {
            config: {
                destination: 'http://localhost:5001/nope'
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

            expect(res.statusCode).to.equal(404);
        });
    });
});
