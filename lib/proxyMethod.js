'use strict';

const request = require('request');
// const Promise = require('bluebird');


const proxyMethod = function () {
    return new Promise((resolve, reject) => {
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

        // const headers = requestDetails.headers;
        const incomingRequest = requestDetails.rawRequest;
        const outgoingResponse = this.server.response.rawResponse;
        const path = requestDetails.path;
        const forwardingUrl = action.destinationUrl + path;
        let method = action.method || requestDetails.method;

        if (method === 'delete') {
            method = 'del';
        }

        incomingRequest.pipe(request
            [method](forwardingUrl)
            .on('data', (data) => {
                console.log(data);
            })
            .on('error', (error) => {
                console.log('ERROR ::: ', error);
                return reject(error);
            })
            .on('response', (response) => {
                console.log('RESPONSE::: ', response);
                return resolve(response);
            })
            .pipe(outgoingResponse)
        );

        // console.log('before req');
        // const proxyRequest = request['post']('http://localhost:5001/test');
        // // console.log(incomingRequest.pipe(proxyRequest));
        // // console.log(proxyRequest.pipe(outgoingResponse));
        //
        // // console.log('after req: ', proxyResponse)
        //
        // proxyRequest.on('close', () => {
        //     console.log('ENDED');
        // });
        //
        // incomingRequest.on('close', () => {
        //     console.log('ENDED')
        // });
        //
        // //proxyResponse.pipe(outgoingResponse)
        //
        // outgoingResponse.on('close', () => {
        //     console.log('ENDED');
        //     return resolve();
        // });
        //
        // outgoingResponse.on('error', (error) => {
        //     console.log('ENDED');
        //     return reject(error);
        // })
    });
};

module.exports = proxyMethod;
