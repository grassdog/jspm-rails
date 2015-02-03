/* */ 
(function(Buffer, process) {
  var iconv = module.exports;
  iconv.encodings = null;
  iconv.defaultCharUnicode = '�';
  iconv.defaultCharSingleByte = '?';
  iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || "");
    var encoder = iconv.getCodec(encoding).encoder(options);
    var res = encoder.write(str);
    var trail = encoder.end();
    return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
  };
  iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === 'string') {
      if (!iconv.skipDecodeWarning) {
        console.error('Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding');
        iconv.skipDecodeWarning = true;
      }
      buf = new Buffer("" + (buf || ""), "binary");
    }
    var decoder = iconv.getCodec(encoding).decoder(options);
    var res = decoder.write(buf);
    var trail = decoder.end();
    return (trail && trail.length > 0) ? (res + trail) : res;
  };
  iconv.encodingExists = function encodingExists(enc) {
    try {
      iconv.getCodec(enc);
      return true;
    } catch (e) {
      return false;
    }
  };
  iconv.toEncoding = iconv.encode;
  iconv.fromEncoding = iconv.decode;
  iconv._codecDataCache = {};
  iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
      iconv.encodings = require("../encodings/index");
    var enc = ('' + encoding).toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, "");
    var codecData,
        codecOptions;
    while (true) {
      codecData = iconv._codecDataCache[enc];
      if (codecData)
        return codecData;
      var codec = iconv.encodings[enc];
      switch (typeof codec) {
        case "string":
          enc = codec;
          break;
        case "object":
          if (!codecOptions) {
            codecOptions = codec;
            codecOptions.encodingName = enc;
          } else {
            for (var key in codec)
              codecOptions[key] = codec[key];
          }
          enc = codec.type;
          break;
        case "function":
          if (!codecOptions)
            codecOptions = {encodingName: enc};
          codecOptions.iconv = iconv;
          codecData = codec.call(iconv.encodings, codecOptions);
          iconv._codecDataCache[codecOptions.encodingName] = codecData;
          return codecData;
        default:
          throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '" + enc + "')");
      }
    }
  };
  var nodeVer = typeof process !== 'undefined' && process.versions && process.versions.node;
  if (nodeVer) {
    var nodeVerArr = nodeVer.split(".").map(Number);
    if (nodeVerArr[0] > 0 || nodeVerArr[1] >= 10) {
      require('@empty')(iconv);
    }
    require('@empty')(iconv);
  }
})(require("buffer").Buffer, require("process"));
