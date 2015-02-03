/* */ 
(function(Buffer) {
  var utf16lebom = new Buffer([0xFF, 0xFE]);
  module.exports = {
    utf8: {
      type: "_internal",
      enc: "utf8"
    },
    cesu8: {
      type: "_internal",
      enc: "utf8"
    },
    unicode11utf8: {
      type: "_internal",
      enc: "utf8"
    },
    ucs2: {
      type: "_internal",
      enc: "ucs2",
      bom: utf16lebom
    },
    utf16le: {
      type: "_internal",
      enc: "ucs2",
      bom: utf16lebom
    },
    binary: {
      type: "_internal",
      enc: "binary"
    },
    base64: {
      type: "_internal",
      enc: "base64"
    },
    hex: {
      type: "_internal",
      enc: "hex"
    },
    _internal: function(options) {
      if (!options || !options.enc)
        throw new Error("Internal codec is called without encoding type.");
      return {
        encoder: options.enc == "base64" ? encoderBase64 : encoderInternal,
        decoder: decoderInternal,
        enc: options.enc,
        bom: options.bom
      };
    }
  };
  var StringDecoder = require("string_decoder").StringDecoder;
  if (!StringDecoder.prototype.end)
    StringDecoder.prototype.end = function() {};
  function decoderInternal() {
    return new StringDecoder(this.enc);
  }
  function encoderInternal() {
    return {
      write: encodeInternal,
      end: function() {},
      enc: this.enc
    };
  }
  function encodeInternal(str) {
    return new Buffer(str, this.enc);
  }
  function encoderBase64() {
    return {
      write: encodeBase64Write,
      end: encodeBase64End,
      prevStr: ''
    };
  }
  function encodeBase64Write(str) {
    str = this.prevStr + str;
    var completeQuads = str.length - (str.length % 4);
    this.prevStr = str.slice(completeQuads);
    str = str.slice(0, completeQuads);
    return new Buffer(str, "base64");
  }
  function encodeBase64End() {
    return new Buffer(this.prevStr, "base64");
  }
})(require("buffer").Buffer);
