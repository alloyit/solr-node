/*jshint node:true, esversion:6*/
'use strict';
/**
 * Richieste HTTP con i soli moduli nativi di Node (http, https, zlib) al posto di node-fetch 2, che non è più
 * aggiornato. Riproduce il sottoinsieme di node-fetch 2 usato dal client, con le stesse richieste e le stesse
 * risposte ed errori:
 * - stessi header nello stesso ordine (quelli del chiamante, poi Accept, Content-Length, User-Agent,
 *   Accept-Encoding; Host, Authorization e Connection li aggiunge Node come prima);
 * - credenziali scritte nell'URL inviate come header Authorization Basic;
 * - redirect seguiti fino a 20, risposte gzip/deflate/brotli decompresse, testo letto come Buffer.toString();
 * - stessi errori: "request to <url> failed, reason: ...", "maximum redirect reached at: ...",
 *   "invalid json response body at ... reason: ...", "Invalid response body while trying to fetch ...".
 * Il fetch nativo di Node 24 non si usa perché aggiunge sempre header propri (sec-fetch-mode, accept-language),
 * scrive i nomi in minuscolo e rifiuta alcune porte.
 */
var http = require('http');
var https = require('https');
var zlib = require('zlib');
var PassThrough = require('stream').PassThrough;

var USER_AGENT = 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)';
var MAX_REDIRECT = 20;

function FetchError(message, type, systemError) {
  Error.call(this, message);
  this.message = message;
  this.type = type;
  if (systemError) {
    this.code = this.errno = systemError.code;
  }
  Error.captureStackTrace(this, this.constructor);
}
FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

// URL come in node-fetch 2: quelli assoluti passano dalla normalizzazione WHATWG
function parseUrl(urlStr) {
  urlStr = '' + urlStr;
  var url;
  try {
    url = new URL(urlStr);
  } catch (e) {
    throw new TypeError('Only absolute URLs are supported');
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new TypeError('Only HTTP(S) protocols are supported');
  }
  return url;
}

