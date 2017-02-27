'use strict';

const request = require('superagent');

const proxyMethod = function () {

    if (!this.action){
        throw new Error('action missing from this.config');
    }

    if (!this.action.destinationUrl){
        throw new Error('destinationUrl missing from this.action');
    }

    if (!this.server){
        throw new Error('Expected a server object to be bound to "this"');
    }

    if (!this.server.request){
        throw new Error('request object missing from this.server');
    }

    if (!this.server.response){
        throw new Error('response object missing from this.server');
    }

    if (!this.server.response.rawResponse){
        throw new Error('rawResponse missing from this.server.response');
    }

    if (!this.server){
        throw new Error('Expected a config object to be bound to "this"');
    }

    if (!this.server.request.path){
        throw new Error('path missing from this.server.request');
    }

    if (!this.server.request.rawRequest){
        throw new Error('rawRequest missing from this.server.request');
    }


    //Will method be inside of this.config? Is this.config nested inside of routes?
    if (!this.server.request.method && !this.action.method){
        throw new Error('No HTTP method was defined');
    }

    const action = this.action;
    const requestDetails = this.server.request;
    const response = this.server.response;

    const headers = requestDetails.headers;
    const path = requestDetails.path;
    const rawRequest = requestDetails.rawRequest;
    const forwardingUrl = action.destinationUrl + path;
    let method = action.method || requestDetails.method;

    if (method === 'delete') {
        method = 'del';
    }

    const req = request[method](forwardingUrl);


    // if (headers){
    //     if (typeof headers !== 'object' || Array.isArray(headers)){
    //         throw new Error('Expected headers to be an object of key/value pairs');
    //     }
    //
    //     req = req.set(headers);
    // };

    // console.log('rawRequest: ', rawRequest);

    req.on('end', () => {
        console.log('req ended');
    });

    req.pipe(this.server.response.rawResponse);

    this.server.response.rawResponse.on('end', () => {
        console.log('resp ended');
    });

    rawRequest.pipe(req);
    // rawRequest.pipe(req, { end: false });

    // return (rawRequest.pipe(req, { end: false })).pipe(this.server.response.rawResponse);
};

module.exports = proxyMethod;
