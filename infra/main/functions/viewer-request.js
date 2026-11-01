// CloudFront viewer-request function (cloudfront-js-2.0).
// - www.shtev.dev -> shtev.dev (301)
// - pretty URLs: /about and /about/ -> /about/index.html in the S3 bucket
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';

  if (host.indexOf('www.') === 0) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://' + host.slice(4) + request.uri } },
    };
  }

  var uri = request.uri;
  if (uri.indexOf('/api/') === 0) return request;

  if (uri.slice(-1) === '/') {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }
  return request;
}
