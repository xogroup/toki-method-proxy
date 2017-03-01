'use strict';

const Http = require('http');
const Url = require('url');

module.exports = function () {

    return new Promise( (resolve, reject) => {

        const config = this.config;
        const incomingRequest = this.server.request.rawRequest;
        const outgoingResponse = this.server.response.rawResponse;
        const incomingUrl = Url.parse(incomingRequest.url, true);

        const targetOptions = Url.parse(config.destination, true);
        targetOptions.method = incomingRequest.method;

        targetOptions.headers = incomingRequest.headers;

        //merge query
        Object.assign(targetOptions.query, incomingUrl.query);

        const destinationRequest = Http.request(targetOptions, (destinationResponse) => {

            outgoingResponse.statusCode = destinationResponse.statusCode;
            outgoingResponse.statusMessage = destinationResponse.statusMessage;

            const destinationHeaders = destinationResponse.rawHeaders;
            for (let i = 0; i < destinationHeaders.length; i += 2) {
                const headerName = destinationHeaders[i];
                const headerValue = destinationHeaders[i + 1];
                outgoingResponse.setHeader(headerName, headerValue);
            }

            destinationResponse.once('error', reject);
            destinationResponse.pipe(outgoingResponse, { end: true });
        });

        incomingRequest.pipe(destinationRequest, { end: true });

        outgoingResponse.once('end', resolve);
        incomingRequest.once('error', reject);
        outgoingResponse.once('error', reject);
        destinationRequest.once('error', reject);
    });
};
