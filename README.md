# toki-method-proxy <!-- Repo Name -->
> Drop in proxy to allow toki to play nicely with your existing infrastructure <!-- Repo Brief Description -->

<!-- Long Description -->
This is a toki method which allows blind proxying to an endpoint. It's designed to allow toki to drop in to an existing API infrastructure without disruption.

<!-- Maintainer (Hint, probably you) -->
Lead Maintainer: [Matt Phillips](https://github.com/mattcphillips)

<!-- Badges Go Here -->

<!-- Badge from https://badge.fury.io/ -->
<!-- Build Status from Travis -->
<!-- Security Scan from Snyk.io -->


<!-- End Badges -->
<!-- Quick Example -->
## Example
```Javascript
{
    name: "My proxy step",
    type: 'toki-method-proxy',
    destination: 'http://myexistingendpoint/path'
}
```

Query parameters and headers will be passed along to and from. The paths are currently fixed however.

<!-- Customize this if needed -->
<!-- I removed the example and API because this is silly simple - DH -->

<!-- Anything Else (Sponsors, Links, Etc) -->
