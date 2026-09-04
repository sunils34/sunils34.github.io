/* Sends plain-HTTP visitors to HTTPS. Everything else falls through to the
   static assets. Runs in front of the asset store (assets.run_worker_first),
   otherwise an existing file would be served before this ever ran. */
export default {
  fetch: function (request, env) {
    var url = new URL(request.url);
    var local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && !local) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  }
};
