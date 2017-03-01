'use strict';

const Http = require('http');
const Url = require('url');

module.exports = function () {

    return new Promise( (resolve, reject) => {

        const config = this.config;
        const incomingRequest = this.server.request.rawRequest;
        const outgoingResponse = this.server.response.rawResponse;

        const targetOptions = Url.parse(config.destination);
        targetOptions.method = incomingRequest.method;

        const destinationRequest = Http.request(targetOptions, (destinationResponse) => {

            destinationResponse.pipe(outgoingResponse, { end: true });
        });

        const destinationResponse = incomingRequest.pipe(destinationRequest, { end: true });

        outgoingResponse.once('end', resolve);
        incomingRequest.once('error', reject);
        outgoingResponse.once('error', reject);
        destinationRequest.once('error', reject);
        destinationResponse.once('error', reject);
    });
};
