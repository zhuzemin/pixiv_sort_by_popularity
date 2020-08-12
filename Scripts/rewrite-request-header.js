/**
 * @fileoverview Example of HTTP rewrite of request header.
 *
 * @supported Quantumult X (v1.0.5-build188)
 *
 * [rewrite_local]
 * ^http://example\.com/resource9/ url script-request-header sample-rewrite-request-header.js
 */

// $request.scheme, $request.method, $request.url, $request.path, $request.headers

var modifiedHeaders = $request.headers;
modifiedHeaders['Key'] = 'whatever';

var modifiedPath = '/api2/abc?k=v';

var modifiedUrl='https://proud-surf-e590.zhuzemin.workers.dev/ajax/' +$request.url;
$done({url:modifiedUrl});
// $done({path : modifiedPath});
// $done({}); // Not changed.