function decode(s) {
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

// Header nell'ordine di node-fetch 2
function requestHeaders(userHeaders, body) {
  var headers = {};
  var has = function (name) {
    return Object.keys(headers).some(function (k) { return k.toLowerCase() === name.toLowerCase(); });
  };
  Object.keys(userHeaders || {}).forEach(function (k) {
    headers[k] = String(userHeaders[k]);
  });
  if (!has('Accept')) {
    headers.Accept = '*/*';
  }
  if (typeof body === 'string') {
    headers['Content-Length'] = String(Buffer.byteLength(body));
  }
  if (!has('User-Agent')) {
    headers['User-Agent'] = USER_AGENT;
  }
  if (!has('Accept-Encoding')) {
    headers['Accept-Encoding'] = 'gzip,deflate';
  }
  return headers;
}

function isRedirect(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function fetchV2(urlStr, options) {
  return new Promise(function (resolve, reject) {
    var url = parseUrl(urlStr);
    var method = (options.method || 'GET').toUpperCase();
    var body = options.body;
    if (body != null && (method === 'GET' || method === 'HEAD')) {
      throw new TypeError('Request with GET/HEAD method cannot have body');
    }
    var userHeaders = options.headers || {};
    var counter = 0;

    function send(url, method, body) {
      var href = url.href;
      var senzaFrammento = href.split('#')[0];
      var reqOptions = {
        protocol: url.protocol,
        hostname: url.hostname.replace(/^\[(.*)\]$/, '$1'),
        port: url.port,
        // come url.parse della 2: un "?" finale senza parametri resta nel percorso
        path: url.pathname + (senzaFrammento.indexOf('?') >= 0 ? '?' + url.search.slice(1) : ''),
        method: method,
        headers: requestHeaders(userHeaders, body)
      };
      if (url.username || url.password) {
        reqOptions.auth = decode(url.username) + ':' + decode(url.password);
      }
      var corpo = null;
      var req = (url.protocol === 'https:' ? https : http).request(reqOptions);
      req.on('error', function (err) {
        reject(new FetchError('request to ' + href + ' failed, reason: ' + err.message, 'system', err));
        // come la 2: un errore della richiesta dopo l'arrivo della risposta interrompe il corpo
        if (corpo) {
          corpo.destroy(err);
        }
      });
      req.on('response', function (res) {
        var status = res.statusCode;
        if (isRedirect(status) && res.headers.location !== undefined) {
          var location;
          try {
            location = new URL(res.headers.location, href);
          } catch (e) {
            reject(new FetchError('uri requested responds with an invalid redirect URL: ' + res.headers.location, 'invalid-redirect'));
            return;
          }
          res.resume();
          if (counter >= MAX_REDIRECT) {
            reject(new FetchError('maximum redirect reached at: ' + href, 'max-redirect'));
            return;
          }
          counter++;
          if (status === 303 || ((status === 301 || status === 302) && method === 'POST')) {
            send(location, 'GET', undefined);
          } else {
            send(location, method, body);
          }
          return;
        }
        var risposta = response(req, res, href, method);
        corpo = risposta.body;
        resolve(risposta);
      });
      if (body != null) {
        req.write(body);
      }
      req.end();
    }

    send(url, method, body);
  });
}

// Corpo della risposta come in node-fetch 2: la risposta passa da un PassThrough (gli errori del solo socket non
// arrivano al corpo, salvo quelli della richiesta e la chiusura prima della fine di una risposta chunked) e
// viene decompressa se serve
function response(req, res, href, method) {
  var stream = res.pipe(new PassThrough());
  res.on('error', function () { });
  var encoding = String(res.headers['content-encoding'] || '').toLowerCase();
  var compressible = method !== 'HEAD' && res.statusCode !== 204 && res.statusCode !== 304;
  if (/chunked/i.test(String(res.headers['transfer-encoding'] || ''))) {
    req.on('socket', function () { });
    res.socket.once('close', function (hadError) {
      if (!hadError && !res.complete) {
        var err = new Error('Premature close');
        err.code = 'ERR_STREAM_PREMATURE_CLOSE';
        stream.destroy(err);
      }
    });
  }
  if (compressible && (encoding === 'gzip' || encoding === 'x-gzip')) {
    stream = stream.pipe(zlib.createGunzip({ flush: zlib.constants.Z_SYNC_FLUSH, finishFlush: zlib.constants.Z_SYNC_FLUSH }));
  } else if (compressible && encoding === 'br') {
    stream = stream.pipe(zlib.createBrotliDecompress());
  } else if (compressible && (encoding === 'deflate' || encoding === 'x-deflate')) {
    var raw = stream;
    var pass = new PassThrough();
    raw.once('data', function (chunk) {
      var inflate = (chunk[0] & 0x0F) === 0x08 ? zlib.createInflate() : zlib.createInflateRaw();
      inflate.on('error', function (e) { pass.destroy(e); });
      inflate.pipe(pass);
      inflate.write(chunk);
      raw.pipe(inflate);
    });
    raw.once('end', function () {
      if (!pass.writableEnded && raw.listenerCount('data') === 0) {
        pass.end();
      }
    });
    stream = pass;
  }
  var body = stream;
  var bodyPromise = new Promise(function (resolve, reject) {
    var parts = [];
    body.on('data', function (d) { parts.push(d); });
    body.on('end', function () { resolve(Buffer.concat(parts)); });
    body.on('error', function (err) {
      reject(new FetchError('Invalid response body while trying to fetch ' + href + ': ' + err.message, 'system', err));
    });
  });
  bodyPromise.catch(function () { });
  return {
    body: body,
    url: href,
    status: res.statusCode,
    statusText: res.statusMessage,
    ok: res.statusCode >= 200 && res.statusCode < 300,
    headers: res.headers,
    text: function () {
      return bodyPromise.then(function (buffer) { return buffer.toString(); });
    },
    json: function () {
      return bodyPromise.then(function (buffer) {
        try {
          return JSON.parse(buffer.toString());
        } catch (err) {
          throw new FetchError('invalid json response body at ' + href + ' reason: ' + err.message, 'invalid-json');
        }
      });
    }
  };
}

module.exports = fetchV2;
module.exports.FetchError = FetchError;
