'use strict';

const request = require('superagent');

const proxyMethod = function () {

    if (!this.config.options){
        throw new Error('options missing from this.config')
    }

    if (!this.config.options.destinationUrl){
        throw new Error('destinationUrl missing from this.config.options')
    }

    if (!this.server){
        throw new Error('Expected a server object to be bound to "this"')
    }

    if (!this.server.request){
        throw new Error('request object missing from this.server')
    }

    if (!this.server.response){
        throw new Error('response object missing from this.server')
    }

    if (!this.server){
        throw new Error('Expected a config object to be bound to "this"')
    }

    if (!this.server.request.path){
        throw new Error('path missing from this.server.request')
    }

    if (!this.server.request.rawRequest){
        throw new Error('rawRequest missing from this.server.request')
    }


    //Will method be inside of this.config? Is this.config nested inside of routes?
    if (!this.server.request.method && !this.config.options.method){
        throw new Error('No HTTP method was defined')
    }

    const config = this.config;
    const requestDetails = this.server.request;
    const response = this.server.response;

    const headers = requestDetails.headers;
    // const query = requestDetails.query;
    // const params = requestDetails.params;
    const path = requestDetails.path;
    const rawRequest = requestDetails.rawRequest;
    const method = config.options.method || requestDetails.method;
    const forwardingUrl = config.options.destinationUrl + path;


    let req = request[method](forwardingUrl);

    //handleStream

    //Pass in method and an object of key/value pair headers

    if (headers){
        if (typeof headers !== 'object' || Array.isArray(headers)){
            throw new Error('Expected headers to be an object')
        }

        req = req.set(headers);
    };

    return req.end(function(err, res){
        if (err){
            console.log('errr: ', err)
            throw err;
        }

        return res
    });


    //return resposne




};

module.exports = proxyMethod;
