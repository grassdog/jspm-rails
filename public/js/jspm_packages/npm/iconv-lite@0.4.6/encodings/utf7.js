/* */ 
(function(Buffer) {
  exports.utf7 = function(options) {
    return {
      encoder: function utf7Encoder() {
        return {
          write: utf7EncoderWrite,
          end: function() {},
          iconv: options.iconv
        };
      },
      decoder: function utf7Decoder() {
        return {
          write: utf7DecoderWrite,
          end: utf7DecoderEnd,
          iconv: options.iconv,
          inBase64: false,
          base64Accum: ''
        };
      }
    };
  };
  var nonDirectChars = /[^A-Za-z0-9'\(\),-\.\/:\? \n\r\t]+/g;
  function utf7EncoderWrite(str) {
    return new Buffer(str.replace(nonDirectChars, function(chunk) {
      return "+" + (chunk === '+' ? '' : this.iconv.encode(chunk, 'utf16-be').toString('base64').replace(/=+$/, '')) + "-";
    }.bind(this)));
  }
  var base64Regex = /[A-Za-z0-9\/+]/;
  var base64Chars = [];
  for (var i = 0; i < 256; i++)
    base64Chars[i] = base64Regex.test(String.fromCharCode(i));
  var plusChar = '+'.charCodeAt(0),
      minusChar = '-'.charCodeAt(0),
      andChar = '&'.charCodeAt(0);
  function utf7DecoderWrite(buf) {
    var res = "",
        lastI = 0,
        inBase64 = this.inBase64,
        base64Accum = this.base64Accum;
    for (var i = 0; i < buf.length; i++) {
      if (!inBase64) {
        if (buf[i] == plusChar) {
          res += this.iconv.decode(buf.slice(lastI, i), "ascii");
          lastI = i + 1;
          inBase64 = true;
        }
      } else {
        if (!base64Chars[buf[i]]) {
          if (i == lastI && buf[i] == minusChar) {
            res += "+";
          } else {
            var b64str = base64Accum + buf.slice(lastI, i).toString();
            res += this.iconv.decode(new Buffer(b64str, 'base64'), "utf16-be");
          }
          if (buf[i] != minusChar)
            i--;
          lastI = i + 1;
          inBase64 = false;
          base64Accum = '';
        }
      }
    }
    if (!inBase64) {
      res += this.iconv.decode(buf.slice(lastI), "ascii");
    } else {
      var b64str = base64Accum + buf.slice(lastI).toString();
      var canBeDecoded = b64str.length - (b64str.length % 8);
      base64Accum = b64str.slice(canBeDecoded);
      b64str = b64str.slice(0, canBeDecoded);
      res += this.iconv.decode(new Buffer(b64str, 'base64'), "utf16-be");
    }
    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;
    return res;
  }
  function utf7DecoderEnd() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
      res = this.iconv.decode(new Buffer(this.base64Accum, 'base64'), "utf16-be");
    this.inBase64 = false;
    this.base64Accum = '';
    return res;
  }
  exports.utf7imap = function(options) {
    return {
      encoder: function utf7ImapEncoder() {
        return {
          write: utf7ImapEncoderWrite,
          end: utf7ImapEncoderEnd,
          iconv: options.iconv,
          inBase64: false,
          base64Accum: new Buffer(6),
          base64AccumIdx: 0
        };
      },
      decoder: function utf7ImapDecoder() {
        return {
          write: utf7ImapDecoderWrite,
          end: utf7ImapDecoderEnd,
          iconv: options.iconv,
          inBase64: false,
          base64Accum: ''
        };
      }
    };
  };
  function utf7ImapEncoderWrite(str) {
    var inBase64 = this.inBase64,
        base64Accum = this.base64Accum,
        base64AccumIdx = this.base64AccumIdx,
        buf = new Buffer(str.length * 5 + 10),
        bufIdx = 0;
    for (var i = 0; i < str.length; i++) {
      var uChar = str.charCodeAt(i);
      if (0x20 <= uChar && uChar <= 0x7E) {
        if (inBase64) {
          if (base64AccumIdx > 0) {
            bufIdx += buf.write(base64Accum.slice(0, base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
            base64AccumIdx = 0;
          }
          buf[bufIdx++] = minusChar;
          inBase64 = false;
        }
        if (!inBase64) {
          buf[bufIdx++] = uChar;
          if (uChar === andChar)
            buf[bufIdx++] = minusChar;
        }
      } else {
        if (!inBase64) {
          buf[bufIdx++] = andChar;
          inBase64 = true;
        }
        if (inBase64) {
          base64Accum[base64AccumIdx++] = uChar >> 8;
          base64Accum[base64AccumIdx++] = uChar & 0xFF;
          if (base64AccumIdx == base64Accum.length) {
            bufIdx += buf.write(base64Accum.toString('base64').replace(/\//g, ','), bufIdx);
            base64AccumIdx = 0;
          }
        }
      }
    }
    this.inBase64 = inBase64;
    this.base64AccumIdx = base64AccumIdx;
    return buf.slice(0, bufIdx);
  }
  function utf7ImapEncoderEnd() {
    var buf = new Buffer(10),
        bufIdx = 0;
    if (this.inBase64) {
      if (this.base64AccumIdx > 0) {
        bufIdx += buf.write(this.base64Accum.slice(0, this.base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
        this.base64AccumIdx = 0;
      }
      buf[bufIdx++] = minusChar;
      this.inBase64 = false;
    }
    return buf.slice(0, bufIdx);
  }
  var base64IMAPChars = base64Chars.slice();
  base64IMAPChars[','.charCodeAt(0)] = true;
  function utf7ImapDecoderWrite(buf) {
    var res = "",
        lastI = 0,
        inBase64 = this.inBase64,
        base64Accum = this.base64Accum;
    for (var i = 0; i < buf.length; i++) {
      if (!inBase64) {
        if (buf[i] == andChar) {
          res += this.iconv.decode(buf.slice(lastI, i), "ascii");
          lastI = i + 1;
          inBase64 = true;
        }
      } else {
        if (!base64IMAPChars[buf[i]]) {
          if (i == lastI && buf[i] == minusChar) {
            res += "&";
          } else {
            var b64str = base64Accum + buf.slice(lastI, i).toString().replace(/,/g, '/');
            res += this.iconv.decode(new Buffer(b64str, 'base64'), "utf16-be");
          }
          if (buf[i] != minusChar)
            i--;
          lastI = i + 1;
          inBase64 = false;
          base64Accum = '';
        }
      }
    }
    if (!inBase64) {
      res += this.iconv.decode(buf.slice(lastI), "ascii");
    } else {
      var b64str = base64Accum + buf.slice(lastI).toString().replace(/,/g, '/');
      var canBeDecoded = b64str.length - (b64str.length % 8);
      base64Accum = b64str.slice(canBeDecoded);
      b64str = b64str.slice(0, canBeDecoded);
      res += this.iconv.decode(new Buffer(b64str, 'base64'), "utf16-be");
    }
    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;
    return res;
  }
  function utf7ImapDecoderEnd() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
      res = this.iconv.decode(new Buffer(this.base64Accum, 'base64'), "utf16-be");
    this.inBase64 = false;
    this.base64Accum = '';
    return res;
  }
})(require("buffer").Buffer);
