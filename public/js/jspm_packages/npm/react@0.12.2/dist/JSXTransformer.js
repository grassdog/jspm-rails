/* */ 
"format cjs";
(function(Buffer, process) {
  !function(e) {
    if ("object" == typeof exports && "undefined" != typeof module)
      module.exports = e();
    else if ("function" == typeof define && define.amd)
      define([], e);
    else {
      var f;
      "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.JSXTransformer = e();
    }
  }(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(_dereq_, module, exports) {
        'use strict';
        var buffer = _dereq_('buffer');
        var transform = _dereq_('jstransform').transform;
        var typesSyntax = _dereq_('jstransform/visitors/type-syntax');
        var visitors = _dereq_('./fbtransform/visitors');
        var headEl;
        var dummyAnchor;
        var inlineScriptCount = 0;
        var supportsAccessors = Object.prototype.hasOwnProperty('__defineGetter__');
        function transformReact(source, options) {
          options = options || {};
          var visitorList;
          if (options.harmony) {
            visitorList = visitors.getAllVisitors();
          } else {
            visitorList = visitors.transformVisitors.react;
          }
          if (options.stripTypes) {
            source = transform(typesSyntax.visitorList, source, options).code;
          }
          return transform(visitorList, source, {sourceMap: supportsAccessors && options.sourceMap});
        }
        function exec(source, options) {
          return eval(transformReact(source, options).code);
        }
        function createSourceCodeErrorMessage(code, e) {
          var sourceLines = code.split('\n');
          var erroneousLine = sourceLines[e.lineNumber - 1];
          var indentation = 0;
          erroneousLine = erroneousLine.replace(/^\s+/, function(leadingSpaces) {
            indentation = leadingSpaces.length;
            return '';
          });
          var LIMIT = 30;
          var errorColumn = e.column - indentation;
          if (errorColumn > LIMIT) {
            erroneousLine = '... ' + erroneousLine.slice(errorColumn - LIMIT);
            errorColumn = 4 + LIMIT;
          }
          if (erroneousLine.length - errorColumn > LIMIT) {
            erroneousLine = erroneousLine.slice(0, errorColumn + LIMIT) + ' ...';
          }
          var message = '\n\n' + erroneousLine + '\n';
          message += new Array(errorColumn - 1).join(' ') + '^';
          return message;
        }
        function transformCode(code, url, options) {
          try {
            var transformed = transformReact(code, options);
          } catch (e) {
            e.message += '\n    at ';
            if (url) {
              if ('fileName' in e) {
                e.fileName = url;
              }
              e.message += url + ':' + e.lineNumber + ':' + e.column;
            } else {
              e.message += location.href;
            }
            e.message += createSourceCodeErrorMessage(code, e);
            throw e;
          }
          if (!transformed.sourceMap) {
            return transformed.code;
          }
          var map = transformed.sourceMap.toJSON();
          var source;
          if (url == null) {
            source = "Inline JSX script";
            inlineScriptCount++;
            if (inlineScriptCount > 1) {
              source += ' (' + inlineScriptCount + ')';
            }
          } else if (dummyAnchor) {
            dummyAnchor.href = url;
            source = dummyAnchor.pathname.substr(1);
          }
          map.sources = [source];
          map.sourcesContent = [code];
          return (transformed.code + '\n//# sourceMappingURL=data:application/json;base64,' + buffer.Buffer(JSON.stringify(map)).toString('base64'));
        }
        function run(code, url, options) {
          var scriptEl = document.createElement('script');
          scriptEl.text = transformCode(code, url, options);
          headEl.appendChild(scriptEl);
        }
        function load(url, successCallback, errorCallback) {
          var xhr;
          xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
          xhr.open('GET', url, true);
          if ('overrideMimeType' in xhr) {
            xhr.overrideMimeType('text/plain');
          }
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 0 || xhr.status === 200) {
                successCallback(xhr.responseText);
              } else {
                errorCallback();
                throw new Error("Could not load " + url);
              }
            }
          };
          return xhr.send(null);
        }
        function loadScripts(scripts) {
          var result = [];
          var count = scripts.length;
          function check() {
            var script,
                i;
            for (i = 0; i < count; i++) {
              script = result[i];
              if (script.loaded && !script.executed) {
                script.executed = true;
                run(script.content, script.url, script.options);
              } else if (!script.loaded && !script.error && !script.async) {
                break;
              }
            }
          }
          scripts.forEach(function(script, i) {
            var options = {sourceMap: true};
            if (/;harmony=true(;|$)/.test(script.type)) {
              options.harmony = true;
            }
            if (/;stripTypes=true(;|$)/.test(script.type)) {
              options.stripTypes = true;
            }
            var async = script.hasAttribute('async');
            if (script.src) {
              result[i] = {
                async: async,
                error: false,
                executed: false,
                content: null,
                loaded: false,
                url: script.src,
                options: options
              };
              load(script.src, function(content) {
                result[i].loaded = true;
                result[i].content = content;
                check();
              }, function() {
                result[i].error = true;
                check();
              });
            } else {
              result[i] = {
                async: async,
                error: false,
                executed: false,
                content: script.innerHTML,
                loaded: true,
                url: null,
                options: options
              };
            }
          });
          check();
        }
        function runScripts() {
          var scripts = document.getElementsByTagName('script');
          var jsxScripts = [];
          for (var i = 0; i < scripts.length; i++) {
            if (/^text\/jsx(;|$)/.test(scripts.item(i).type)) {
              jsxScripts.push(scripts.item(i));
            }
          }
          if (jsxScripts.length < 1) {
            return ;
          }
          console.warn('You are using the in-browser JSX transformer. Be sure to precompile ' + 'your JSX for production - ' + 'http://facebook.github.io/react/docs/tooling-integration.html#jsx');
          loadScripts(jsxScripts);
        }
        if (typeof window !== "undefined" && window !== null) {
          headEl = document.getElementsByTagName('head')[0];
          dummyAnchor = document.createElement('a');
          if (window.addEventListener) {
            window.addEventListener('DOMContentLoaded', runScripts, false);
          } else {
            window.attachEvent('onload', runScripts);
          }
        }
        module.exports = {
          transform: transformReact,
          exec: exec
        };
      }, {
        "./fbtransform/visitors": 37,
        "buffer": 2,
        "jstransform": 21,
        "jstransform/visitors/type-syntax": 33
      }],
      2: [function(_dereq_, module, exports) {
        var base64 = _dereq_('base64-js');
        var ieee754 = _dereq_('ieee754');
        var isArray = _dereq_('is-array');
        exports.Buffer = Buffer;
        exports.SlowBuffer = Buffer;
        exports.INSPECT_MAX_BYTES = 50;
        Buffer.poolSize = 8192;
        var kMaxLength = 0x3fffffff;
        Buffer.TYPED_ARRAY_SUPPORT = (function() {
          try {
            var buf = new ArrayBuffer(0);
            var arr = new Uint8Array(buf);
            arr.foo = function() {
              return 42;
            };
            return 42 === arr.foo() && typeof arr.subarray === 'function' && new Uint8Array(1).subarray(1, 1).byteLength === 0;
          } catch (e) {
            return false;
          }
        })();
        function Buffer(subject, encoding, noZero) {
          if (!(this instanceof Buffer))
            return new Buffer(subject, encoding, noZero);
          var type = typeof subject;
          var length;
          if (type === 'number')
            length = subject > 0 ? subject >>> 0 : 0;
          else if (type === 'string') {
            if (encoding === 'base64')
              subject = base64clean(subject);
            length = Buffer.byteLength(subject, encoding);
          } else if (type === 'object' && subject !== null) {
            if (subject.type === 'Buffer' && isArray(subject.data))
              subject = subject.data;
            length = +subject.length > 0 ? Math.floor(+subject.length) : 0;
          } else
            throw new TypeError('must start with number, buffer, array or string');
          if (this.length > kMaxLength)
            throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength.toString(16) + ' bytes');
          var buf;
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            buf = Buffer._augment(new Uint8Array(length));
          } else {
            buf = this;
            buf.length = length;
            buf._isBuffer = true;
          }
          var i;
          if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
            buf._set(subject);
          } else if (isArrayish(subject)) {
            if (Buffer.isBuffer(subject)) {
              for (i = 0; i < length; i++)
                buf[i] = subject.readUInt8(i);
            } else {
              for (i = 0; i < length; i++)
                buf[i] = ((subject[i] % 256) + 256) % 256;
            }
          } else if (type === 'string') {
            buf.write(subject, 0, encoding);
          } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
            for (i = 0; i < length; i++) {
              buf[i] = 0;
            }
          }
          return buf;
        }
        Buffer.isBuffer = function(b) {
          return !!(b != null && b._isBuffer);
        };
        Buffer.compare = function(a, b) {
          if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
            throw new TypeError('Arguments must be Buffers');
          var x = a.length;
          var y = b.length;
          for (var i = 0,
              len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
          if (i !== len) {
            x = a[i];
            y = b[i];
          }
          if (x < y)
            return -1;
          if (y < x)
            return 1;
          return 0;
        };
        Buffer.isEncoding = function(encoding) {
          switch (String(encoding).toLowerCase()) {
            case 'hex':
            case 'utf8':
            case 'utf-8':
            case 'ascii':
            case 'binary':
            case 'base64':
            case 'raw':
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return true;
            default:
              return false;
          }
        };
        Buffer.concat = function(list, totalLength) {
          if (!isArray(list))
            throw new TypeError('Usage: Buffer.concat(list[, length])');
          if (list.length === 0) {
            return new Buffer(0);
          } else if (list.length === 1) {
            return list[0];
          }
          var i;
          if (totalLength === undefined) {
            totalLength = 0;
            for (i = 0; i < list.length; i++) {
              totalLength += list[i].length;
            }
          }
          var buf = new Buffer(totalLength);
          var pos = 0;
          for (i = 0; i < list.length; i++) {
            var item = list[i];
            item.copy(buf, pos);
            pos += item.length;
          }
          return buf;
        };
        Buffer.byteLength = function(str, encoding) {
          var ret;
          str = str + '';
          switch (encoding || 'utf8') {
            case 'ascii':
            case 'binary':
            case 'raw':
              ret = str.length;
              break;
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              ret = str.length * 2;
              break;
            case 'hex':
              ret = str.length >>> 1;
              break;
            case 'utf8':
            case 'utf-8':
              ret = utf8ToBytes(str).length;
              break;
            case 'base64':
              ret = base64ToBytes(str).length;
              break;
            default:
              ret = str.length;
          }
          return ret;
        };
        Buffer.prototype.length = undefined;
        Buffer.prototype.parent = undefined;
        Buffer.prototype.toString = function(encoding, start, end) {
          var loweredCase = false;
          start = start >>> 0;
          end = end === undefined || end === Infinity ? this.length : end >>> 0;
          if (!encoding)
            encoding = 'utf8';
          if (start < 0)
            start = 0;
          if (end > this.length)
            end = this.length;
          if (end <= start)
            return '';
          while (true) {
            switch (encoding) {
              case 'hex':
                return hexSlice(this, start, end);
              case 'utf8':
              case 'utf-8':
                return utf8Slice(this, start, end);
              case 'ascii':
                return asciiSlice(this, start, end);
              case 'binary':
                return binarySlice(this, start, end);
              case 'base64':
                return base64Slice(this, start, end);
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return utf16leSlice(this, start, end);
              default:
                if (loweredCase)
                  throw new TypeError('Unknown encoding: ' + encoding);
                encoding = (encoding + '').toLowerCase();
                loweredCase = true;
            }
          }
        };
        Buffer.prototype.equals = function(b) {
          if (!Buffer.isBuffer(b))
            throw new TypeError('Argument must be a Buffer');
          return Buffer.compare(this, b) === 0;
        };
        Buffer.prototype.inspect = function() {
          var str = '';
          var max = exports.INSPECT_MAX_BYTES;
          if (this.length > 0) {
            str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
            if (this.length > max)
              str += ' ... ';
          }
          return '<Buffer ' + str + '>';
        };
        Buffer.prototype.compare = function(b) {
          if (!Buffer.isBuffer(b))
            throw new TypeError('Argument must be a Buffer');
          return Buffer.compare(this, b);
        };
        Buffer.prototype.get = function(offset) {
          console.log('.get() is deprecated. Access using array indexes instead.');
          return this.readUInt8(offset);
        };
        Buffer.prototype.set = function(v, offset) {
          console.log('.set() is deprecated. Access using array indexes instead.');
          return this.writeUInt8(v, offset);
        };
        function hexWrite(buf, string, offset, length) {
          offset = Number(offset) || 0;
          var remaining = buf.length - offset;
          if (!length) {
            length = remaining;
          } else {
            length = Number(length);
            if (length > remaining) {
              length = remaining;
            }
          }
          var strLen = string.length;
          if (strLen % 2 !== 0)
            throw new Error('Invalid hex string');
          if (length > strLen / 2) {
            length = strLen / 2;
          }
          for (var i = 0; i < length; i++) {
            var byte = parseInt(string.substr(i * 2, 2), 16);
            if (isNaN(byte))
              throw new Error('Invalid hex string');
            buf[offset + i] = byte;
          }
          return i;
        }
        function utf8Write(buf, string, offset, length) {
          var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length);
          return charsWritten;
        }
        function asciiWrite(buf, string, offset, length) {
          var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length);
          return charsWritten;
        }
        function binaryWrite(buf, string, offset, length) {
          return asciiWrite(buf, string, offset, length);
        }
        function base64Write(buf, string, offset, length) {
          var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length);
          return charsWritten;
        }
        function utf16leWrite(buf, string, offset, length) {
          var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length);
          return charsWritten;
        }
        Buffer.prototype.write = function(string, offset, length, encoding) {
          if (isFinite(offset)) {
            if (!isFinite(length)) {
              encoding = length;
              length = undefined;
            }
          } else {
            var swap = encoding;
            encoding = offset;
            offset = length;
            length = swap;
          }
          offset = Number(offset) || 0;
          var remaining = this.length - offset;
          if (!length) {
            length = remaining;
          } else {
            length = Number(length);
            if (length > remaining) {
              length = remaining;
            }
          }
          encoding = String(encoding || 'utf8').toLowerCase();
          var ret;
          switch (encoding) {
            case 'hex':
              ret = hexWrite(this, string, offset, length);
              break;
            case 'utf8':
            case 'utf-8':
              ret = utf8Write(this, string, offset, length);
              break;
            case 'ascii':
              ret = asciiWrite(this, string, offset, length);
              break;
            case 'binary':
              ret = binaryWrite(this, string, offset, length);
              break;
            case 'base64':
              ret = base64Write(this, string, offset, length);
              break;
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              ret = utf16leWrite(this, string, offset, length);
              break;
            default:
              throw new TypeError('Unknown encoding: ' + encoding);
          }
          return ret;
        };
        Buffer.prototype.toJSON = function() {
          return {
            type: 'Buffer',
            data: Array.prototype.slice.call(this._arr || this, 0)
          };
        };
        function base64Slice(buf, start, end) {
          if (start === 0 && end === buf.length) {
            return base64.fromByteArray(buf);
          } else {
            return base64.fromByteArray(buf.slice(start, end));
          }
        }
        function utf8Slice(buf, start, end) {
          var res = '';
          var tmp = '';
          end = Math.min(buf.length, end);
          for (var i = start; i < end; i++) {
            if (buf[i] <= 0x7F) {
              res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i]);
              tmp = '';
            } else {
              tmp += '%' + buf[i].toString(16);
            }
          }
          return res + decodeUtf8Char(tmp);
        }
        function asciiSlice(buf, start, end) {
          var ret = '';
          end = Math.min(buf.length, end);
          for (var i = start; i < end; i++) {
            ret += String.fromCharCode(buf[i]);
          }
          return ret;
        }
        function binarySlice(buf, start, end) {
          return asciiSlice(buf, start, end);
        }
        function hexSlice(buf, start, end) {
          var len = buf.length;
          if (!start || start < 0)
            start = 0;
          if (!end || end < 0 || end > len)
            end = len;
          var out = '';
          for (var i = start; i < end; i++) {
            out += toHex(buf[i]);
          }
          return out;
        }
        function utf16leSlice(buf, start, end) {
          var bytes = buf.slice(start, end);
          var res = '';
          for (var i = 0; i < bytes.length; i += 2) {
            res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
          }
          return res;
        }
        Buffer.prototype.slice = function(start, end) {
          var len = this.length;
          start = ~~start;
          end = end === undefined ? len : ~~end;
          if (start < 0) {
            start += len;
            if (start < 0)
              start = 0;
          } else if (start > len) {
            start = len;
          }
          if (end < 0) {
            end += len;
            if (end < 0)
              end = 0;
          } else if (end > len) {
            end = len;
          }
          if (end < start)
            end = start;
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            return Buffer._augment(this.subarray(start, end));
          } else {
            var sliceLen = end - start;
            var newBuf = new Buffer(sliceLen, undefined, true);
            for (var i = 0; i < sliceLen; i++) {
              newBuf[i] = this[i + start];
            }
            return newBuf;
          }
        };
        function checkOffset(offset, ext, length) {
          if ((offset % 1) !== 0 || offset < 0)
            throw new RangeError('offset is not uint');
          if (offset + ext > length)
            throw new RangeError('Trying to access beyond buffer length');
        }
        Buffer.prototype.readUInt8 = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 1, this.length);
          return this[offset];
        };
        Buffer.prototype.readUInt16LE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 2, this.length);
          return this[offset] | (this[offset + 1] << 8);
        };
        Buffer.prototype.readUInt16BE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 2, this.length);
          return (this[offset] << 8) | this[offset + 1];
        };
        Buffer.prototype.readUInt32LE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return ((this[offset]) | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + (this[offset + 3] * 0x1000000);
        };
        Buffer.prototype.readUInt32BE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
        };
        Buffer.prototype.readInt8 = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 1, this.length);
          if (!(this[offset] & 0x80))
            return (this[offset]);
          return ((0xff - this[offset] + 1) * -1);
        };
        Buffer.prototype.readInt16LE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 2, this.length);
          var val = this[offset] | (this[offset + 1] << 8);
          return (val & 0x8000) ? val | 0xFFFF0000 : val;
        };
        Buffer.prototype.readInt16BE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 2, this.length);
          var val = this[offset + 1] | (this[offset] << 8);
          return (val & 0x8000) ? val | 0xFFFF0000 : val;
        };
        Buffer.prototype.readInt32LE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return (this[offset]) | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24);
        };
        Buffer.prototype.readInt32BE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | (this[offset + 3]);
        };
        Buffer.prototype.readFloatLE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return ieee754.read(this, offset, true, 23, 4);
        };
        Buffer.prototype.readFloatBE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 4, this.length);
          return ieee754.read(this, offset, false, 23, 4);
        };
        Buffer.prototype.readDoubleLE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 8, this.length);
          return ieee754.read(this, offset, true, 52, 8);
        };
        Buffer.prototype.readDoubleBE = function(offset, noAssert) {
          if (!noAssert)
            checkOffset(offset, 8, this.length);
          return ieee754.read(this, offset, false, 52, 8);
        };
        function checkInt(buf, value, offset, ext, max, min) {
          if (!Buffer.isBuffer(buf))
            throw new TypeError('buffer must be a Buffer instance');
          if (value > max || value < min)
            throw new TypeError('value is out of bounds');
          if (offset + ext > buf.length)
            throw new TypeError('index out of range');
        }
        Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 1, 0xff, 0);
          if (!Buffer.TYPED_ARRAY_SUPPORT)
            value = Math.floor(value);
          this[offset] = value;
          return offset + 1;
        };
        function objectWriteUInt16(buf, value, offset, littleEndian) {
          if (value < 0)
            value = 0xffff + value + 1;
          for (var i = 0,
              j = Math.min(buf.length - offset, 2); i < j; i++) {
            buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>> (littleEndian ? i : 1 - i) * 8;
          }
        }
        Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 2, 0xffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value;
            this[offset + 1] = (value >>> 8);
          } else
            objectWriteUInt16(this, value, offset, true);
          return offset + 2;
        };
        Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 2, 0xffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = (value >>> 8);
            this[offset + 1] = value;
          } else
            objectWriteUInt16(this, value, offset, false);
          return offset + 2;
        };
        function objectWriteUInt32(buf, value, offset, littleEndian) {
          if (value < 0)
            value = 0xffffffff + value + 1;
          for (var i = 0,
              j = Math.min(buf.length - offset, 4); i < j; i++) {
            buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
          }
        }
        Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 4, 0xffffffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset + 3] = (value >>> 24);
            this[offset + 2] = (value >>> 16);
            this[offset + 1] = (value >>> 8);
            this[offset] = value;
          } else
            objectWriteUInt32(this, value, offset, true);
          return offset + 4;
        };
        Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 4, 0xffffffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = (value >>> 24);
            this[offset + 1] = (value >>> 16);
            this[offset + 2] = (value >>> 8);
            this[offset + 3] = value;
          } else
            objectWriteUInt32(this, value, offset, false);
          return offset + 4;
        };
        Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 1, 0x7f, -0x80);
          if (!Buffer.TYPED_ARRAY_SUPPORT)
            value = Math.floor(value);
          if (value < 0)
            value = 0xff + value + 1;
          this[offset] = value;
          return offset + 1;
        };
        Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 2, 0x7fff, -0x8000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value;
            this[offset + 1] = (value >>> 8);
          } else
            objectWriteUInt16(this, value, offset, true);
          return offset + 2;
        };
        Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 2, 0x7fff, -0x8000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = (value >>> 8);
            this[offset + 1] = value;
          } else
            objectWriteUInt16(this, value, offset, false);
          return offset + 2;
        };
        Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value;
            this[offset + 1] = (value >>> 8);
            this[offset + 2] = (value >>> 16);
            this[offset + 3] = (value >>> 24);
          } else
            objectWriteUInt32(this, value, offset, true);
          return offset + 4;
        };
        Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
          value = +value;
          offset = offset >>> 0;
          if (!noAssert)
            checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
          if (value < 0)
            value = 0xffffffff + value + 1;
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = (value >>> 24);
            this[offset + 1] = (value >>> 16);
            this[offset + 2] = (value >>> 8);
            this[offset + 3] = value;
          } else
            objectWriteUInt32(this, value, offset, false);
          return offset + 4;
        };
        function checkIEEE754(buf, value, offset, ext, max, min) {
          if (value > max || value < min)
            throw new TypeError('value is out of bounds');
          if (offset + ext > buf.length)
            throw new TypeError('index out of range');
        }
        function writeFloat(buf, value, offset, littleEndian, noAssert) {
          if (!noAssert)
            checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
          ieee754.write(buf, value, offset, littleEndian, 23, 4);
          return offset + 4;
        }
        Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
          return writeFloat(this, value, offset, true, noAssert);
        };
        Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
          return writeFloat(this, value, offset, false, noAssert);
        };
        function writeDouble(buf, value, offset, littleEndian, noAssert) {
          if (!noAssert)
            checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
          ieee754.write(buf, value, offset, littleEndian, 52, 8);
          return offset + 8;
        }
        Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
          return writeDouble(this, value, offset, true, noAssert);
        };
        Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
          return writeDouble(this, value, offset, false, noAssert);
        };
        Buffer.prototype.copy = function(target, target_start, start, end) {
          var source = this;
          if (!start)
            start = 0;
          if (!end && end !== 0)
            end = this.length;
          if (!target_start)
            target_start = 0;
          if (end === start)
            return ;
          if (target.length === 0 || source.length === 0)
            return ;
          if (end < start)
            throw new TypeError('sourceEnd < sourceStart');
          if (target_start < 0 || target_start >= target.length)
            throw new TypeError('targetStart out of bounds');
          if (start < 0 || start >= source.length)
            throw new TypeError('sourceStart out of bounds');
          if (end < 0 || end > source.length)
            throw new TypeError('sourceEnd out of bounds');
          if (end > this.length)
            end = this.length;
          if (target.length - target_start < end - start)
            end = target.length - target_start + start;
          var len = end - start;
          if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
            for (var i = 0; i < len; i++) {
              target[i + target_start] = this[i + start];
            }
          } else {
            target._set(this.subarray(start, start + len), target_start);
          }
        };
        Buffer.prototype.fill = function(value, start, end) {
          if (!value)
            value = 0;
          if (!start)
            start = 0;
          if (!end)
            end = this.length;
          if (end < start)
            throw new TypeError('end < start');
          if (end === start)
            return ;
          if (this.length === 0)
            return ;
          if (start < 0 || start >= this.length)
            throw new TypeError('start out of bounds');
          if (end < 0 || end > this.length)
            throw new TypeError('end out of bounds');
          var i;
          if (typeof value === 'number') {
            for (i = start; i < end; i++) {
              this[i] = value;
            }
          } else {
            var bytes = utf8ToBytes(value.toString());
            var len = bytes.length;
            for (i = start; i < end; i++) {
              this[i] = bytes[i % len];
            }
          }
          return this;
        };
        Buffer.prototype.toArrayBuffer = function() {
          if (typeof Uint8Array !== 'undefined') {
            if (Buffer.TYPED_ARRAY_SUPPORT) {
              return (new Buffer(this)).buffer;
            } else {
              var buf = new Uint8Array(this.length);
              for (var i = 0,
                  len = buf.length; i < len; i += 1) {
                buf[i] = this[i];
              }
              return buf.buffer;
            }
          } else {
            throw new TypeError('Buffer.toArrayBuffer not supported in this browser');
          }
        };
        var BP = Buffer.prototype;
        Buffer._augment = function(arr) {
          arr.constructor = Buffer;
          arr._isBuffer = true;
          arr._get = arr.get;
          arr._set = arr.set;
          arr.get = BP.get;
          arr.set = BP.set;
          arr.write = BP.write;
          arr.toString = BP.toString;
          arr.toLocaleString = BP.toString;
          arr.toJSON = BP.toJSON;
          arr.equals = BP.equals;
          arr.compare = BP.compare;
          arr.copy = BP.copy;
          arr.slice = BP.slice;
          arr.readUInt8 = BP.readUInt8;
          arr.readUInt16LE = BP.readUInt16LE;
          arr.readUInt16BE = BP.readUInt16BE;
          arr.readUInt32LE = BP.readUInt32LE;
          arr.readUInt32BE = BP.readUInt32BE;
          arr.readInt8 = BP.readInt8;
          arr.readInt16LE = BP.readInt16LE;
          arr.readInt16BE = BP.readInt16BE;
          arr.readInt32LE = BP.readInt32LE;
          arr.readInt32BE = BP.readInt32BE;
          arr.readFloatLE = BP.readFloatLE;
          arr.readFloatBE = BP.readFloatBE;
          arr.readDoubleLE = BP.readDoubleLE;
          arr.readDoubleBE = BP.readDoubleBE;
          arr.writeUInt8 = BP.writeUInt8;
          arr.writeUInt16LE = BP.writeUInt16LE;
          arr.writeUInt16BE = BP.writeUInt16BE;
          arr.writeUInt32LE = BP.writeUInt32LE;
          arr.writeUInt32BE = BP.writeUInt32BE;
          arr.writeInt8 = BP.writeInt8;
          arr.writeInt16LE = BP.writeInt16LE;
          arr.writeInt16BE = BP.writeInt16BE;
          arr.writeInt32LE = BP.writeInt32LE;
          arr.writeInt32BE = BP.writeInt32BE;
          arr.writeFloatLE = BP.writeFloatLE;
          arr.writeFloatBE = BP.writeFloatBE;
          arr.writeDoubleLE = BP.writeDoubleLE;
          arr.writeDoubleBE = BP.writeDoubleBE;
          arr.fill = BP.fill;
          arr.inspect = BP.inspect;
          arr.toArrayBuffer = BP.toArrayBuffer;
          return arr;
        };
        var INVALID_BASE64_RE = /[^+\/0-9A-z]/g;
        function base64clean(str) {
          str = stringtrim(str).replace(INVALID_BASE64_RE, '');
          while (str.length % 4 !== 0) {
            str = str + '=';
          }
          return str;
        }
        function stringtrim(str) {
          if (str.trim)
            return str.trim();
          return str.replace(/^\s+|\s+$/g, '');
        }
        function isArrayish(subject) {
          return isArray(subject) || Buffer.isBuffer(subject) || subject && typeof subject === 'object' && typeof subject.length === 'number';
        }
        function toHex(n) {
          if (n < 16)
            return '0' + n.toString(16);
          return n.toString(16);
        }
        function utf8ToBytes(str) {
          var byteArray = [];
          for (var i = 0; i < str.length; i++) {
            var b = str.charCodeAt(i);
            if (b <= 0x7F) {
              byteArray.push(b);
            } else {
              var start = i;
              if (b >= 0xD800 && b <= 0xDFFF)
                i++;
              var h = encodeURIComponent(str.slice(start, i + 1)).substr(1).split('%');
              for (var j = 0; j < h.length; j++) {
                byteArray.push(parseInt(h[j], 16));
              }
            }
          }
          return byteArray;
        }
        function asciiToBytes(str) {
          var byteArray = [];
          for (var i = 0; i < str.length; i++) {
            byteArray.push(str.charCodeAt(i) & 0xFF);
          }
          return byteArray;
        }
        function utf16leToBytes(str) {
          var c,
              hi,
              lo;
          var byteArray = [];
          for (var i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            hi = c >> 8;
            lo = c % 256;
            byteArray.push(lo);
            byteArray.push(hi);
          }
          return byteArray;
        }
        function base64ToBytes(str) {
          return base64.toByteArray(str);
        }
        function blitBuffer(src, dst, offset, length) {
          for (var i = 0; i < length; i++) {
            if ((i + offset >= dst.length) || (i >= src.length))
              break;
            dst[i + offset] = src[i];
          }
          return i;
        }
        function decodeUtf8Char(str) {
          try {
            return decodeURIComponent(str);
          } catch (err) {
            return String.fromCharCode(0xFFFD);
          }
        }
      }, {
        "base64-js": 3,
        "ieee754": 4,
        "is-array": 5
      }],
      3: [function(_dereq_, module, exports) {
        var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        ;
        (function(exports) {
          'use strict';
          var Arr = (typeof Uint8Array !== 'undefined') ? Uint8Array : Array;
          var PLUS = '+'.charCodeAt(0);
          var SLASH = '/'.charCodeAt(0);
          var NUMBER = '0'.charCodeAt(0);
          var LOWER = 'a'.charCodeAt(0);
          var UPPER = 'A'.charCodeAt(0);
          function decode(elt) {
            var code = elt.charCodeAt(0);
            if (code === PLUS)
              return 62;
            if (code === SLASH)
              return 63;
            if (code < NUMBER)
              return -1;
            if (code < NUMBER + 10)
              return code - NUMBER + 26 + 26;
            if (code < UPPER + 26)
              return code - UPPER;
            if (code < LOWER + 26)
              return code - LOWER + 26;
          }
          function b64ToByteArray(b64) {
            var i,
                j,
                l,
                tmp,
                placeHolders,
                arr;
            if (b64.length % 4 > 0) {
              throw new Error('Invalid string. Length must be a multiple of 4');
            }
            var len = b64.length;
            placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0;
            arr = new Arr(b64.length * 3 / 4 - placeHolders);
            l = placeHolders > 0 ? b64.length - 4 : b64.length;
            var L = 0;
            function push(v) {
              arr[L++] = v;
            }
            for (i = 0, j = 0; i < l; i += 4, j += 3) {
              tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
              push((tmp & 0xFF0000) >> 16);
              push((tmp & 0xFF00) >> 8);
              push(tmp & 0xFF);
            }
            if (placeHolders === 2) {
              tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
              push(tmp & 0xFF);
            } else if (placeHolders === 1) {
              tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
              push((tmp >> 8) & 0xFF);
              push(tmp & 0xFF);
            }
            return arr;
          }
          function uint8ToBase64(uint8) {
            var i,
                extraBytes = uint8.length % 3,
                output = "",
                temp,
                length;
            function encode(num) {
              return lookup.charAt(num);
            }
            function tripletToBase64(num) {
              return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
            }
            for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
              temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
              output += tripletToBase64(temp);
            }
            switch (extraBytes) {
              case 1:
                temp = uint8[uint8.length - 1];
                output += encode(temp >> 2);
                output += encode((temp << 4) & 0x3F);
                output += '==';
                break;
              case 2:
                temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
                output += encode(temp >> 10);
                output += encode((temp >> 4) & 0x3F);
                output += encode((temp << 2) & 0x3F);
                output += '=';
                break;
            }
            return output;
          }
          exports.toByteArray = b64ToByteArray;
          exports.fromByteArray = uint8ToBase64;
        }(typeof exports === 'undefined' ? (this.base64js = {}) : exports));
      }, {}],
      4: [function(_dereq_, module, exports) {
        exports.read = function(buffer, offset, isLE, mLen, nBytes) {
          var e,
              m,
              eLen = nBytes * 8 - mLen - 1,
              eMax = (1 << eLen) - 1,
              eBias = eMax >> 1,
              nBits = -7,
              i = isLE ? (nBytes - 1) : 0,
              d = isLE ? -1 : 1,
              s = buffer[offset + i];
          i += d;
          e = s & ((1 << (-nBits)) - 1);
          s >>= (-nBits);
          nBits += eLen;
          for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8)
            ;
          m = e & ((1 << (-nBits)) - 1);
          e >>= (-nBits);
          nBits += mLen;
          for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8)
            ;
          if (e === 0) {
            e = 1 - eBias;
          } else if (e === eMax) {
            return m ? NaN : ((s ? -1 : 1) * Infinity);
          } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
          }
          return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
        };
        exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
          var e,
              m,
              c,
              eLen = nBytes * 8 - mLen - 1,
              eMax = (1 << eLen) - 1,
              eBias = eMax >> 1,
              rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
              i = isLE ? 0 : (nBytes - 1),
              d = isLE ? 1 : -1,
              s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;
          value = Math.abs(value);
          if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
          } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
              e--;
              c *= 2;
            }
            if (e + eBias >= 1) {
              value += rt / c;
            } else {
              value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
              e++;
              c /= 2;
            }
            if (e + eBias >= eMax) {
              m = 0;
              e = eMax;
            } else if (e + eBias >= 1) {
              m = (value * c - 1) * Math.pow(2, mLen);
              e = e + eBias;
            } else {
              m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
              e = 0;
            }
          }
          for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8)
            ;
          e = (e << mLen) | m;
          eLen += mLen;
          for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8)
            ;
          buffer[offset + i - d] |= s * 128;
        };
      }, {}],
      5: [function(_dereq_, module, exports) {
        var isArray = Array.isArray;
        var str = Object.prototype.toString;
        module.exports = isArray || function(val) {
          return !!val && '[object Array]' == str.call(val);
        };
      }, {}],
      6: [function(_dereq_, module, exports) {
        (function(process) {
          function normalizeArray(parts, allowAboveRoot) {
            var up = 0;
            for (var i = parts.length - 1; i >= 0; i--) {
              var last = parts[i];
              if (last === '.') {
                parts.splice(i, 1);
              } else if (last === '..') {
                parts.splice(i, 1);
                up++;
              } else if (up) {
                parts.splice(i, 1);
                up--;
              }
            }
            if (allowAboveRoot) {
              for (; up--; up) {
                parts.unshift('..');
              }
            }
            return parts;
          }
          var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
          var splitPath = function(filename) {
            return splitPathRe.exec(filename).slice(1);
          };
          exports.resolve = function() {
            var resolvedPath = '',
                resolvedAbsolute = false;
            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
              var path = (i >= 0) ? arguments[i] : process.cwd();
              if (typeof path !== 'string') {
                throw new TypeError('Arguments to path.resolve must be strings');
              } else if (!path) {
                continue;
              }
              resolvedPath = path + '/' + resolvedPath;
              resolvedAbsolute = path.charAt(0) === '/';
            }
            resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
              return !!p;
            }), !resolvedAbsolute).join('/');
            return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
          };
          exports.normalize = function(path) {
            var isAbsolute = exports.isAbsolute(path),
                trailingSlash = substr(path, -1) === '/';
            path = normalizeArray(filter(path.split('/'), function(p) {
              return !!p;
            }), !isAbsolute).join('/');
            if (!path && !isAbsolute) {
              path = '.';
            }
            if (path && trailingSlash) {
              path += '/';
            }
            return (isAbsolute ? '/' : '') + path;
          };
          exports.isAbsolute = function(path) {
            return path.charAt(0) === '/';
          };
          exports.join = function() {
            var paths = Array.prototype.slice.call(arguments, 0);
            return exports.normalize(filter(paths, function(p, index) {
              if (typeof p !== 'string') {
                throw new TypeError('Arguments to path.join must be strings');
              }
              return p;
            }).join('/'));
          };
          exports.relative = function(from, to) {
            from = exports.resolve(from).substr(1);
            to = exports.resolve(to).substr(1);
            function trim(arr) {
              var start = 0;
              for (; start < arr.length; start++) {
                if (arr[start] !== '')
                  break;
              }
              var end = arr.length - 1;
              for (; end >= 0; end--) {
                if (arr[end] !== '')
                  break;
              }
              if (start > end)
                return [];
              return arr.slice(start, end - start + 1);
            }
            var fromParts = trim(from.split('/'));
            var toParts = trim(to.split('/'));
            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
              if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
              }
            }
            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
              outputParts.push('..');
            }
            outputParts = outputParts.concat(toParts.slice(samePartsLength));
            return outputParts.join('/');
          };
          exports.sep = '/';
          exports.delimiter = ':';
          exports.dirname = function(path) {
            var result = splitPath(path),
                root = result[0],
                dir = result[1];
            if (!root && !dir) {
              return '.';
            }
            if (dir) {
              dir = dir.substr(0, dir.length - 1);
            }
            return root + dir;
          };
          exports.basename = function(path, ext) {
            var f = splitPath(path)[2];
            if (ext && f.substr(-1 * ext.length) === ext) {
              f = f.substr(0, f.length - ext.length);
            }
            return f;
          };
          exports.extname = function(path) {
            return splitPath(path)[3];
          };
          function filter(xs, f) {
            if (xs.filter)
              return xs.filter(f);
            var res = [];
            for (var i = 0; i < xs.length; i++) {
              if (f(xs[i], i, xs))
                res.push(xs[i]);
            }
            return res;
          }
          var substr = 'ab'.substr(-1) === 'b' ? function(str, start, len) {
            return str.substr(start, len);
          } : function(str, start, len) {
            if (start < 0)
              start = str.length + start;
            return str.substr(start, len);
          };
          ;
        }).call(this, _dereq_('_process'));
      }, {"_process": 7}],
      7: [function(_dereq_, module, exports) {
        var process = module.exports = {};
        process.nextTick = (function() {
          var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
          var canMutationObserver = typeof window !== 'undefined' && window.MutationObserver;
          var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;
          ;
          if (canSetImmediate) {
            return function(f) {
              return window.setImmediate(f);
            };
          }
          var queue = [];
          if (canMutationObserver) {
            var hiddenDiv = document.createElement("div");
            var observer = new MutationObserver(function() {
              var queueList = queue.slice();
              queue.length = 0;
              queueList.forEach(function(fn) {
                fn();
              });
            });
            observer.observe(hiddenDiv, {attributes: true});
            return function nextTick(fn) {
              if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
              }
              queue.push(fn);
            };
          }
          if (canPost) {
            window.addEventListener('message', function(ev) {
              var source = ev.source;
              if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                  var fn = queue.shift();
                  fn();
                }
              }
            }, true);
            return function nextTick(fn) {
              queue.push(fn);
              window.postMessage('process-tick', '*');
            };
          }
          return function nextTick(fn) {
            setTimeout(fn, 0);
          };
        })();
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.binding = function(name) {
          throw new Error('process.binding is not supported');
        };
        process.cwd = function() {
          return '/';
        };
        process.chdir = function(dir) {
          throw new Error('process.chdir is not supported');
        };
      }, {}],
      8: [function(_dereq_, module, exports) {
        var Base62 = (function(my) {
          my.chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
          my.encode = function(i) {
            if (i === 0) {
              return '0';
            }
            var s = '';
            while (i > 0) {
              s = this.chars[i % 62] + s;
              i = Math.floor(i / 62);
            }
            return s;
          };
          my.decode = function(a, b, c, d) {
            for (b = c = (a === (/\W|_|^$/.test(a += "") || a)) - 1; d = a.charCodeAt(c++); )
              b = b * 62 + d - [, 48, 29, 87][d >> 5];
            return b;
          };
          return my;
        }({}));
        module.exports = Base62;
      }, {}],
      9: [function(_dereq_, module, exports) {
        (function(root, factory) {
          'use strict';
          if (typeof define === 'function' && define.amd) {
            define(['exports'], factory);
          } else if (typeof exports !== 'undefined') {
            factory(exports);
          } else {
            factory((root.esprima = {}));
          }
        }(this, function(exports) {
          'use strict';
          var Token,
              TokenName,
              FnExprTokens,
              Syntax,
              PropertyKind,
              Messages,
              Regex,
              SyntaxTreeDelegate,
              XHTMLEntities,
              ClassPropertyType,
              source,
              strict,
              index,
              lineNumber,
              lineStart,
              length,
              delegate,
              lookahead,
              state,
              extra;
          Token = {
            BooleanLiteral: 1,
            EOF: 2,
            Identifier: 3,
            Keyword: 4,
            NullLiteral: 5,
            NumericLiteral: 6,
            Punctuator: 7,
            StringLiteral: 8,
            RegularExpression: 9,
            Template: 10,
            XJSIdentifier: 11,
            XJSText: 12
          };
          TokenName = {};
          TokenName[Token.BooleanLiteral] = 'Boolean';
          TokenName[Token.EOF] = '<end>';
          TokenName[Token.Identifier] = 'Identifier';
          TokenName[Token.Keyword] = 'Keyword';
          TokenName[Token.NullLiteral] = 'Null';
          TokenName[Token.NumericLiteral] = 'Numeric';
          TokenName[Token.Punctuator] = 'Punctuator';
          TokenName[Token.StringLiteral] = 'String';
          TokenName[Token.XJSIdentifier] = 'XJSIdentifier';
          TokenName[Token.XJSText] = 'XJSText';
          TokenName[Token.RegularExpression] = 'RegularExpression';
          FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new', 'return', 'case', 'delete', 'throw', 'void', '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', ',', '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&', '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=', '<=', '<', '>', '!=', '!=='];
          Syntax = {
            AnyTypeAnnotation: 'AnyTypeAnnotation',
            ArrayExpression: 'ArrayExpression',
            ArrayPattern: 'ArrayPattern',
            ArrayTypeAnnotation: 'ArrayTypeAnnotation',
            ArrowFunctionExpression: 'ArrowFunctionExpression',
            AssignmentExpression: 'AssignmentExpression',
            BinaryExpression: 'BinaryExpression',
            BlockStatement: 'BlockStatement',
            BooleanTypeAnnotation: 'BooleanTypeAnnotation',
            BreakStatement: 'BreakStatement',
            CallExpression: 'CallExpression',
            CatchClause: 'CatchClause',
            ClassBody: 'ClassBody',
            ClassDeclaration: 'ClassDeclaration',
            ClassExpression: 'ClassExpression',
            ClassImplements: 'ClassImplements',
            ClassProperty: 'ClassProperty',
            ComprehensionBlock: 'ComprehensionBlock',
            ComprehensionExpression: 'ComprehensionExpression',
            ConditionalExpression: 'ConditionalExpression',
            ContinueStatement: 'ContinueStatement',
            DebuggerStatement: 'DebuggerStatement',
            DeclareClass: 'DeclareClass',
            DeclareFunction: 'DeclareFunction',
            DeclareModule: 'DeclareModule',
            DeclareVariable: 'DeclareVariable',
            DoWhileStatement: 'DoWhileStatement',
            EmptyStatement: 'EmptyStatement',
            ExportDeclaration: 'ExportDeclaration',
            ExportBatchSpecifier: 'ExportBatchSpecifier',
            ExportSpecifier: 'ExportSpecifier',
            ExpressionStatement: 'ExpressionStatement',
            ForInStatement: 'ForInStatement',
            ForOfStatement: 'ForOfStatement',
            ForStatement: 'ForStatement',
            FunctionDeclaration: 'FunctionDeclaration',
            FunctionExpression: 'FunctionExpression',
            FunctionTypeAnnotation: 'FunctionTypeAnnotation',
            FunctionTypeParam: 'FunctionTypeParam',
            GenericTypeAnnotation: 'GenericTypeAnnotation',
            Identifier: 'Identifier',
            IfStatement: 'IfStatement',
            ImportDeclaration: 'ImportDeclaration',
            ImportDefaultSpecifier: 'ImportDefaultSpecifier',
            ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
            ImportSpecifier: 'ImportSpecifier',
            InterfaceDeclaration: 'InterfaceDeclaration',
            InterfaceExtends: 'InterfaceExtends',
            IntersectionTypeAnnotation: 'IntersectionTypeAnnotation',
            LabeledStatement: 'LabeledStatement',
            Literal: 'Literal',
            LogicalExpression: 'LogicalExpression',
            MemberExpression: 'MemberExpression',
            MethodDefinition: 'MethodDefinition',
            ModuleSpecifier: 'ModuleSpecifier',
            NewExpression: 'NewExpression',
            NullableTypeAnnotation: 'NullableTypeAnnotation',
            NumberTypeAnnotation: 'NumberTypeAnnotation',
            ObjectExpression: 'ObjectExpression',
            ObjectPattern: 'ObjectPattern',
            ObjectTypeAnnotation: 'ObjectTypeAnnotation',
            ObjectTypeCallProperty: 'ObjectTypeCallProperty',
            ObjectTypeIndexer: 'ObjectTypeIndexer',
            ObjectTypeProperty: 'ObjectTypeProperty',
            Program: 'Program',
            Property: 'Property',
            QualifiedTypeIdentifier: 'QualifiedTypeIdentifier',
            ReturnStatement: 'ReturnStatement',
            SequenceExpression: 'SequenceExpression',
            SpreadElement: 'SpreadElement',
            SpreadProperty: 'SpreadProperty',
            StringLiteralTypeAnnotation: 'StringLiteralTypeAnnotation',
            StringTypeAnnotation: 'StringTypeAnnotation',
            SwitchCase: 'SwitchCase',
            SwitchStatement: 'SwitchStatement',
            TaggedTemplateExpression: 'TaggedTemplateExpression',
            TemplateElement: 'TemplateElement',
            TemplateLiteral: 'TemplateLiteral',
            ThisExpression: 'ThisExpression',
            ThrowStatement: 'ThrowStatement',
            TupleTypeAnnotation: 'TupleTypeAnnotation',
            TryStatement: 'TryStatement',
            TypeAlias: 'TypeAlias',
            TypeAnnotation: 'TypeAnnotation',
            TypeofTypeAnnotation: 'TypeofTypeAnnotation',
            TypeParameterDeclaration: 'TypeParameterDeclaration',
            TypeParameterInstantiation: 'TypeParameterInstantiation',
            UnaryExpression: 'UnaryExpression',
            UnionTypeAnnotation: 'UnionTypeAnnotation',
            UpdateExpression: 'UpdateExpression',
            VariableDeclaration: 'VariableDeclaration',
            VariableDeclarator: 'VariableDeclarator',
            VoidTypeAnnotation: 'VoidTypeAnnotation',
            WhileStatement: 'WhileStatement',
            WithStatement: 'WithStatement',
            XJSIdentifier: 'XJSIdentifier',
            XJSNamespacedName: 'XJSNamespacedName',
            XJSMemberExpression: 'XJSMemberExpression',
            XJSEmptyExpression: 'XJSEmptyExpression',
            XJSExpressionContainer: 'XJSExpressionContainer',
            XJSElement: 'XJSElement',
            XJSClosingElement: 'XJSClosingElement',
            XJSOpeningElement: 'XJSOpeningElement',
            XJSAttribute: 'XJSAttribute',
            XJSSpreadAttribute: 'XJSSpreadAttribute',
            XJSText: 'XJSText',
            YieldExpression: 'YieldExpression',
            AwaitExpression: 'AwaitExpression'
          };
          PropertyKind = {
            Data: 1,
            Get: 2,
            Set: 4
          };
          ClassPropertyType = {
            'static': 'static',
            prototype: 'prototype'
          };
          Messages = {
            UnexpectedToken: 'Unexpected token %0',
            UnexpectedNumber: 'Unexpected number',
            UnexpectedString: 'Unexpected string',
            UnexpectedIdentifier: 'Unexpected identifier',
            UnexpectedReserved: 'Unexpected reserved word',
            UnexpectedTemplate: 'Unexpected quasi %0',
            UnexpectedEOS: 'Unexpected end of input',
            NewlineAfterThrow: 'Illegal newline after throw',
            InvalidRegExp: 'Invalid regular expression',
            UnterminatedRegExp: 'Invalid regular expression: missing /',
            InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
            InvalidLHSInFormalsList: 'Invalid left-hand side in formals list',
            InvalidLHSInForIn: 'Invalid left-hand side in for-in',
            MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
            NoCatchOrFinally: 'Missing catch or finally after try',
            UnknownLabel: 'Undefined label \'%0\'',
            Redeclaration: '%0 \'%1\' has already been declared',
            IllegalContinue: 'Illegal continue statement',
            IllegalBreak: 'Illegal break statement',
            IllegalDuplicateClassProperty: 'Illegal duplicate property in class definition',
            IllegalReturn: 'Illegal return statement',
            IllegalSpread: 'Illegal spread element',
            StrictModeWith: 'Strict mode code may not include a with statement',
            StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
            StrictVarName: 'Variable name may not be eval or arguments in strict mode',
            StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
            StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
            ParameterAfterRestParameter: 'Rest parameter must be final parameter of an argument list',
            DefaultRestParameter: 'Rest parameter can not have a default value',
            ElementAfterSpreadElement: 'Spread must be the final element of an element list',
            PropertyAfterSpreadProperty: 'A rest property must be the final property of an object literal',
            ObjectPatternAsRestParameter: 'Invalid rest parameter',
            ObjectPatternAsSpread: 'Invalid spread argument',
            StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
            StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
            StrictDelete: 'Delete of an unqualified identifier in strict mode.',
            StrictDuplicateProperty: 'Duplicate data property in object literal not allowed in strict mode',
            AccessorDataProperty: 'Object literal may not have data and accessor property with the same name',
            AccessorGetSet: 'Object literal may not have multiple get/set accessors with the same name',
            StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
            StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
            StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
            StrictReservedWord: 'Use of future reserved word in strict mode',
            MissingFromClause: 'Missing from clause',
            NoAsAfterImportNamespace: 'Missing as after import *',
            InvalidModuleSpecifier: 'Invalid module specifier',
            NoUnintializedConst: 'Const must be initialized',
            ComprehensionRequiresBlock: 'Comprehension must have at least one block',
            ComprehensionError: 'Comprehension Error',
            EachNotAllowed: 'Each is not supported',
            InvalidXJSAttributeValue: 'XJS value should be either an expression or a quoted XJS text',
            ExpectedXJSClosingTag: 'Expected corresponding XJS closing tag for %0',
            AdjacentXJSElements: 'Adjacent XJS elements must be wrapped in an enclosing tag',
            ConfusedAboutFunctionType: 'Unexpected token =>. It looks like ' + 'you are trying to write a function type, but you ended up ' + 'writing a grouped type followed by an =>, which is a syntax ' + 'error. Remember, function type parameters are named so function ' + 'types look like (name1: type1, name2: type2) => returnType. You ' + 'probably wrote (type1) => returnType'
          };
          Regex = {
            NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
            NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
            LeadingZeros: new RegExp('^0+(?!$)')
          };
          function assert(condition, message) {
            if (!condition) {
              throw new Error('ASSERT: ' + message);
            }
          }
          function isDecimalDigit(ch) {
            return (ch >= 48 && ch <= 57);
          }
          function isHexDigit(ch) {
            return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
          }
          function isOctalDigit(ch) {
            return '01234567'.indexOf(ch) >= 0;
          }
          function isWhiteSpace(ch) {
            return (ch === 32) || (ch === 9) || (ch === 0xB) || (ch === 0xC) || (ch === 0xA0) || (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(String.fromCharCode(ch)) > 0);
          }
          function isLineTerminator(ch) {
            return (ch === 10) || (ch === 13) || (ch === 0x2028) || (ch === 0x2029);
          }
          function isIdentifierStart(ch) {
            return (ch === 36) || (ch === 95) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch === 92) || ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
          }
          function isIdentifierPart(ch) {
            return (ch === 36) || (ch === 95) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch >= 48 && ch <= 57) || (ch === 92) || ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
          }
          function isFutureReservedWord(id) {
            switch (id) {
              case 'class':
              case 'enum':
              case 'export':
              case 'extends':
              case 'import':
              case 'super':
                return true;
              default:
                return false;
            }
          }
          function isStrictModeReservedWord(id) {
            switch (id) {
              case 'implements':
              case 'interface':
              case 'package':
              case 'private':
              case 'protected':
              case 'public':
              case 'static':
              case 'yield':
              case 'let':
                return true;
              default:
                return false;
            }
          }
          function isRestrictedWord(id) {
            return id === 'eval' || id === 'arguments';
          }
          function isKeyword(id) {
            if (strict && isStrictModeReservedWord(id)) {
              return true;
            }
            switch (id.length) {
              case 2:
                return (id === 'if') || (id === 'in') || (id === 'do');
              case 3:
                return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try') || (id === 'let');
              case 4:
                return (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with') || (id === 'enum');
              case 5:
                return (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw') || (id === 'const') || (id === 'class') || (id === 'super');
              case 6:
                return (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch') || (id === 'export') || (id === 'import');
              case 7:
                return (id === 'default') || (id === 'finally') || (id === 'extends');
              case 8:
                return (id === 'function') || (id === 'continue') || (id === 'debugger');
              case 10:
                return (id === 'instanceof');
              default:
                return false;
            }
          }
          function skipComment() {
            var ch,
                blockComment,
                lineComment;
            blockComment = false;
            lineComment = false;
            while (index < length) {
              ch = source.charCodeAt(index);
              if (lineComment) {
                ++index;
                if (isLineTerminator(ch)) {
                  lineComment = false;
                  if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                  }
                  ++lineNumber;
                  lineStart = index;
                }
              } else if (blockComment) {
                if (isLineTerminator(ch)) {
                  if (ch === 13) {
                    ++index;
                  }
                  if (ch !== 13 || source.charCodeAt(index) === 10) {
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  }
                } else {
                  ch = source.charCodeAt(index++);
                  if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                  if (ch === 42) {
                    ch = source.charCodeAt(index);
                    if (ch === 47) {
                      ++index;
                      blockComment = false;
                    }
                  }
                }
              } else if (ch === 47) {
                ch = source.charCodeAt(index + 1);
                if (ch === 47) {
                  index += 2;
                  lineComment = true;
                } else if (ch === 42) {
                  index += 2;
                  blockComment = true;
                  if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                } else {
                  break;
                }
              } else if (isWhiteSpace(ch)) {
                ++index;
              } else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 13 && source.charCodeAt(index) === 10) {
                  ++index;
                }
                ++lineNumber;
                lineStart = index;
              } else {
                break;
              }
            }
          }
          function scanHexEscape(prefix) {
            var i,
                len,
                ch,
                code = 0;
            len = (prefix === 'u') ? 4 : 2;
            for (i = 0; i < len; ++i) {
              if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
              } else {
                return '';
              }
            }
            return String.fromCharCode(code);
          }
          function scanUnicodeCodePointEscape() {
            var ch,
                code,
                cu1,
                cu2;
            ch = source[index];
            code = 0;
            if (ch === '}') {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            while (index < length) {
              ch = source[index++];
              if (!isHexDigit(ch)) {
                break;
              }
              code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            }
            if (code > 0x10FFFF || ch !== '}') {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            if (code <= 0xFFFF) {
              return String.fromCharCode(code);
            }
            cu1 = ((code - 0x10000) >> 10) + 0xD800;
            cu2 = ((code - 0x10000) & 1023) + 0xDC00;
            return String.fromCharCode(cu1, cu2);
          }
          function getEscapedIdentifier() {
            var ch,
                id;
            ch = source.charCodeAt(index++);
            id = String.fromCharCode(ch);
            if (ch === 92) {
              if (source.charCodeAt(index) !== 117) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              ++index;
              ch = scanHexEscape('u');
              if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              id = ch;
            }
            while (index < length) {
              ch = source.charCodeAt(index);
              if (!isIdentifierPart(ch)) {
                break;
              }
              ++index;
              id += String.fromCharCode(ch);
              if (ch === 92) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 117) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                id += ch;
              }
            }
            return id;
          }
          function getIdentifier() {
            var start,
                ch;
            start = index++;
            while (index < length) {
              ch = source.charCodeAt(index);
              if (ch === 92) {
                index = start;
                return getEscapedIdentifier();
              }
              if (isIdentifierPart(ch)) {
                ++index;
              } else {
                break;
              }
            }
            return source.slice(start, index);
          }
          function scanIdentifier() {
            var start,
                id,
                type;
            start = index;
            id = (source.charCodeAt(index) === 92) ? getEscapedIdentifier() : getIdentifier();
            if (id.length === 1) {
              type = Token.Identifier;
            } else if (isKeyword(id)) {
              type = Token.Keyword;
            } else if (id === 'null') {
              type = Token.NullLiteral;
            } else if (id === 'true' || id === 'false') {
              type = Token.BooleanLiteral;
            } else {
              type = Token.Identifier;
            }
            return {
              type: type,
              value: id,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanPunctuator() {
            var start = index,
                code = source.charCodeAt(index),
                code2,
                ch1 = source[index],
                ch2,
                ch3,
                ch4;
            switch (code) {
              case 40:
              case 41:
              case 59:
              case 44:
              case 123:
              case 125:
              case 91:
              case 93:
              case 58:
              case 63:
              case 126:
                ++index;
                if (extra.tokenize) {
                  if (code === 40) {
                    extra.openParenToken = extra.tokens.length;
                  } else if (code === 123) {
                    extra.openCurlyToken = extra.tokens.length;
                  }
                }
                return {
                  type: Token.Punctuator,
                  value: String.fromCharCode(code),
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index]
                };
              default:
                code2 = source.charCodeAt(index + 1);
                if (code2 === 61) {
                  switch (code) {
                    case 37:
                    case 38:
                    case 42:
                    case 43:
                    case 45:
                    case 47:
                    case 60:
                    case 62:
                    case 94:
                    case 124:
                      index += 2;
                      return {
                        type: Token.Punctuator,
                        value: String.fromCharCode(code) + String.fromCharCode(code2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                      };
                    case 33:
                    case 61:
                      index += 2;
                      if (source.charCodeAt(index) === 61) {
                        ++index;
                      }
                      return {
                        type: Token.Punctuator,
                        value: source.slice(start, index),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                      };
                    default:
                      break;
                  }
                }
                break;
            }
            ch2 = source[index + 1];
            ch3 = source[index + 2];
            ch4 = source[index + 3];
            if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
              if (ch4 === '=') {
                index += 4;
                return {
                  type: Token.Punctuator,
                  value: '>>>=',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index]
                };
              }
            }
            if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
              index += 3;
              return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
              index += 3;
              return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
              index += 3;
              return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === '.' && ch2 === '.' && ch3 === '.') {
              index += 3;
              return {
                type: Token.Punctuator,
                value: '...',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0) && !state.inType) {
              index += 2;
              return {
                type: Token.Punctuator,
                value: ch1 + ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === '=' && ch2 === '>') {
              index += 2;
              return {
                type: Token.Punctuator,
                value: '=>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
              ++index;
              return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            if (ch1 === '.') {
              ++index;
              return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          function scanHexLiteral(start) {
            var number = '';
            while (index < length) {
              if (!isHexDigit(source[index])) {
                break;
              }
              number += source[index++];
            }
            if (number.length === 0) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            if (isIdentifierStart(source.charCodeAt(index))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            return {
              type: Token.NumericLiteral,
              value: parseInt('0x' + number, 16),
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanOctalLiteral(prefix, start) {
            var number,
                octal;
            if (isOctalDigit(prefix)) {
              octal = true;
              number = '0' + source[index++];
            } else {
              octal = false;
              ++index;
              number = '';
            }
            while (index < length) {
              if (!isOctalDigit(source[index])) {
                break;
              }
              number += source[index++];
            }
            if (!octal && number.length === 0) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            return {
              type: Token.NumericLiteral,
              value: parseInt(number, 8),
              octal: octal,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanNumericLiteral() {
            var number,
                start,
                ch,
                octal;
            ch = source[index];
            assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
            start = index;
            number = '';
            if (ch !== '.') {
              number = source[index++];
              ch = source[index];
              if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                  ++index;
                  return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                  ++index;
                  number = '';
                  while (index < length) {
                    ch = source[index];
                    if (ch !== '0' && ch !== '1') {
                      break;
                    }
                    number += source[index++];
                  }
                  if (number.length === 0) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                  if (index < length) {
                    ch = source.charCodeAt(index);
                    if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  }
                  return {
                    type: Token.NumericLiteral,
                    value: parseInt(number, 2),
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                  };
                }
                if (ch === 'o' || ch === 'O' || isOctalDigit(ch)) {
                  return scanOctalLiteral(ch, start);
                }
                if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
              }
              while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
              }
              ch = source[index];
            }
            if (ch === '.') {
              number += source[index++];
              while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
              }
              ch = source[index];
            }
            if (ch === 'e' || ch === 'E') {
              number += source[index++];
              ch = source[index];
              if (ch === '+' || ch === '-') {
                number += source[index++];
              }
              if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                  number += source[index++];
                }
              } else {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
            }
            if (isIdentifierStart(source.charCodeAt(index))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            return {
              type: Token.NumericLiteral,
              value: parseFloat(number),
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanStringLiteral() {
            var str = '',
                quote,
                start,
                ch,
                code,
                unescaped,
                restore,
                octal = false;
            quote = source[index];
            assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
            start = index;
            ++index;
            while (index < length) {
              ch = source[index++];
              if (ch === quote) {
                quote = '';
                break;
              } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                  switch (ch) {
                    case 'n':
                      str += '\n';
                      break;
                    case 'r':
                      str += '\r';
                      break;
                    case 't':
                      str += '\t';
                      break;
                    case 'u':
                    case 'x':
                      if (source[index] === '{') {
                        ++index;
                        str += scanUnicodeCodePointEscape();
                      } else {
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                          str += unescaped;
                        } else {
                          index = restore;
                          str += ch;
                        }
                      }
                      break;
                    case 'b':
                      str += '\b';
                      break;
                    case 'f':
                      str += '\f';
                      break;
                    case 'v':
                      str += '\x0B';
                      break;
                    default:
                      if (isOctalDigit(ch)) {
                        code = '01234567'.indexOf(ch);
                        if (code !== 0) {
                          octal = true;
                        }
                        if (index < length && isOctalDigit(source[index])) {
                          octal = true;
                          code = code * 8 + '01234567'.indexOf(source[index++]);
                          if ('0123'.indexOf(ch) >= 0 && index < length && isOctalDigit(source[index])) {
                            code = code * 8 + '01234567'.indexOf(source[index++]);
                          }
                        }
                        str += String.fromCharCode(code);
                      } else {
                        str += ch;
                      }
                      break;
                  }
                } else {
                  ++lineNumber;
                  if (ch === '\r' && source[index] === '\n') {
                    ++index;
                  }
                  lineStart = index;
                }
              } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
              } else {
                str += ch;
              }
            }
            if (quote !== '') {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            return {
              type: Token.StringLiteral,
              value: str,
              octal: octal,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanTemplate() {
            var cooked = '',
                ch,
                start,
                terminated,
                tail,
                restore,
                unescaped,
                code,
                octal;
            terminated = false;
            tail = false;
            start = index;
            ++index;
            while (index < length) {
              ch = source[index++];
              if (ch === '`') {
                tail = true;
                terminated = true;
                break;
              } else if (ch === '$') {
                if (source[index] === '{') {
                  ++index;
                  terminated = true;
                  break;
                }
                cooked += ch;
              } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                  switch (ch) {
                    case 'n':
                      cooked += '\n';
                      break;
                    case 'r':
                      cooked += '\r';
                      break;
                    case 't':
                      cooked += '\t';
                      break;
                    case 'u':
                    case 'x':
                      if (source[index] === '{') {
                        ++index;
                        cooked += scanUnicodeCodePointEscape();
                      } else {
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                          cooked += unescaped;
                        } else {
                          index = restore;
                          cooked += ch;
                        }
                      }
                      break;
                    case 'b':
                      cooked += '\b';
                      break;
                    case 'f':
                      cooked += '\f';
                      break;
                    case 'v':
                      cooked += '\v';
                      break;
                    default:
                      if (isOctalDigit(ch)) {
                        code = '01234567'.indexOf(ch);
                        if (code !== 0) {
                          octal = true;
                        }
                        if (index < length && isOctalDigit(source[index])) {
                          octal = true;
                          code = code * 8 + '01234567'.indexOf(source[index++]);
                          if ('0123'.indexOf(ch) >= 0 && index < length && isOctalDigit(source[index])) {
                            code = code * 8 + '01234567'.indexOf(source[index++]);
                          }
                        }
                        cooked += String.fromCharCode(code);
                      } else {
                        cooked += ch;
                      }
                      break;
                  }
                } else {
                  ++lineNumber;
                  if (ch === '\r' && source[index] === '\n') {
                    ++index;
                  }
                  lineStart = index;
                }
              } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                  ++index;
                }
                lineStart = index;
                cooked += '\n';
              } else {
                cooked += ch;
              }
            }
            if (!terminated) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            return {
              type: Token.Template,
              value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - ((tail) ? 1 : 2))
              },
              tail: tail,
              octal: octal,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanTemplateElement(option) {
            var startsWith,
                template;
            lookahead = null;
            skipComment();
            startsWith = (option.head) ? '`' : '}';
            if (source[index] !== startsWith) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            template = scanTemplate();
            peek();
            return template;
          }
          function scanRegExp() {
            var str,
                ch,
                start,
                pattern,
                flags,
                value,
                classMarker = false,
                restore,
                terminated = false,
                tmp;
            lookahead = null;
            skipComment();
            start = index;
            ch = source[index];
            assert(ch === '/', 'Regular expression literal must start with a slash');
            str = source[index++];
            while (index < length) {
              ch = source[index++];
              str += ch;
              if (classMarker) {
                if (ch === ']') {
                  classMarker = false;
                }
              } else {
                if (ch === '\\') {
                  ch = source[index++];
                  if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                  }
                  str += ch;
                } else if (ch === '/') {
                  terminated = true;
                  break;
                } else if (ch === '[') {
                  classMarker = true;
                } else if (isLineTerminator(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnterminatedRegExp);
                }
              }
            }
            if (!terminated) {
              throwError({}, Messages.UnterminatedRegExp);
            }
            pattern = str.substr(1, str.length - 2);
            flags = '';
            while (index < length) {
              ch = source[index];
              if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
              }
              ++index;
              if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                  ++index;
                  restore = index;
                  ch = scanHexEscape('u');
                  if (ch) {
                    flags += ch;
                    for (str += '\\u'; restore < index; ++restore) {
                      str += source[restore];
                    }
                  } else {
                    index = restore;
                    flags += 'u';
                    str += '\\u';
                  }
                } else {
                  str += '\\';
                }
              } else {
                flags += ch;
                str += ch;
              }
            }
            tmp = pattern;
            if (flags.indexOf('u') >= 0) {
              tmp = tmp.replace(/\\u\{([0-9a-fA-F]{5,6})\}/g, 'x').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
            }
            try {
              value = new RegExp(tmp);
            } catch (e) {
              throwError({}, Messages.InvalidRegExp);
            }
            try {
              value = new RegExp(pattern, flags);
            } catch (exception) {
              value = null;
            }
            peek();
            if (extra.tokenize) {
              return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                  pattern: pattern,
                  flags: flags
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
              };
            }
            return {
              literal: str,
              value: value,
              regex: {
                pattern: pattern,
                flags: flags
              },
              range: [start, index]
            };
          }
          function isIdentifierName(token) {
            return token.type === Token.Identifier || token.type === Token.Keyword || token.type === Token.BooleanLiteral || token.type === Token.NullLiteral;
          }
          function advanceSlash() {
            var prevToken,
                checkToken;
            prevToken = extra.tokens[extra.tokens.length - 1];
            if (!prevToken) {
              return scanRegExp();
            }
            if (prevToken.type === 'Punctuator') {
              if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken && checkToken.type === 'Keyword' && (checkToken.value === 'if' || checkToken.value === 'while' || checkToken.value === 'for' || checkToken.value === 'with')) {
                  return scanRegExp();
                }
                return scanPunctuator();
              }
              if (prevToken.value === '}') {
                if (extra.tokens[extra.openCurlyToken - 3] && extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                  checkToken = extra.tokens[extra.openCurlyToken - 4];
                  if (!checkToken) {
                    return scanPunctuator();
                  }
                } else if (extra.tokens[extra.openCurlyToken - 4] && extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                  checkToken = extra.tokens[extra.openCurlyToken - 5];
                  if (!checkToken) {
                    return scanRegExp();
                  }
                } else {
                  return scanPunctuator();
                }
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                  return scanPunctuator();
                }
                return scanRegExp();
              }
              return scanRegExp();
            }
            if (prevToken.type === 'Keyword') {
              return scanRegExp();
            }
            return scanPunctuator();
          }
          function advance() {
            var ch;
            if (!state.inXJSChild) {
              skipComment();
            }
            if (index >= length) {
              return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
              };
            }
            if (state.inXJSChild) {
              return advanceXJSChild();
            }
            ch = source.charCodeAt(index);
            if (ch === 40 || ch === 41 || ch === 58) {
              return scanPunctuator();
            }
            if (ch === 39 || ch === 34) {
              if (state.inXJSTag) {
                return scanXJSStringLiteral();
              }
              return scanStringLiteral();
            }
            if (state.inXJSTag && isXJSIdentifierStart(ch)) {
              return scanXJSIdentifier();
            }
            if (ch === 96) {
              return scanTemplate();
            }
            if (isIdentifierStart(ch)) {
              return scanIdentifier();
            }
            if (ch === 46) {
              if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
              }
              return scanPunctuator();
            }
            if (isDecimalDigit(ch)) {
              return scanNumericLiteral();
            }
            if (extra.tokenize && ch === 47) {
              return advanceSlash();
            }
            return scanPunctuator();
          }
          function lex() {
            var token;
            token = lookahead;
            index = token.range[1];
            lineNumber = token.lineNumber;
            lineStart = token.lineStart;
            lookahead = advance();
            index = token.range[1];
            lineNumber = token.lineNumber;
            lineStart = token.lineStart;
            return token;
          }
          function peek() {
            var pos,
                line,
                start;
            pos = index;
            line = lineNumber;
            start = lineStart;
            lookahead = advance();
            index = pos;
            lineNumber = line;
            lineStart = start;
          }
          function lookahead2() {
            var adv,
                pos,
                line,
                start,
                result;
            adv = (typeof extra.advance === 'function') ? extra.advance : advance;
            pos = index;
            line = lineNumber;
            start = lineStart;
            if (lookahead === null) {
              lookahead = adv();
            }
            index = lookahead.range[1];
            lineNumber = lookahead.lineNumber;
            lineStart = lookahead.lineStart;
            result = adv();
            index = pos;
            lineNumber = line;
            lineStart = start;
            return result;
          }
          function rewind(token) {
            index = token.range[0];
            lineNumber = token.lineNumber;
            lineStart = token.lineStart;
            lookahead = token;
          }
          function markerCreate() {
            if (!extra.loc && !extra.range) {
              return undefined;
            }
            skipComment();
            return {
              offset: index,
              line: lineNumber,
              col: index - lineStart
            };
          }
          function markerCreatePreserveWhitespace() {
            if (!extra.loc && !extra.range) {
              return undefined;
            }
            return {
              offset: index,
              line: lineNumber,
              col: index - lineStart
            };
          }
          function processComment(node) {
            var lastChild,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                last = bottomRight[bottomRight.length - 1];
            if (node.type === Syntax.Program) {
              if (node.body.length > 0) {
                return ;
              }
            }
            if (extra.trailingComments.length > 0) {
              if (extra.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.trailingComments;
                extra.trailingComments = [];
              } else {
                extra.trailingComments.length = 0;
              }
            } else {
              if (last && last.trailingComments && last.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = last.trailingComments;
                delete last.trailingComments;
              }
            }
            if (last) {
              while (last && last.range[0] >= node.range[0]) {
                lastChild = last;
                last = bottomRight.pop();
              }
            }
            if (lastChild) {
              if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = lastChild.leadingComments;
                delete lastChild.leadingComments;
              }
            } else if (extra.leadingComments.length > 0 && extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
              node.leadingComments = extra.leadingComments;
              extra.leadingComments = [];
            }
            if (trailingComments) {
              node.trailingComments = trailingComments;
            }
            bottomRight.push(node);
          }
          function markerApply(marker, node) {
            if (extra.range) {
              node.range = [marker.offset, index];
            }
            if (extra.loc) {
              node.loc = {
                start: {
                  line: marker.line,
                  column: marker.col
                },
                end: {
                  line: lineNumber,
                  column: index - lineStart
                }
              };
              node = delegate.postProcess(node);
            }
            if (extra.attachComment) {
              processComment(node);
            }
            return node;
          }
          SyntaxTreeDelegate = {
            name: 'SyntaxTree',
            postProcess: function(node) {
              return node;
            },
            createArrayExpression: function(elements) {
              return {
                type: Syntax.ArrayExpression,
                elements: elements
              };
            },
            createAssignmentExpression: function(operator, left, right) {
              return {
                type: Syntax.AssignmentExpression,
                operator: operator,
                left: left,
                right: right
              };
            },
            createBinaryExpression: function(operator, left, right) {
              var type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
              return {
                type: type,
                operator: operator,
                left: left,
                right: right
              };
            },
            createBlockStatement: function(body) {
              return {
                type: Syntax.BlockStatement,
                body: body
              };
            },
            createBreakStatement: function(label) {
              return {
                type: Syntax.BreakStatement,
                label: label
              };
            },
            createCallExpression: function(callee, args) {
              return {
                type: Syntax.CallExpression,
                callee: callee,
                'arguments': args
              };
            },
            createCatchClause: function(param, body) {
              return {
                type: Syntax.CatchClause,
                param: param,
                body: body
              };
            },
            createConditionalExpression: function(test, consequent, alternate) {
              return {
                type: Syntax.ConditionalExpression,
                test: test,
                consequent: consequent,
                alternate: alternate
              };
            },
            createContinueStatement: function(label) {
              return {
                type: Syntax.ContinueStatement,
                label: label
              };
            },
            createDebuggerStatement: function() {
              return {type: Syntax.DebuggerStatement};
            },
            createDoWhileStatement: function(body, test) {
              return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test
              };
            },
            createEmptyStatement: function() {
              return {type: Syntax.EmptyStatement};
            },
            createExpressionStatement: function(expression) {
              return {
                type: Syntax.ExpressionStatement,
                expression: expression
              };
            },
            createForStatement: function(init, test, update, body) {
              return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
              };
            },
            createForInStatement: function(left, right, body) {
              return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
              };
            },
            createForOfStatement: function(left, right, body) {
              return {
                type: Syntax.ForOfStatement,
                left: left,
                right: right,
                body: body
              };
            },
            createFunctionDeclaration: function(id, params, defaults, body, rest, generator, expression, isAsync, returnType, typeParameters) {
              var funDecl = {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: generator,
                expression: expression,
                returnType: returnType,
                typeParameters: typeParameters
              };
              if (isAsync) {
                funDecl.async = true;
              }
              return funDecl;
            },
            createFunctionExpression: function(id, params, defaults, body, rest, generator, expression, isAsync, returnType, typeParameters) {
              var funExpr = {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: generator,
                expression: expression,
                returnType: returnType,
                typeParameters: typeParameters
              };
              if (isAsync) {
                funExpr.async = true;
              }
              return funExpr;
            },
            createIdentifier: function(name) {
              return {
                type: Syntax.Identifier,
                name: name,
                typeAnnotation: undefined,
                optional: undefined
              };
            },
            createTypeAnnotation: function(typeAnnotation) {
              return {
                type: Syntax.TypeAnnotation,
                typeAnnotation: typeAnnotation
              };
            },
            createFunctionTypeAnnotation: function(params, returnType, rest, typeParameters) {
              return {
                type: Syntax.FunctionTypeAnnotation,
                params: params,
                returnType: returnType,
                rest: rest,
                typeParameters: typeParameters
              };
            },
            createFunctionTypeParam: function(name, typeAnnotation, optional) {
              return {
                type: Syntax.FunctionTypeParam,
                name: name,
                typeAnnotation: typeAnnotation,
                optional: optional
              };
            },
            createNullableTypeAnnotation: function(typeAnnotation) {
              return {
                type: Syntax.NullableTypeAnnotation,
                typeAnnotation: typeAnnotation
              };
            },
            createArrayTypeAnnotation: function(elementType) {
              return {
                type: Syntax.ArrayTypeAnnotation,
                elementType: elementType
              };
            },
            createGenericTypeAnnotation: function(id, typeParameters) {
              return {
                type: Syntax.GenericTypeAnnotation,
                id: id,
                typeParameters: typeParameters
              };
            },
            createQualifiedTypeIdentifier: function(qualification, id) {
              return {
                type: Syntax.QualifiedTypeIdentifier,
                qualification: qualification,
                id: id
              };
            },
            createTypeParameterDeclaration: function(params) {
              return {
                type: Syntax.TypeParameterDeclaration,
                params: params
              };
            },
            createTypeParameterInstantiation: function(params) {
              return {
                type: Syntax.TypeParameterInstantiation,
                params: params
              };
            },
            createAnyTypeAnnotation: function() {
              return {type: Syntax.AnyTypeAnnotation};
            },
            createBooleanTypeAnnotation: function() {
              return {type: Syntax.BooleanTypeAnnotation};
            },
            createNumberTypeAnnotation: function() {
              return {type: Syntax.NumberTypeAnnotation};
            },
            createStringTypeAnnotation: function() {
              return {type: Syntax.StringTypeAnnotation};
            },
            createStringLiteralTypeAnnotation: function(token) {
              return {
                type: Syntax.StringLiteralTypeAnnotation,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
              };
            },
            createVoidTypeAnnotation: function() {
              return {type: Syntax.VoidTypeAnnotation};
            },
            createTypeofTypeAnnotation: function(argument) {
              return {
                type: Syntax.TypeofTypeAnnotation,
                argument: argument
              };
            },
            createTupleTypeAnnotation: function(types) {
              return {
                type: Syntax.TupleTypeAnnotation,
                types: types
              };
            },
            createObjectTypeAnnotation: function(properties, indexers, callProperties) {
              return {
                type: Syntax.ObjectTypeAnnotation,
                properties: properties,
                indexers: indexers,
                callProperties: callProperties
              };
            },
            createObjectTypeIndexer: function(id, key, value, isStatic) {
              return {
                type: Syntax.ObjectTypeIndexer,
                id: id,
                key: key,
                value: value,
                "static": isStatic
              };
            },
            createObjectTypeCallProperty: function(value, isStatic) {
              return {
                type: Syntax.ObjectTypeCallProperty,
                value: value,
                "static": isStatic
              };
            },
            createObjectTypeProperty: function(key, value, optional, isStatic) {
              return {
                type: Syntax.ObjectTypeProperty,
                key: key,
                value: value,
                optional: optional,
                "static": isStatic
              };
            },
            createUnionTypeAnnotation: function(types) {
              return {
                type: Syntax.UnionTypeAnnotation,
                types: types
              };
            },
            createIntersectionTypeAnnotation: function(types) {
              return {
                type: Syntax.IntersectionTypeAnnotation,
                types: types
              };
            },
            createTypeAlias: function(id, typeParameters, right) {
              return {
                type: Syntax.TypeAlias,
                id: id,
                typeParameters: typeParameters,
                right: right
              };
            },
            createInterface: function(id, typeParameters, body, extended) {
              return {
                type: Syntax.InterfaceDeclaration,
                id: id,
                typeParameters: typeParameters,
                body: body,
                "extends": extended
              };
            },
            createInterfaceExtends: function(id, typeParameters) {
              return {
                type: Syntax.InterfaceExtends,
                id: id,
                typeParameters: typeParameters
              };
            },
            createDeclareFunction: function(id) {
              return {
                type: Syntax.DeclareFunction,
                id: id
              };
            },
            createDeclareVariable: function(id) {
              return {
                type: Syntax.DeclareVariable,
                id: id
              };
            },
            createDeclareModule: function(id, body) {
              return {
                type: Syntax.DeclareModule,
                id: id,
                body: body
              };
            },
            createXJSAttribute: function(name, value) {
              return {
                type: Syntax.XJSAttribute,
                name: name,
                value: value || null
              };
            },
            createXJSSpreadAttribute: function(argument) {
              return {
                type: Syntax.XJSSpreadAttribute,
                argument: argument
              };
            },
            createXJSIdentifier: function(name) {
              return {
                type: Syntax.XJSIdentifier,
                name: name
              };
            },
            createXJSNamespacedName: function(namespace, name) {
              return {
                type: Syntax.XJSNamespacedName,
                namespace: namespace,
                name: name
              };
            },
            createXJSMemberExpression: function(object, property) {
              return {
                type: Syntax.XJSMemberExpression,
                object: object,
                property: property
              };
            },
            createXJSElement: function(openingElement, closingElement, children) {
              return {
                type: Syntax.XJSElement,
                openingElement: openingElement,
                closingElement: closingElement,
                children: children
              };
            },
            createXJSEmptyExpression: function() {
              return {type: Syntax.XJSEmptyExpression};
            },
            createXJSExpressionContainer: function(expression) {
              return {
                type: Syntax.XJSExpressionContainer,
                expression: expression
              };
            },
            createXJSOpeningElement: function(name, attributes, selfClosing) {
              return {
                type: Syntax.XJSOpeningElement,
                name: name,
                selfClosing: selfClosing,
                attributes: attributes
              };
            },
            createXJSClosingElement: function(name) {
              return {
                type: Syntax.XJSClosingElement,
                name: name
              };
            },
            createIfStatement: function(test, consequent, alternate) {
              return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate
              };
            },
            createLabeledStatement: function(label, body) {
              return {
                type: Syntax.LabeledStatement,
                label: label,
                body: body
              };
            },
            createLiteral: function(token) {
              var object = {
                type: Syntax.Literal,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
              };
              if (token.regex) {
                object.regex = token.regex;
              }
              return object;
            },
            createMemberExpression: function(accessor, object, property) {
              return {
                type: Syntax.MemberExpression,
                computed: accessor === '[',
                object: object,
                property: property
              };
            },
            createNewExpression: function(callee, args) {
              return {
                type: Syntax.NewExpression,
                callee: callee,
                'arguments': args
              };
            },
            createObjectExpression: function(properties) {
              return {
                type: Syntax.ObjectExpression,
                properties: properties
              };
            },
            createPostfixExpression: function(operator, argument) {
              return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: false
              };
            },
            createProgram: function(body) {
              return {
                type: Syntax.Program,
                body: body
              };
            },
            createProperty: function(kind, key, value, method, shorthand, computed) {
              return {
                type: Syntax.Property,
                key: key,
                value: value,
                kind: kind,
                method: method,
                shorthand: shorthand,
                computed: computed
              };
            },
            createReturnStatement: function(argument) {
              return {
                type: Syntax.ReturnStatement,
                argument: argument
              };
            },
            createSequenceExpression: function(expressions) {
              return {
                type: Syntax.SequenceExpression,
                expressions: expressions
              };
            },
            createSwitchCase: function(test, consequent) {
              return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent
              };
            },
            createSwitchStatement: function(discriminant, cases) {
              return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
              };
            },
            createThisExpression: function() {
              return {type: Syntax.ThisExpression};
            },
            createThrowStatement: function(argument) {
              return {
                type: Syntax.ThrowStatement,
                argument: argument
              };
            },
            createTryStatement: function(block, guardedHandlers, handlers, finalizer) {
              return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: guardedHandlers,
                handlers: handlers,
                finalizer: finalizer
              };
            },
            createUnaryExpression: function(operator, argument) {
              if (operator === '++' || operator === '--') {
                return {
                  type: Syntax.UpdateExpression,
                  operator: operator,
                  argument: argument,
                  prefix: true
                };
              }
              return {
                type: Syntax.UnaryExpression,
                operator: operator,
                argument: argument,
                prefix: true
              };
            },
            createVariableDeclaration: function(declarations, kind) {
              return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind
              };
            },
            createVariableDeclarator: function(id, init) {
              return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init
              };
            },
            createWhileStatement: function(test, body) {
              return {
                type: Syntax.WhileStatement,
                test: test,
                body: body
              };
            },
            createWithStatement: function(object, body) {
              return {
                type: Syntax.WithStatement,
                object: object,
                body: body
              };
            },
            createTemplateElement: function(value, tail) {
              return {
                type: Syntax.TemplateElement,
                value: value,
                tail: tail
              };
            },
            createTemplateLiteral: function(quasis, expressions) {
              return {
                type: Syntax.TemplateLiteral,
                quasis: quasis,
                expressions: expressions
              };
            },
            createSpreadElement: function(argument) {
              return {
                type: Syntax.SpreadElement,
                argument: argument
              };
            },
            createSpreadProperty: function(argument) {
              return {
                type: Syntax.SpreadProperty,
                argument: argument
              };
            },
            createTaggedTemplateExpression: function(tag, quasi) {
              return {
                type: Syntax.TaggedTemplateExpression,
                tag: tag,
                quasi: quasi
              };
            },
            createArrowFunctionExpression: function(params, defaults, body, rest, expression, isAsync) {
              var arrowExpr = {
                type: Syntax.ArrowFunctionExpression,
                id: null,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: false,
                expression: expression
              };
              if (isAsync) {
                arrowExpr.async = true;
              }
              return arrowExpr;
            },
            createMethodDefinition: function(propertyType, kind, key, value) {
              return {
                type: Syntax.MethodDefinition,
                key: key,
                value: value,
                kind: kind,
                'static': propertyType === ClassPropertyType["static"]
              };
            },
            createClassProperty: function(key, typeAnnotation, computed, isStatic) {
              return {
                type: Syntax.ClassProperty,
                key: key,
                typeAnnotation: typeAnnotation,
                computed: computed,
                "static": isStatic
              };
            },
            createClassBody: function(body) {
              return {
                type: Syntax.ClassBody,
                body: body
              };
            },
            createClassImplements: function(id, typeParameters) {
              return {
                type: Syntax.ClassImplements,
                id: id,
                typeParameters: typeParameters
              };
            },
            createClassExpression: function(id, superClass, body, typeParameters, superTypeParameters, implemented) {
              return {
                type: Syntax.ClassExpression,
                id: id,
                superClass: superClass,
                body: body,
                typeParameters: typeParameters,
                superTypeParameters: superTypeParameters,
                "implements": implemented
              };
            },
            createClassDeclaration: function(id, superClass, body, typeParameters, superTypeParameters, implemented) {
              return {
                type: Syntax.ClassDeclaration,
                id: id,
                superClass: superClass,
                body: body,
                typeParameters: typeParameters,
                superTypeParameters: superTypeParameters,
                "implements": implemented
              };
            },
            createModuleSpecifier: function(token) {
              return {
                type: Syntax.ModuleSpecifier,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
              };
            },
            createExportSpecifier: function(id, name) {
              return {
                type: Syntax.ExportSpecifier,
                id: id,
                name: name
              };
            },
            createExportBatchSpecifier: function() {
              return {type: Syntax.ExportBatchSpecifier};
            },
            createImportDefaultSpecifier: function(id) {
              return {
                type: Syntax.ImportDefaultSpecifier,
                id: id
              };
            },
            createImportNamespaceSpecifier: function(id) {
              return {
                type: Syntax.ImportNamespaceSpecifier,
                id: id
              };
            },
            createExportDeclaration: function(isDefault, declaration, specifiers, source) {
              return {
                type: Syntax.ExportDeclaration,
                'default': !!isDefault,
                declaration: declaration,
                specifiers: specifiers,
                source: source
              };
            },
            createImportSpecifier: function(id, name) {
              return {
                type: Syntax.ImportSpecifier,
                id: id,
                name: name
              };
            },
            createImportDeclaration: function(specifiers, source) {
              return {
                type: Syntax.ImportDeclaration,
                specifiers: specifiers,
                source: source
              };
            },
            createYieldExpression: function(argument, delegate) {
              return {
                type: Syntax.YieldExpression,
                argument: argument,
                delegate: delegate
              };
            },
            createAwaitExpression: function(argument) {
              return {
                type: Syntax.AwaitExpression,
                argument: argument
              };
            },
            createComprehensionExpression: function(filter, blocks, body) {
              return {
                type: Syntax.ComprehensionExpression,
                filter: filter,
                blocks: blocks,
                body: body
              };
            }
          };
          function peekLineTerminator() {
            var pos,
                line,
                start,
                found;
            pos = index;
            line = lineNumber;
            start = lineStart;
            skipComment();
            found = lineNumber !== line;
            index = pos;
            lineNumber = line;
            lineStart = start;
            return found;
          }
          function throwError(token, messageFormat) {
            var error,
                args = Array.prototype.slice.call(arguments, 2),
                msg = messageFormat.replace(/%(\d)/g, function(whole, index) {
                  assert(index < args.length, 'Message reference must be in range');
                  return args[index];
                });
            if (typeof token.lineNumber === 'number') {
              error = new Error('Line ' + token.lineNumber + ': ' + msg);
              error.index = token.range[0];
              error.lineNumber = token.lineNumber;
              error.column = token.range[0] - lineStart + 1;
            } else {
              error = new Error('Line ' + lineNumber + ': ' + msg);
              error.index = index;
              error.lineNumber = lineNumber;
              error.column = index - lineStart + 1;
            }
            error.description = msg;
            throw error;
          }
          function throwErrorTolerant() {
            try {
              throwError.apply(null, arguments);
            } catch (e) {
              if (extra.errors) {
                extra.errors.push(e);
              } else {
                throw e;
              }
            }
          }
          function throwUnexpected(token) {
            if (token.type === Token.EOF) {
              throwError(token, Messages.UnexpectedEOS);
            }
            if (token.type === Token.NumericLiteral) {
              throwError(token, Messages.UnexpectedNumber);
            }
            if (token.type === Token.StringLiteral || token.type === Token.XJSText) {
              throwError(token, Messages.UnexpectedString);
            }
            if (token.type === Token.Identifier) {
              throwError(token, Messages.UnexpectedIdentifier);
            }
            if (token.type === Token.Keyword) {
              if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
              } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return ;
              }
              throwError(token, Messages.UnexpectedToken, token.value);
            }
            if (token.type === Token.Template) {
              throwError(token, Messages.UnexpectedTemplate, token.value.raw);
            }
            throwError(token, Messages.UnexpectedToken, token.value);
          }
          function expect(value) {
            var token = lex();
            if (token.type !== Token.Punctuator || token.value !== value) {
              throwUnexpected(token);
            }
          }
          function expectKeyword(keyword, contextual) {
            var token = lex();
            if (token.type !== (contextual ? Token.Identifier : Token.Keyword) || token.value !== keyword) {
              throwUnexpected(token);
            }
          }
          function expectContextualKeyword(keyword) {
            return expectKeyword(keyword, true);
          }
          function match(value) {
            return lookahead.type === Token.Punctuator && lookahead.value === value;
          }
          function matchKeyword(keyword, contextual) {
            var expectedType = contextual ? Token.Identifier : Token.Keyword;
            return lookahead.type === expectedType && lookahead.value === keyword;
          }
          function matchContextualKeyword(keyword) {
            return matchKeyword(keyword, true);
          }
          function matchAssign() {
            var op;
            if (lookahead.type !== Token.Punctuator) {
              return false;
            }
            op = lookahead.value;
            return op === '=' || op === '*=' || op === '/=' || op === '%=' || op === '+=' || op === '-=' || op === '<<=' || op === '>>=' || op === '>>>=' || op === '&=' || op === '^=' || op === '|=';
          }
          function matchYield() {
            return state.yieldAllowed && matchKeyword('yield', !strict);
          }
          function matchAsync() {
            var backtrackToken = lookahead,
                matches = false;
            if (matchContextualKeyword('async')) {
              lex();
              matches = !peekLineTerminator();
              rewind(backtrackToken);
            }
            return matches;
          }
          function matchAwait() {
            return state.awaitAllowed && matchContextualKeyword('await');
          }
          function consumeSemicolon() {
            var line,
                oldIndex = index,
                oldLineNumber = lineNumber,
                oldLineStart = lineStart,
                oldLookahead = lookahead;
            if (source.charCodeAt(index) === 59) {
              lex();
              return ;
            }
            line = lineNumber;
            skipComment();
            if (lineNumber !== line) {
              index = oldIndex;
              lineNumber = oldLineNumber;
              lineStart = oldLineStart;
              lookahead = oldLookahead;
              return ;
            }
            if (match(';')) {
              lex();
              return ;
            }
            if (lookahead.type !== Token.EOF && !match('}')) {
              throwUnexpected(lookahead);
            }
          }
          function isLeftHandSide(expr) {
            return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
          }
          function isAssignableLeftHandSide(expr) {
            return isLeftHandSide(expr) || expr.type === Syntax.ObjectPattern || expr.type === Syntax.ArrayPattern;
          }
          function parseArrayInitialiser() {
            var elements = [],
                blocks = [],
                filter = null,
                tmp,
                possiblecomprehension = true,
                body,
                marker = markerCreate();
            expect('[');
            while (!match(']')) {
              if (lookahead.value === 'for' && lookahead.type === Token.Keyword) {
                if (!possiblecomprehension) {
                  throwError({}, Messages.ComprehensionError);
                }
                matchKeyword('for');
                tmp = parseForStatement({ignoreBody: true});
                tmp.of = tmp.type === Syntax.ForOfStatement;
                tmp.type = Syntax.ComprehensionBlock;
                if (tmp.left.kind) {
                  throwError({}, Messages.ComprehensionError);
                }
                blocks.push(tmp);
              } else if (lookahead.value === 'if' && lookahead.type === Token.Keyword) {
                if (!possiblecomprehension) {
                  throwError({}, Messages.ComprehensionError);
                }
                expectKeyword('if');
                expect('(');
                filter = parseExpression();
                expect(')');
              } else if (lookahead.value === ',' && lookahead.type === Token.Punctuator) {
                possiblecomprehension = false;
                lex();
                elements.push(null);
              } else {
                tmp = parseSpreadOrAssignmentExpression();
                elements.push(tmp);
                if (tmp && tmp.type === Syntax.SpreadElement) {
                  if (!match(']')) {
                    throwError({}, Messages.ElementAfterSpreadElement);
                  }
                } else if (!(match(']') || matchKeyword('for') || matchKeyword('if'))) {
                  expect(',');
                  possiblecomprehension = false;
                }
              }
            }
            expect(']');
            if (filter && !blocks.length) {
              throwError({}, Messages.ComprehensionRequiresBlock);
            }
            if (blocks.length) {
              if (elements.length !== 1) {
                throwError({}, Messages.ComprehensionError);
              }
              return markerApply(marker, delegate.createComprehensionExpression(filter, blocks, elements[0]));
            }
            return markerApply(marker, delegate.createArrayExpression(elements));
          }
          function parsePropertyFunction(options) {
            var previousStrict,
                previousYieldAllowed,
                previousAwaitAllowed,
                params,
                defaults,
                body,
                marker = markerCreate();
            previousStrict = strict;
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = options.generator;
            previousAwaitAllowed = state.awaitAllowed;
            state.awaitAllowed = options.async;
            params = options.params || [];
            defaults = options.defaults || [];
            body = parseConciseBody();
            if (options.name && strict && isRestrictedWord(params[0].name)) {
              throwErrorTolerant(options.name, Messages.StrictParamName);
            }
            strict = previousStrict;
            state.yieldAllowed = previousYieldAllowed;
            state.awaitAllowed = previousAwaitAllowed;
            return markerApply(marker, delegate.createFunctionExpression(null, params, defaults, body, options.rest || null, options.generator, body.type !== Syntax.BlockStatement, options.async, options.returnType, options.typeParameters));
          }
          function parsePropertyMethodFunction(options) {
            var previousStrict,
                tmp,
                method;
            previousStrict = strict;
            strict = true;
            tmp = parseParams();
            if (tmp.stricted) {
              throwErrorTolerant(tmp.stricted, tmp.message);
            }
            method = parsePropertyFunction({
              params: tmp.params,
              defaults: tmp.defaults,
              rest: tmp.rest,
              generator: options.generator,
              async: options.async,
              returnType: tmp.returnType,
              typeParameters: options.typeParameters
            });
            strict = previousStrict;
            return method;
          }
          function parseObjectPropertyKey() {
            var marker = markerCreate(),
                token = lex(),
                propertyKey,
                result;
            if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
              if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
              }
              return markerApply(marker, delegate.createLiteral(token));
            }
            if (token.type === Token.Punctuator && token.value === '[') {
              marker = markerCreate();
              propertyKey = parseAssignmentExpression();
              result = markerApply(marker, propertyKey);
              expect(']');
              return result;
            }
            return markerApply(marker, delegate.createIdentifier(token.value));
          }
          function parseObjectProperty() {
            var token,
                key,
                id,
                value,
                param,
                expr,
                computed,
                marker = markerCreate(),
                returnType;
            token = lookahead;
            computed = (token.value === '[');
            if (token.type === Token.Identifier || computed || matchAsync()) {
              id = parseObjectPropertyKey();
              if (match(':')) {
                lex();
                return markerApply(marker, delegate.createProperty('init', id, parseAssignmentExpression(), false, false, computed));
              }
              if (match('(')) {
                return markerApply(marker, delegate.createProperty('init', id, parsePropertyMethodFunction({
                  generator: false,
                  async: false
                }), true, false, computed));
              }
              if (token.value === 'get') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                if (match(':')) {
                  returnType = parseTypeAnnotation();
                }
                return markerApply(marker, delegate.createProperty('get', key, parsePropertyFunction({
                  generator: false,
                  async: false,
                  returnType: returnType
                }), false, false, computed));
              }
              if (token.value === 'set') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead;
                param = [parseTypeAnnotatableIdentifier()];
                expect(')');
                if (match(':')) {
                  returnType = parseTypeAnnotation();
                }
                return markerApply(marker, delegate.createProperty('set', key, parsePropertyFunction({
                  params: param,
                  generator: false,
                  async: false,
                  name: token,
                  returnType: returnType
                }), false, false, computed));
              }
              if (token.value === 'async') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();
                return markerApply(marker, delegate.createProperty('init', key, parsePropertyMethodFunction({
                  generator: false,
                  async: true
                }), true, false, computed));
              }
              if (computed) {
                throwUnexpected(lookahead);
              }
              return markerApply(marker, delegate.createProperty('init', id, id, false, true, false));
            }
            if (token.type === Token.EOF || token.type === Token.Punctuator) {
              if (!match('*')) {
                throwUnexpected(token);
              }
              lex();
              computed = (lookahead.type === Token.Punctuator && lookahead.value === '[');
              id = parseObjectPropertyKey();
              if (!match('(')) {
                throwUnexpected(lex());
              }
              return markerApply(marker, delegate.createProperty('init', id, parsePropertyMethodFunction({generator: true}), true, false, computed));
            }
            key = parseObjectPropertyKey();
            if (match(':')) {
              lex();
              return markerApply(marker, delegate.createProperty('init', key, parseAssignmentExpression(), false, false, false));
            }
            if (match('(')) {
              return markerApply(marker, delegate.createProperty('init', key, parsePropertyMethodFunction({generator: false}), true, false, false));
            }
            throwUnexpected(lex());
          }
          function parseObjectSpreadProperty() {
            var marker = markerCreate();
            expect('...');
            return markerApply(marker, delegate.createSpreadProperty(parseAssignmentExpression()));
          }
          function parseObjectInitialiser() {
            var properties = [],
                property,
                name,
                key,
                kind,
                map = {},
                toString = String,
                marker = markerCreate();
            expect('{');
            while (!match('}')) {
              if (match('...')) {
                property = parseObjectSpreadProperty();
              } else {
                property = parseObjectProperty();
                if (property.key.type === Syntax.Identifier) {
                  name = property.key.name;
                } else {
                  name = toString(property.key.value);
                }
                kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
                key = '$' + name;
                if (Object.prototype.hasOwnProperty.call(map, key)) {
                  if (map[key] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                  } else {
                    if (kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[key] & kind) {
                      throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                  }
                  map[key] |= kind;
                } else {
                  map[key] = kind;
                }
              }
              properties.push(property);
              if (!match('}')) {
                expect(',');
              }
            }
            expect('}');
            return markerApply(marker, delegate.createObjectExpression(properties));
          }
          function parseTemplateElement(option) {
            var marker = markerCreate(),
                token = scanTemplateElement(option);
            if (strict && token.octal) {
              throwError(token, Messages.StrictOctalLiteral);
            }
            return markerApply(marker, delegate.createTemplateElement({
              raw: token.value.raw,
              cooked: token.value.cooked
            }, token.tail));
          }
          function parseTemplateLiteral() {
            var quasi,
                quasis,
                expressions,
                marker = markerCreate();
            quasi = parseTemplateElement({head: true});
            quasis = [quasi];
            expressions = [];
            while (!quasi.tail) {
              expressions.push(parseExpression());
              quasi = parseTemplateElement({head: false});
              quasis.push(quasi);
            }
            return markerApply(marker, delegate.createTemplateLiteral(quasis, expressions));
          }
          function parseGroupExpression() {
            var expr;
            expect('(');
            ++state.parenthesizedCount;
            expr = parseExpression();
            expect(')');
            return expr;
          }
          function matchAsyncFuncExprOrDecl() {
            var token;
            if (matchAsync()) {
              token = lookahead2();
              if (token.type === Token.Keyword && token.value === 'function') {
                return true;
              }
            }
            return false;
          }
          function parsePrimaryExpression() {
            var marker,
                type,
                token,
                expr;
            type = lookahead.type;
            if (type === Token.Identifier) {
              marker = markerCreate();
              return markerApply(marker, delegate.createIdentifier(lex().value));
            }
            if (type === Token.StringLiteral || type === Token.NumericLiteral) {
              if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
              }
              marker = markerCreate();
              return markerApply(marker, delegate.createLiteral(lex()));
            }
            if (type === Token.Keyword) {
              if (matchKeyword('this')) {
                marker = markerCreate();
                lex();
                return markerApply(marker, delegate.createThisExpression());
              }
              if (matchKeyword('function')) {
                return parseFunctionExpression();
              }
              if (matchKeyword('class')) {
                return parseClassExpression();
              }
              if (matchKeyword('super')) {
                marker = markerCreate();
                lex();
                return markerApply(marker, delegate.createIdentifier('super'));
              }
            }
            if (type === Token.BooleanLiteral) {
              marker = markerCreate();
              token = lex();
              token.value = (token.value === 'true');
              return markerApply(marker, delegate.createLiteral(token));
            }
            if (type === Token.NullLiteral) {
              marker = markerCreate();
              token = lex();
              token.value = null;
              return markerApply(marker, delegate.createLiteral(token));
            }
            if (match('[')) {
              return parseArrayInitialiser();
            }
            if (match('{')) {
              return parseObjectInitialiser();
            }
            if (match('(')) {
              return parseGroupExpression();
            }
            if (match('/') || match('/=')) {
              marker = markerCreate();
              return markerApply(marker, delegate.createLiteral(scanRegExp()));
            }
            if (type === Token.Template) {
              return parseTemplateLiteral();
            }
            if (match('<')) {
              return parseXJSElement();
            }
            throwUnexpected(lex());
          }
          function parseArguments() {
            var args = [],
                arg;
            expect('(');
            if (!match(')')) {
              while (index < length) {
                arg = parseSpreadOrAssignmentExpression();
                args.push(arg);
                if (match(')')) {
                  break;
                } else if (arg.type === Syntax.SpreadElement) {
                  throwError({}, Messages.ElementAfterSpreadElement);
                }
                expect(',');
              }
            }
            expect(')');
            return args;
          }
          function parseSpreadOrAssignmentExpression() {
            if (match('...')) {
              var marker = markerCreate();
              lex();
              return markerApply(marker, delegate.createSpreadElement(parseAssignmentExpression()));
            }
            return parseAssignmentExpression();
          }
          function parseNonComputedProperty() {
            var marker = markerCreate(),
                token = lex();
            if (!isIdentifierName(token)) {
              throwUnexpected(token);
            }
            return markerApply(marker, delegate.createIdentifier(token.value));
          }
          function parseNonComputedMember() {
            expect('.');
            return parseNonComputedProperty();
          }
          function parseComputedMember() {
            var expr;
            expect('[');
            expr = parseExpression();
            expect(']');
            return expr;
          }
          function parseNewExpression() {
            var callee,
                args,
                marker = markerCreate();
            expectKeyword('new');
            callee = parseLeftHandSideExpression();
            args = match('(') ? parseArguments() : [];
            return markerApply(marker, delegate.createNewExpression(callee, args));
          }
          function parseLeftHandSideExpressionAllowCall() {
            var expr,
                args,
                marker = markerCreate();
            expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
            while (match('.') || match('[') || match('(') || lookahead.type === Token.Template) {
              if (match('(')) {
                args = parseArguments();
                expr = markerApply(marker, delegate.createCallExpression(expr, args));
              } else if (match('[')) {
                expr = markerApply(marker, delegate.createMemberExpression('[', expr, parseComputedMember()));
              } else if (match('.')) {
                expr = markerApply(marker, delegate.createMemberExpression('.', expr, parseNonComputedMember()));
              } else {
                expr = markerApply(marker, delegate.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
              }
            }
            return expr;
          }
          function parseLeftHandSideExpression() {
            var expr,
                marker = markerCreate();
            expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
            while (match('.') || match('[') || lookahead.type === Token.Template) {
              if (match('[')) {
                expr = markerApply(marker, delegate.createMemberExpression('[', expr, parseComputedMember()));
              } else if (match('.')) {
                expr = markerApply(marker, delegate.createMemberExpression('.', expr, parseNonComputedMember()));
              } else {
                expr = markerApply(marker, delegate.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
              }
            }
            return expr;
          }
          function parsePostfixExpression() {
            var marker = markerCreate(),
                expr = parseLeftHandSideExpressionAllowCall(),
                token;
            if (lookahead.type !== Token.Punctuator) {
              return expr;
            }
            if ((match('++') || match('--')) && !peekLineTerminator()) {
              if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
              }
              if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
              }
              token = lex();
              expr = markerApply(marker, delegate.createPostfixExpression(token.value, expr));
            }
            return expr;
          }
          function parseUnaryExpression() {
            var marker,
                token,
                expr;
            if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
              return parsePostfixExpression();
            }
            if (match('++') || match('--')) {
              marker = markerCreate();
              token = lex();
              expr = parseUnaryExpression();
              if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
              }
              if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
              }
              return markerApply(marker, delegate.createUnaryExpression(token.value, expr));
            }
            if (match('+') || match('-') || match('~') || match('!')) {
              marker = markerCreate();
              token = lex();
              expr = parseUnaryExpression();
              return markerApply(marker, delegate.createUnaryExpression(token.value, expr));
            }
            if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
              marker = markerCreate();
              token = lex();
              expr = parseUnaryExpression();
              expr = markerApply(marker, delegate.createUnaryExpression(token.value, expr));
              if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
              }
              return expr;
            }
            return parsePostfixExpression();
          }
          function binaryPrecedence(token, allowIn) {
            var prec = 0;
            if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
              return 0;
            }
            switch (token.value) {
              case '||':
                prec = 1;
                break;
              case '&&':
                prec = 2;
                break;
              case '|':
                prec = 3;
                break;
              case '^':
                prec = 4;
                break;
              case '&':
                prec = 5;
                break;
              case '==':
              case '!=':
              case '===':
              case '!==':
                prec = 6;
                break;
              case '<':
              case '>':
              case '<=':
              case '>=':
              case 'instanceof':
                prec = 7;
                break;
              case 'in':
                prec = allowIn ? 7 : 0;
                break;
              case '<<':
              case '>>':
              case '>>>':
                prec = 8;
                break;
              case '+':
              case '-':
                prec = 9;
                break;
              case '*':
              case '/':
              case '%':
                prec = 11;
                break;
              default:
                break;
            }
            return prec;
          }
          function parseBinaryExpression() {
            var expr,
                token,
                prec,
                previousAllowIn,
                stack,
                right,
                operator,
                left,
                i,
                marker,
                markers;
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            marker = markerCreate();
            left = parseUnaryExpression();
            token = lookahead;
            prec = binaryPrecedence(token, previousAllowIn);
            if (prec === 0) {
              return left;
            }
            token.prec = prec;
            lex();
            markers = [marker, markerCreate()];
            right = parseUnaryExpression();
            stack = [left, token, right];
            while ((prec = binaryPrecedence(lookahead, previousAllowIn)) > 0) {
              while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                expr = delegate.createBinaryExpression(operator, left, right);
                markers.pop();
                marker = markers.pop();
                markerApply(marker, expr);
                stack.push(expr);
                markers.push(marker);
              }
              token = lex();
              token.prec = prec;
              stack.push(token);
              markers.push(markerCreate());
              expr = parseUnaryExpression();
              stack.push(expr);
            }
            state.allowIn = previousAllowIn;
            i = stack.length - 1;
            expr = stack[i];
            markers.pop();
            while (i > 1) {
              expr = delegate.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
              i -= 2;
              marker = markers.pop();
              markerApply(marker, expr);
            }
            return expr;
          }
          function parseConditionalExpression() {
            var expr,
                previousAllowIn,
                consequent,
                alternate,
                marker = markerCreate();
            expr = parseBinaryExpression();
            if (match('?')) {
              lex();
              previousAllowIn = state.allowIn;
              state.allowIn = true;
              consequent = parseAssignmentExpression();
              state.allowIn = previousAllowIn;
              expect(':');
              alternate = parseAssignmentExpression();
              expr = markerApply(marker, delegate.createConditionalExpression(expr, consequent, alternate));
            }
            return expr;
          }
          function reinterpretAsAssignmentBindingPattern(expr) {
            var i,
                len,
                property,
                element;
            if (expr.type === Syntax.ObjectExpression) {
              expr.type = Syntax.ObjectPattern;
              for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.type === Syntax.SpreadProperty) {
                  if (i < len - 1) {
                    throwError({}, Messages.PropertyAfterSpreadProperty);
                  }
                  reinterpretAsAssignmentBindingPattern(property.argument);
                } else {
                  if (property.kind !== 'init') {
                    throwError({}, Messages.InvalidLHSInAssignment);
                  }
                  reinterpretAsAssignmentBindingPattern(property.value);
                }
              }
            } else if (expr.type === Syntax.ArrayExpression) {
              expr.type = Syntax.ArrayPattern;
              for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                  reinterpretAsAssignmentBindingPattern(element);
                }
              }
            } else if (expr.type === Syntax.Identifier) {
              if (isRestrictedWord(expr.name)) {
                throwError({}, Messages.InvalidLHSInAssignment);
              }
            } else if (expr.type === Syntax.SpreadElement) {
              reinterpretAsAssignmentBindingPattern(expr.argument);
              if (expr.argument.type === Syntax.ObjectPattern) {
                throwError({}, Messages.ObjectPatternAsSpread);
              }
            } else {
              if (expr.type !== Syntax.MemberExpression && expr.type !== Syntax.CallExpression && expr.type !== Syntax.NewExpression) {
                throwError({}, Messages.InvalidLHSInAssignment);
              }
            }
          }
          function reinterpretAsDestructuredParameter(options, expr) {
            var i,
                len,
                property,
                element;
            if (expr.type === Syntax.ObjectExpression) {
              expr.type = Syntax.ObjectPattern;
              for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.type === Syntax.SpreadProperty) {
                  if (i < len - 1) {
                    throwError({}, Messages.PropertyAfterSpreadProperty);
                  }
                  reinterpretAsDestructuredParameter(options, property.argument);
                } else {
                  if (property.kind !== 'init') {
                    throwError({}, Messages.InvalidLHSInFormalsList);
                  }
                  reinterpretAsDestructuredParameter(options, property.value);
                }
              }
            } else if (expr.type === Syntax.ArrayExpression) {
              expr.type = Syntax.ArrayPattern;
              for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                  reinterpretAsDestructuredParameter(options, element);
                }
              }
            } else if (expr.type === Syntax.Identifier) {
              validateParam(options, expr, expr.name);
            } else {
              if (expr.type !== Syntax.MemberExpression) {
                throwError({}, Messages.InvalidLHSInFormalsList);
              }
            }
          }
          function reinterpretAsCoverFormalsList(expressions) {
            var i,
                len,
                param,
                params,
                defaults,
                defaultCount,
                options,
                rest;
            params = [];
            defaults = [];
            defaultCount = 0;
            rest = null;
            options = {paramSet: {}};
            for (i = 0, len = expressions.length; i < len; i += 1) {
              param = expressions[i];
              if (param.type === Syntax.Identifier) {
                params.push(param);
                defaults.push(null);
                validateParam(options, param, param.name);
              } else if (param.type === Syntax.ObjectExpression || param.type === Syntax.ArrayExpression) {
                reinterpretAsDestructuredParameter(options, param);
                params.push(param);
                defaults.push(null);
              } else if (param.type === Syntax.SpreadElement) {
                assert(i === len - 1, 'It is guaranteed that SpreadElement is last element by parseExpression');
                reinterpretAsDestructuredParameter(options, param.argument);
                rest = param.argument;
              } else if (param.type === Syntax.AssignmentExpression) {
                params.push(param.left);
                defaults.push(param.right);
                ++defaultCount;
                validateParam(options, param.left, param.left.name);
              } else {
                return null;
              }
            }
            if (options.message === Messages.StrictParamDupe) {
              throwError(strict ? options.stricted : options.firstRestricted, options.message);
            }
            if (defaultCount === 0) {
              defaults = [];
            }
            return {
              params: params,
              defaults: defaults,
              rest: rest,
              stricted: options.stricted,
              firstRestricted: options.firstRestricted,
              message: options.message
            };
          }
          function parseArrowFunctionExpression(options, marker) {
            var previousStrict,
                previousYieldAllowed,
                previousAwaitAllowed,
                body;
            expect('=>');
            previousStrict = strict;
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = false;
            previousAwaitAllowed = state.awaitAllowed;
            state.awaitAllowed = !!options.async;
            body = parseConciseBody();
            if (strict && options.firstRestricted) {
              throwError(options.firstRestricted, options.message);
            }
            if (strict && options.stricted) {
              throwErrorTolerant(options.stricted, options.message);
            }
            strict = previousStrict;
            state.yieldAllowed = previousYieldAllowed;
            state.awaitAllowed = previousAwaitAllowed;
            return markerApply(marker, delegate.createArrowFunctionExpression(options.params, options.defaults, body, options.rest, body.type !== Syntax.BlockStatement, !!options.async));
          }
          function parseAssignmentExpression() {
            var marker,
                expr,
                token,
                params,
                oldParenthesizedCount,
                backtrackToken = lookahead,
                possiblyAsync = false;
            if (matchYield()) {
              return parseYieldExpression();
            }
            if (matchAwait()) {
              return parseAwaitExpression();
            }
            oldParenthesizedCount = state.parenthesizedCount;
            marker = markerCreate();
            if (matchAsyncFuncExprOrDecl()) {
              return parseFunctionExpression();
            }
            if (matchAsync()) {
              possiblyAsync = true;
              lex();
            }
            if (match('(')) {
              token = lookahead2();
              if ((token.type === Token.Punctuator && token.value === ')') || token.value === '...') {
                params = parseParams();
                if (!match('=>')) {
                  throwUnexpected(lex());
                }
                params.async = possiblyAsync;
                return parseArrowFunctionExpression(params, marker);
              }
            }
            token = lookahead;
            if (possiblyAsync && !match('(') && token.type !== Token.Identifier) {
              possiblyAsync = false;
              rewind(backtrackToken);
            }
            expr = parseConditionalExpression();
            if (match('=>') && (state.parenthesizedCount === oldParenthesizedCount || state.parenthesizedCount === (oldParenthesizedCount + 1))) {
              if (expr.type === Syntax.Identifier) {
                params = reinterpretAsCoverFormalsList([expr]);
              } else if (expr.type === Syntax.SequenceExpression) {
                params = reinterpretAsCoverFormalsList(expr.expressions);
              }
              if (params) {
                params.async = possiblyAsync;
                return parseArrowFunctionExpression(params, marker);
              }
            }
            if (possiblyAsync) {
              possiblyAsync = false;
              rewind(backtrackToken);
              expr = parseConditionalExpression();
            }
            if (matchAssign()) {
              if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
              }
              if (match('=') && (expr.type === Syntax.ObjectExpression || expr.type === Syntax.ArrayExpression)) {
                reinterpretAsAssignmentBindingPattern(expr);
              } else if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
              }
              expr = markerApply(marker, delegate.createAssignmentExpression(lex().value, expr, parseAssignmentExpression()));
            }
            return expr;
          }
          function parseExpression() {
            var marker,
                expr,
                expressions,
                sequence,
                coverFormalsList,
                spreadFound,
                oldParenthesizedCount;
            oldParenthesizedCount = state.parenthesizedCount;
            marker = markerCreate();
            expr = parseAssignmentExpression();
            expressions = [expr];
            if (match(',')) {
              while (index < length) {
                if (!match(',')) {
                  break;
                }
                lex();
                expr = parseSpreadOrAssignmentExpression();
                expressions.push(expr);
                if (expr.type === Syntax.SpreadElement) {
                  spreadFound = true;
                  if (!match(')')) {
                    throwError({}, Messages.ElementAfterSpreadElement);
                  }
                  break;
                }
              }
              sequence = markerApply(marker, delegate.createSequenceExpression(expressions));
            }
            if (match('=>')) {
              if (state.parenthesizedCount === oldParenthesizedCount || state.parenthesizedCount === (oldParenthesizedCount + 1)) {
                expr = expr.type === Syntax.SequenceExpression ? expr.expressions : expressions;
                coverFormalsList = reinterpretAsCoverFormalsList(expr);
                if (coverFormalsList) {
                  return parseArrowFunctionExpression(coverFormalsList, marker);
                }
              }
              throwUnexpected(lex());
            }
            if (spreadFound && lookahead2().value !== '=>') {
              throwError({}, Messages.IllegalSpread);
            }
            return sequence || expr;
          }
          function parseStatementList() {
            var list = [],
                statement;
            while (index < length) {
              if (match('}')) {
                break;
              }
              statement = parseSourceElement();
              if (typeof statement === 'undefined') {
                break;
              }
              list.push(statement);
            }
            return list;
          }
          function parseBlock() {
            var block,
                marker = markerCreate();
            expect('{');
            block = parseStatementList();
            expect('}');
            return markerApply(marker, delegate.createBlockStatement(block));
          }
          function parseTypeParameterDeclaration() {
            var marker = markerCreate(),
                paramTypes = [];
            expect('<');
            while (!match('>')) {
              paramTypes.push(parseVariableIdentifier());
              if (!match('>')) {
                expect(',');
              }
            }
            expect('>');
            return markerApply(marker, delegate.createTypeParameterDeclaration(paramTypes));
          }
          function parseTypeParameterInstantiation() {
            var marker = markerCreate(),
                oldInType = state.inType,
                paramTypes = [];
            state.inType = true;
            expect('<');
            while (!match('>')) {
              paramTypes.push(parseType());
              if (!match('>')) {
                expect(',');
              }
            }
            expect('>');
            state.inType = oldInType;
            return markerApply(marker, delegate.createTypeParameterInstantiation(paramTypes));
          }
          function parseObjectTypeIndexer(marker, isStatic) {
            var id,
                key,
                value;
            expect('[');
            id = parseObjectPropertyKey();
            expect(':');
            key = parseType();
            expect(']');
            expect(':');
            value = parseType();
            return markerApply(marker, delegate.createObjectTypeIndexer(id, key, value, isStatic));
          }
          function parseObjectTypeMethodish(marker) {
            var params = [],
                rest = null,
                returnType,
                typeParameters = null;
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            expect('(');
            while (lookahead.type === Token.Identifier) {
              params.push(parseFunctionTypeParam());
              if (!match(')')) {
                expect(',');
              }
            }
            if (match('...')) {
              lex();
              rest = parseFunctionTypeParam();
            }
            expect(')');
            expect(':');
            returnType = parseType();
            return markerApply(marker, delegate.createFunctionTypeAnnotation(params, returnType, rest, typeParameters));
          }
          function parseObjectTypeMethod(marker, isStatic, key) {
            var optional = false,
                value;
            value = parseObjectTypeMethodish(marker);
            return markerApply(marker, delegate.createObjectTypeProperty(key, value, optional, isStatic));
          }
          function parseObjectTypeCallProperty(marker, isStatic) {
            var valueMarker = markerCreate();
            return markerApply(marker, delegate.createObjectTypeCallProperty(parseObjectTypeMethodish(valueMarker), isStatic));
          }
          function parseObjectType(allowStatic) {
            var callProperties = [],
                indexers = [],
                marker,
                optional = false,
                properties = [],
                property,
                propertyKey,
                propertyTypeAnnotation,
                token,
                isStatic;
            expect('{');
            while (!match('}')) {
              marker = markerCreate();
              if (allowStatic && matchContextualKeyword('static')) {
                token = lex();
                isStatic = true;
              }
              if (match('[')) {
                indexers.push(parseObjectTypeIndexer(marker, isStatic));
              } else if (match('(') || match('<')) {
                callProperties.push(parseObjectTypeCallProperty(marker, allowStatic));
              } else {
                if (isStatic && match(':')) {
                  propertyKey = markerApply(marker, delegate.createIdentifier(token));
                  throwErrorTolerant(token, Messages.StrictReservedWord);
                } else {
                  propertyKey = parseObjectPropertyKey();
                }
                if (match('<') || match('(')) {
                  properties.push(parseObjectTypeMethod(marker, isStatic, propertyKey));
                } else {
                  if (match('?')) {
                    lex();
                    optional = true;
                  }
                  expect(':');
                  propertyTypeAnnotation = parseType();
                  properties.push(markerApply(marker, delegate.createObjectTypeProperty(propertyKey, propertyTypeAnnotation, optional, isStatic)));
                }
              }
              if (match(';')) {
                lex();
              } else if (!match('}')) {
                throwUnexpected(lookahead);
              }
            }
            expect('}');
            return delegate.createObjectTypeAnnotation(properties, indexers, callProperties);
          }
          function parseGenericType() {
            var marker = markerCreate(),
                returnType = null,
                typeParameters = null,
                typeIdentifier,
                typeIdentifierMarker = markerCreate;
            typeIdentifier = parseVariableIdentifier();
            while (match('.')) {
              expect('.');
              typeIdentifier = markerApply(marker, delegate.createQualifiedTypeIdentifier(typeIdentifier, parseVariableIdentifier()));
            }
            if (match('<')) {
              typeParameters = parseTypeParameterInstantiation();
            }
            return markerApply(marker, delegate.createGenericTypeAnnotation(typeIdentifier, typeParameters));
          }
          function parseVoidType() {
            var marker = markerCreate();
            expectKeyword('void');
            return markerApply(marker, delegate.createVoidTypeAnnotation());
          }
          function parseTypeofType() {
            var argument,
                marker = markerCreate();
            expectKeyword('typeof');
            argument = parsePrimaryType();
            return markerApply(marker, delegate.createTypeofTypeAnnotation(argument));
          }
          function parseTupleType() {
            var marker = markerCreate(),
                types = [];
            expect('[');
            while (index < length && !match(']')) {
              types.push(parseType());
              if (match(']')) {
                break;
              }
              expect(',');
            }
            expect(']');
            return markerApply(marker, delegate.createTupleTypeAnnotation(types));
          }
          function parseFunctionTypeParam() {
            var marker = markerCreate(),
                name,
                optional = false,
                typeAnnotation;
            name = parseVariableIdentifier();
            if (match('?')) {
              lex();
              optional = true;
            }
            expect(':');
            typeAnnotation = parseType();
            return markerApply(marker, delegate.createFunctionTypeParam(name, typeAnnotation, optional));
          }
          function parseFunctionTypeParams() {
            var ret = {
              params: [],
              rest: null
            };
            while (lookahead.type === Token.Identifier) {
              ret.params.push(parseFunctionTypeParam());
              if (!match(')')) {
                expect(',');
              }
            }
            if (match('...')) {
              lex();
              ret.rest = parseFunctionTypeParam();
            }
            return ret;
          }
          function parsePrimaryType() {
            var typeIdentifier = null,
                params = null,
                returnType = null,
                marker = markerCreate(),
                rest = null,
                tmp,
                typeParameters,
                token,
                type,
                isGroupedType = false;
            switch (lookahead.type) {
              case Token.Identifier:
                switch (lookahead.value) {
                  case 'any':
                    lex();
                    return markerApply(marker, delegate.createAnyTypeAnnotation());
                  case 'bool':
                  case 'boolean':
                    lex();
                    return markerApply(marker, delegate.createBooleanTypeAnnotation());
                  case 'number':
                    lex();
                    return markerApply(marker, delegate.createNumberTypeAnnotation());
                  case 'string':
                    lex();
                    return markerApply(marker, delegate.createStringTypeAnnotation());
                }
                return markerApply(marker, parseGenericType());
              case Token.Punctuator:
                switch (lookahead.value) {
                  case '{':
                    return markerApply(marker, parseObjectType());
                  case '[':
                    return parseTupleType();
                  case '<':
                    typeParameters = parseTypeParameterDeclaration();
                    expect('(');
                    tmp = parseFunctionTypeParams();
                    params = tmp.params;
                    rest = tmp.rest;
                    expect(')');
                    expect('=>');
                    returnType = parseType();
                    return markerApply(marker, delegate.createFunctionTypeAnnotation(params, returnType, rest, typeParameters));
                  case '(':
                    lex();
                    if (!match(')') && !match('...')) {
                      if (lookahead.type === Token.Identifier) {
                        token = lookahead2();
                        isGroupedType = token.value !== '?' && token.value !== ':';
                      } else {
                        isGroupedType = true;
                      }
                    }
                    if (isGroupedType) {
                      type = parseType();
                      expect(')');
                      if (match('=>')) {
                        throwError({}, Messages.ConfusedAboutFunctionType);
                      }
                      return type;
                    }
                    tmp = parseFunctionTypeParams();
                    params = tmp.params;
                    rest = tmp.rest;
                    expect(')');
                    expect('=>');
                    returnType = parseType();
                    return markerApply(marker, delegate.createFunctionTypeAnnotation(params, returnType, rest, null));
                }
                break;
              case Token.Keyword:
                switch (lookahead.value) {
                  case 'void':
                    return markerApply(marker, parseVoidType());
                  case 'typeof':
                    return markerApply(marker, parseTypeofType());
                }
                break;
              case Token.StringLiteral:
                token = lex();
                if (token.octal) {
                  throwError(token, Messages.StrictOctalLiteral);
                }
                return markerApply(marker, delegate.createStringLiteralTypeAnnotation(token));
            }
            throwUnexpected(lookahead);
          }
          function parsePostfixType() {
            var marker = markerCreate(),
                t = parsePrimaryType();
            if (match('[')) {
              expect('[');
              expect(']');
              return markerApply(marker, delegate.createArrayTypeAnnotation(t));
            }
            return t;
          }
          function parsePrefixType() {
            var marker = markerCreate();
            if (match('?')) {
              lex();
              return markerApply(marker, delegate.createNullableTypeAnnotation(parsePrefixType()));
            }
            return parsePostfixType();
          }
          function parseIntersectionType() {
            var marker = markerCreate(),
                type,
                types;
            type = parsePrefixType();
            types = [type];
            while (match('&')) {
              lex();
              types.push(parsePrefixType());
            }
            return types.length === 1 ? type : markerApply(marker, delegate.createIntersectionTypeAnnotation(types));
          }
          function parseUnionType() {
            var marker = markerCreate(),
                type,
                types;
            type = parseIntersectionType();
            types = [type];
            while (match('|')) {
              lex();
              types.push(parseIntersectionType());
            }
            return types.length === 1 ? type : markerApply(marker, delegate.createUnionTypeAnnotation(types));
          }
          function parseType() {
            var oldInType = state.inType,
                type;
            state.inType = true;
            type = parseUnionType();
            state.inType = oldInType;
            return type;
          }
          function parseTypeAnnotation() {
            var marker = markerCreate(),
                type;
            expect(':');
            type = parseType();
            return markerApply(marker, delegate.createTypeAnnotation(type));
          }
          function parseVariableIdentifier() {
            var marker = markerCreate(),
                token = lex();
            if (token.type !== Token.Identifier) {
              throwUnexpected(token);
            }
            return markerApply(marker, delegate.createIdentifier(token.value));
          }
          function parseTypeAnnotatableIdentifier(requireTypeAnnotation, canBeOptionalParam) {
            var marker = markerCreate(),
                ident = parseVariableIdentifier(),
                isOptionalParam = false;
            if (canBeOptionalParam && match('?')) {
              expect('?');
              isOptionalParam = true;
            }
            if (requireTypeAnnotation || match(':')) {
              ident.typeAnnotation = parseTypeAnnotation();
              ident = markerApply(marker, ident);
            }
            if (isOptionalParam) {
              ident.optional = true;
              ident = markerApply(marker, ident);
            }
            return ident;
          }
          function parseVariableDeclaration(kind) {
            var id,
                marker = markerCreate(),
                init = null,
                typeAnnotationMarker = markerCreate();
            if (match('{')) {
              id = parseObjectInitialiser();
              reinterpretAsAssignmentBindingPattern(id);
              if (match(':')) {
                id.typeAnnotation = parseTypeAnnotation();
                markerApply(typeAnnotationMarker, id);
              }
            } else if (match('[')) {
              id = parseArrayInitialiser();
              reinterpretAsAssignmentBindingPattern(id);
              if (match(':')) {
                id.typeAnnotation = parseTypeAnnotation();
                markerApply(typeAnnotationMarker, id);
              }
            } else {
              id = state.allowKeyword ? parseNonComputedProperty() : parseTypeAnnotatableIdentifier();
              if (strict && isRestrictedWord(id.name)) {
                throwErrorTolerant({}, Messages.StrictVarName);
              }
            }
            if (kind === 'const') {
              if (!match('=')) {
                throwError({}, Messages.NoUnintializedConst);
              }
              expect('=');
              init = parseAssignmentExpression();
            } else if (match('=')) {
              lex();
              init = parseAssignmentExpression();
            }
            return markerApply(marker, delegate.createVariableDeclarator(id, init));
          }
          function parseVariableDeclarationList(kind) {
            var list = [];
            do {
              list.push(parseVariableDeclaration(kind));
              if (!match(',')) {
                break;
              }
              lex();
            } while (index < length);
            return list;
          }
          function parseVariableStatement() {
            var declarations,
                marker = markerCreate();
            expectKeyword('var');
            declarations = parseVariableDeclarationList();
            consumeSemicolon();
            return markerApply(marker, delegate.createVariableDeclaration(declarations, 'var'));
          }
          function parseConstLetDeclaration(kind) {
            var declarations,
                marker = markerCreate();
            expectKeyword(kind);
            declarations = parseVariableDeclarationList(kind);
            consumeSemicolon();
            return markerApply(marker, delegate.createVariableDeclaration(declarations, kind));
          }
          function parseModuleSpecifier() {
            var marker = markerCreate(),
                specifier;
            if (lookahead.type !== Token.StringLiteral) {
              throwError({}, Messages.InvalidModuleSpecifier);
            }
            specifier = delegate.createModuleSpecifier(lookahead);
            lex();
            return markerApply(marker, specifier);
          }
          function parseExportBatchSpecifier() {
            var marker = markerCreate();
            expect('*');
            return markerApply(marker, delegate.createExportBatchSpecifier());
          }
          function parseExportSpecifier() {
            var id,
                name = null,
                marker = markerCreate(),
                from;
            if (matchKeyword('default')) {
              lex();
              id = markerApply(marker, delegate.createIdentifier('default'));
            } else {
              id = parseVariableIdentifier();
            }
            if (matchContextualKeyword('as')) {
              lex();
              name = parseNonComputedProperty();
            }
            return markerApply(marker, delegate.createExportSpecifier(id, name));
          }
          function parseExportDeclaration() {
            var backtrackToken,
                id,
                previousAllowKeyword,
                declaration = null,
                isExportFromIdentifier,
                src = null,
                specifiers = [],
                marker = markerCreate();
            expectKeyword('export');
            if (matchKeyword('default')) {
              lex();
              if (matchKeyword('function') || matchKeyword('class')) {
                backtrackToken = lookahead;
                lex();
                if (isIdentifierName(lookahead)) {
                  id = parseNonComputedProperty();
                  rewind(backtrackToken);
                  return markerApply(marker, delegate.createExportDeclaration(true, parseSourceElement(), [id], null));
                }
                rewind(backtrackToken);
                switch (lookahead.value) {
                  case 'class':
                    return markerApply(marker, delegate.createExportDeclaration(true, parseClassExpression(), [], null));
                  case 'function':
                    return markerApply(marker, delegate.createExportDeclaration(true, parseFunctionExpression(), [], null));
                }
              }
              if (matchContextualKeyword('from')) {
                throwError({}, Messages.UnexpectedToken, lookahead.value);
              }
              if (match('{')) {
                declaration = parseObjectInitialiser();
              } else if (match('[')) {
                declaration = parseArrayInitialiser();
              } else {
                declaration = parseAssignmentExpression();
              }
              consumeSemicolon();
              return markerApply(marker, delegate.createExportDeclaration(true, declaration, [], null));
            }
            if (lookahead.type === Token.Keyword) {
              switch (lookahead.value) {
                case 'let':
                case 'const':
                case 'var':
                case 'class':
                case 'function':
                  return markerApply(marker, delegate.createExportDeclaration(false, parseSourceElement(), specifiers, null));
              }
            }
            if (match('*')) {
              specifiers.push(parseExportBatchSpecifier());
              if (!matchContextualKeyword('from')) {
                throwError({}, lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
              }
              lex();
              src = parseModuleSpecifier();
              consumeSemicolon();
              return markerApply(marker, delegate.createExportDeclaration(false, null, specifiers, src));
            }
            expect('{');
            do {
              isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
              specifiers.push(parseExportSpecifier());
            } while (match(',') && lex());
            expect('}');
            if (matchContextualKeyword('from')) {
              lex();
              src = parseModuleSpecifier();
              consumeSemicolon();
            } else if (isExportFromIdentifier) {
              throwError({}, lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            } else {
              consumeSemicolon();
            }
            return markerApply(marker, delegate.createExportDeclaration(false, declaration, specifiers, src));
          }
          function parseImportSpecifier() {
            var id,
                name = null,
                marker = markerCreate();
            id = parseNonComputedProperty();
            if (matchContextualKeyword('as')) {
              lex();
              name = parseVariableIdentifier();
            }
            return markerApply(marker, delegate.createImportSpecifier(id, name));
          }
          function parseNamedImports() {
            var specifiers = [];
            expect('{');
            do {
              specifiers.push(parseImportSpecifier());
            } while (match(',') && lex());
            expect('}');
            return specifiers;
          }
          function parseImportDefaultSpecifier() {
            var id,
                marker = markerCreate();
            id = parseNonComputedProperty();
            return markerApply(marker, delegate.createImportDefaultSpecifier(id));
          }
          function parseImportNamespaceSpecifier() {
            var id,
                marker = markerCreate();
            expect('*');
            if (!matchContextualKeyword('as')) {
              throwError({}, Messages.NoAsAfterImportNamespace);
            }
            lex();
            id = parseNonComputedProperty();
            return markerApply(marker, delegate.createImportNamespaceSpecifier(id));
          }
          function parseImportDeclaration() {
            var specifiers,
                src,
                marker = markerCreate();
            expectKeyword('import');
            specifiers = [];
            if (lookahead.type === Token.StringLiteral) {
              src = parseModuleSpecifier();
              consumeSemicolon();
              return markerApply(marker, delegate.createImportDeclaration(specifiers, src));
            }
            if (!matchKeyword('default') && isIdentifierName(lookahead)) {
              specifiers.push(parseImportDefaultSpecifier());
              if (match(',')) {
                lex();
              }
            }
            if (match('*')) {
              specifiers.push(parseImportNamespaceSpecifier());
            } else if (match('{')) {
              specifiers = specifiers.concat(parseNamedImports());
            }
            if (!matchContextualKeyword('from')) {
              throwError({}, lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
            return markerApply(marker, delegate.createImportDeclaration(specifiers, src));
          }
          function parseEmptyStatement() {
            var marker = markerCreate();
            expect(';');
            return markerApply(marker, delegate.createEmptyStatement());
          }
          function parseExpressionStatement() {
            var marker = markerCreate(),
                expr = parseExpression();
            consumeSemicolon();
            return markerApply(marker, delegate.createExpressionStatement(expr));
          }
          function parseIfStatement() {
            var test,
                consequent,
                alternate,
                marker = markerCreate();
            expectKeyword('if');
            expect('(');
            test = parseExpression();
            expect(')');
            consequent = parseStatement();
            if (matchKeyword('else')) {
              lex();
              alternate = parseStatement();
            } else {
              alternate = null;
            }
            return markerApply(marker, delegate.createIfStatement(test, consequent, alternate));
          }
          function parseDoWhileStatement() {
            var body,
                test,
                oldInIteration,
                marker = markerCreate();
            expectKeyword('do');
            oldInIteration = state.inIteration;
            state.inIteration = true;
            body = parseStatement();
            state.inIteration = oldInIteration;
            expectKeyword('while');
            expect('(');
            test = parseExpression();
            expect(')');
            if (match(';')) {
              lex();
            }
            return markerApply(marker, delegate.createDoWhileStatement(body, test));
          }
          function parseWhileStatement() {
            var test,
                body,
                oldInIteration,
                marker = markerCreate();
            expectKeyword('while');
            expect('(');
            test = parseExpression();
            expect(')');
            oldInIteration = state.inIteration;
            state.inIteration = true;
            body = parseStatement();
            state.inIteration = oldInIteration;
            return markerApply(marker, delegate.createWhileStatement(test, body));
          }
          function parseForVariableDeclaration() {
            var marker = markerCreate(),
                token = lex(),
                declarations = parseVariableDeclarationList();
            return markerApply(marker, delegate.createVariableDeclaration(declarations, token.value));
          }
          function parseForStatement(opts) {
            var init,
                test,
                update,
                left,
                right,
                body,
                operator,
                oldInIteration,
                marker = markerCreate();
            init = test = update = null;
            expectKeyword('for');
            if (matchContextualKeyword('each')) {
              throwError({}, Messages.EachNotAllowed);
            }
            expect('(');
            if (match(';')) {
              lex();
            } else {
              if (matchKeyword('var') || matchKeyword('let') || matchKeyword('const')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;
                if (init.declarations.length === 1) {
                  if (matchKeyword('in') || matchContextualKeyword('of')) {
                    operator = lookahead;
                    if (!((operator.value === 'in' || init.kind !== 'var') && init.declarations[0].init)) {
                      lex();
                      left = init;
                      right = parseExpression();
                      init = null;
                    }
                  }
                }
              } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;
                if (matchContextualKeyword('of')) {
                  operator = lex();
                  left = init;
                  right = parseExpression();
                  init = null;
                } else if (matchKeyword('in')) {
                  if (!isAssignableLeftHandSide(init)) {
                    throwError({}, Messages.InvalidLHSInForIn);
                  }
                  operator = lex();
                  left = init;
                  right = parseExpression();
                  init = null;
                }
              }
              if (typeof left === 'undefined') {
                expect(';');
              }
            }
            if (typeof left === 'undefined') {
              if (!match(';')) {
                test = parseExpression();
              }
              expect(';');
              if (!match(')')) {
                update = parseExpression();
              }
            }
            expect(')');
            oldInIteration = state.inIteration;
            state.inIteration = true;
            if (!(opts !== undefined && opts.ignoreBody)) {
              body = parseStatement();
            }
            state.inIteration = oldInIteration;
            if (typeof left === 'undefined') {
              return markerApply(marker, delegate.createForStatement(init, test, update, body));
            }
            if (operator.value === 'in') {
              return markerApply(marker, delegate.createForInStatement(left, right, body));
            }
            return markerApply(marker, delegate.createForOfStatement(left, right, body));
          }
          function parseContinueStatement() {
            var label = null,
                key,
                marker = markerCreate();
            expectKeyword('continue');
            if (source.charCodeAt(index) === 59) {
              lex();
              if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
              }
              return markerApply(marker, delegate.createContinueStatement(null));
            }
            if (peekLineTerminator()) {
              if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
              }
              return markerApply(marker, delegate.createContinueStatement(null));
            }
            if (lookahead.type === Token.Identifier) {
              label = parseVariableIdentifier();
              key = '$' + label.name;
              if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
              }
            }
            consumeSemicolon();
            if (label === null && !state.inIteration) {
              throwError({}, Messages.IllegalContinue);
            }
            return markerApply(marker, delegate.createContinueStatement(label));
          }
          function parseBreakStatement() {
            var label = null,
                key,
                marker = markerCreate();
            expectKeyword('break');
            if (source.charCodeAt(index) === 59) {
              lex();
              if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
              }
              return markerApply(marker, delegate.createBreakStatement(null));
            }
            if (peekLineTerminator()) {
              if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
              }
              return markerApply(marker, delegate.createBreakStatement(null));
            }
            if (lookahead.type === Token.Identifier) {
              label = parseVariableIdentifier();
              key = '$' + label.name;
              if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
              }
            }
            consumeSemicolon();
            if (label === null && !(state.inIteration || state.inSwitch)) {
              throwError({}, Messages.IllegalBreak);
            }
            return markerApply(marker, delegate.createBreakStatement(label));
          }
          function parseReturnStatement() {
            var argument = null,
                marker = markerCreate();
            expectKeyword('return');
            if (!state.inFunctionBody) {
              throwErrorTolerant({}, Messages.IllegalReturn);
            }
            if (source.charCodeAt(index) === 32) {
              if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return markerApply(marker, delegate.createReturnStatement(argument));
              }
            }
            if (peekLineTerminator()) {
              return markerApply(marker, delegate.createReturnStatement(null));
            }
            if (!match(';')) {
              if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
              }
            }
            consumeSemicolon();
            return markerApply(marker, delegate.createReturnStatement(argument));
          }
          function parseWithStatement() {
            var object,
                body,
                marker = markerCreate();
            if (strict) {
              throwErrorTolerant({}, Messages.StrictModeWith);
            }
            expectKeyword('with');
            expect('(');
            object = parseExpression();
            expect(')');
            body = parseStatement();
            return markerApply(marker, delegate.createWithStatement(object, body));
          }
          function parseSwitchCase() {
            var test,
                consequent = [],
                sourceElement,
                marker = markerCreate();
            if (matchKeyword('default')) {
              lex();
              test = null;
            } else {
              expectKeyword('case');
              test = parseExpression();
            }
            expect(':');
            while (index < length) {
              if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
              }
              sourceElement = parseSourceElement();
              if (typeof sourceElement === 'undefined') {
                break;
              }
              consequent.push(sourceElement);
            }
            return markerApply(marker, delegate.createSwitchCase(test, consequent));
          }
          function parseSwitchStatement() {
            var discriminant,
                cases,
                clause,
                oldInSwitch,
                defaultFound,
                marker = markerCreate();
            expectKeyword('switch');
            expect('(');
            discriminant = parseExpression();
            expect(')');
            expect('{');
            cases = [];
            if (match('}')) {
              lex();
              return markerApply(marker, delegate.createSwitchStatement(discriminant, cases));
            }
            oldInSwitch = state.inSwitch;
            state.inSwitch = true;
            defaultFound = false;
            while (index < length) {
              if (match('}')) {
                break;
              }
              clause = parseSwitchCase();
              if (clause.test === null) {
                if (defaultFound) {
                  throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
              }
              cases.push(clause);
            }
            state.inSwitch = oldInSwitch;
            expect('}');
            return markerApply(marker, delegate.createSwitchStatement(discriminant, cases));
          }
          function parseThrowStatement() {
            var argument,
                marker = markerCreate();
            expectKeyword('throw');
            if (peekLineTerminator()) {
              throwError({}, Messages.NewlineAfterThrow);
            }
            argument = parseExpression();
            consumeSemicolon();
            return markerApply(marker, delegate.createThrowStatement(argument));
          }
          function parseCatchClause() {
            var param,
                body,
                marker = markerCreate();
            expectKeyword('catch');
            expect('(');
            if (match(')')) {
              throwUnexpected(lookahead);
            }
            param = parseExpression();
            if (strict && param.type === Syntax.Identifier && isRestrictedWord(param.name)) {
              throwErrorTolerant({}, Messages.StrictCatchVariable);
            }
            expect(')');
            body = parseBlock();
            return markerApply(marker, delegate.createCatchClause(param, body));
          }
          function parseTryStatement() {
            var block,
                handlers = [],
                finalizer = null,
                marker = markerCreate();
            expectKeyword('try');
            block = parseBlock();
            if (matchKeyword('catch')) {
              handlers.push(parseCatchClause());
            }
            if (matchKeyword('finally')) {
              lex();
              finalizer = parseBlock();
            }
            if (handlers.length === 0 && !finalizer) {
              throwError({}, Messages.NoCatchOrFinally);
            }
            return markerApply(marker, delegate.createTryStatement(block, [], handlers, finalizer));
          }
          function parseDebuggerStatement() {
            var marker = markerCreate();
            expectKeyword('debugger');
            consumeSemicolon();
            return markerApply(marker, delegate.createDebuggerStatement());
          }
          function parseStatement() {
            var type = lookahead.type,
                marker,
                expr,
                labeledBody,
                key;
            if (type === Token.EOF) {
              throwUnexpected(lookahead);
            }
            if (type === Token.Punctuator) {
              switch (lookahead.value) {
                case ';':
                  return parseEmptyStatement();
                case '{':
                  return parseBlock();
                case '(':
                  return parseExpressionStatement();
                default:
                  break;
              }
            }
            if (type === Token.Keyword) {
              switch (lookahead.value) {
                case 'break':
                  return parseBreakStatement();
                case 'continue':
                  return parseContinueStatement();
                case 'debugger':
                  return parseDebuggerStatement();
                case 'do':
                  return parseDoWhileStatement();
                case 'for':
                  return parseForStatement();
                case 'function':
                  return parseFunctionDeclaration();
                case 'class':
                  return parseClassDeclaration();
                case 'if':
                  return parseIfStatement();
                case 'return':
                  return parseReturnStatement();
                case 'switch':
                  return parseSwitchStatement();
                case 'throw':
                  return parseThrowStatement();
                case 'try':
                  return parseTryStatement();
                case 'var':
                  return parseVariableStatement();
                case 'while':
                  return parseWhileStatement();
                case 'with':
                  return parseWithStatement();
                default:
                  break;
              }
            }
            if (matchAsyncFuncExprOrDecl()) {
              return parseFunctionDeclaration();
            }
            marker = markerCreate();
            expr = parseExpression();
            if ((expr.type === Syntax.Identifier) && match(':')) {
              lex();
              key = '$' + expr.name;
              if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
              }
              state.labelSet[key] = true;
              labeledBody = parseStatement();
              delete state.labelSet[key];
              return markerApply(marker, delegate.createLabeledStatement(expr, labeledBody));
            }
            consumeSemicolon();
            return markerApply(marker, delegate.createExpressionStatement(expr));
          }
          function parseConciseBody() {
            if (match('{')) {
              return parseFunctionSourceElements();
            }
            return parseAssignmentExpression();
          }
          function parseFunctionSourceElements() {
            var sourceElement,
                sourceElements = [],
                token,
                directive,
                firstRestricted,
                oldLabelSet,
                oldInIteration,
                oldInSwitch,
                oldInFunctionBody,
                oldParenthesizedCount,
                marker = markerCreate();
            expect('{');
            while (index < length) {
              if (lookahead.type !== Token.StringLiteral) {
                break;
              }
              token = lookahead;
              sourceElement = parseSourceElement();
              sourceElements.push(sourceElement);
              if (sourceElement.expression.type !== Syntax.Literal) {
                break;
              }
              directive = source.slice(token.range[0] + 1, token.range[1] - 1);
              if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                  throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
              } else {
                if (!firstRestricted && token.octal) {
                  firstRestricted = token;
                }
              }
            }
            oldLabelSet = state.labelSet;
            oldInIteration = state.inIteration;
            oldInSwitch = state.inSwitch;
            oldInFunctionBody = state.inFunctionBody;
            oldParenthesizedCount = state.parenthesizedCount;
            state.labelSet = {};
            state.inIteration = false;
            state.inSwitch = false;
            state.inFunctionBody = true;
            state.parenthesizedCount = 0;
            while (index < length) {
              if (match('}')) {
                break;
              }
              sourceElement = parseSourceElement();
              if (typeof sourceElement === 'undefined') {
                break;
              }
              sourceElements.push(sourceElement);
            }
            expect('}');
            state.labelSet = oldLabelSet;
            state.inIteration = oldInIteration;
            state.inSwitch = oldInSwitch;
            state.inFunctionBody = oldInFunctionBody;
            state.parenthesizedCount = oldParenthesizedCount;
            return markerApply(marker, delegate.createBlockStatement(sourceElements));
          }
          function validateParam(options, param, name) {
            var key = '$' + name;
            if (strict) {
              if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
              }
              if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
              }
            } else if (!options.firstRestricted) {
              if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
              } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
              } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamDupe;
              }
            }
            options.paramSet[key] = true;
          }
          function parseParam(options) {
            var marker,
                token,
                rest,
                param,
                def;
            token = lookahead;
            if (token.value === '...') {
              token = lex();
              rest = true;
            }
            if (match('[')) {
              marker = markerCreate();
              param = parseArrayInitialiser();
              reinterpretAsDestructuredParameter(options, param);
              if (match(':')) {
                param.typeAnnotation = parseTypeAnnotation();
                markerApply(marker, param);
              }
            } else if (match('{')) {
              marker = markerCreate();
              if (rest) {
                throwError({}, Messages.ObjectPatternAsRestParameter);
              }
              param = parseObjectInitialiser();
              reinterpretAsDestructuredParameter(options, param);
              if (match(':')) {
                param.typeAnnotation = parseTypeAnnotation();
                markerApply(marker, param);
              }
            } else {
              param = rest ? parseTypeAnnotatableIdentifier(false, false) : parseTypeAnnotatableIdentifier(false, true);
              validateParam(options, token, token.value);
            }
            if (match('=')) {
              if (rest) {
                throwErrorTolerant(lookahead, Messages.DefaultRestParameter);
              }
              lex();
              def = parseAssignmentExpression();
              ++options.defaultCount;
            }
            if (rest) {
              if (!match(')')) {
                throwError({}, Messages.ParameterAfterRestParameter);
              }
              options.rest = param;
              return false;
            }
            options.params.push(param);
            options.defaults.push(def);
            return !match(')');
          }
          function parseParams(firstRestricted) {
            var options,
                marker = markerCreate();
            options = {
              params: [],
              defaultCount: 0,
              defaults: [],
              rest: null,
              firstRestricted: firstRestricted
            };
            expect('(');
            if (!match(')')) {
              options.paramSet = {};
              while (index < length) {
                if (!parseParam(options)) {
                  break;
                }
                expect(',');
              }
            }
            expect(')');
            if (options.defaultCount === 0) {
              options.defaults = [];
            }
            if (match(':')) {
              options.returnType = parseTypeAnnotation();
            }
            return markerApply(marker, options);
          }
          function parseFunctionDeclaration() {
            var id,
                body,
                token,
                tmp,
                firstRestricted,
                message,
                generator,
                isAsync,
                previousStrict,
                previousYieldAllowed,
                previousAwaitAllowed,
                marker = markerCreate(),
                typeParameters;
            isAsync = false;
            if (matchAsync()) {
              lex();
              isAsync = true;
            }
            expectKeyword('function');
            generator = false;
            if (match('*')) {
              lex();
              generator = true;
            }
            token = lookahead;
            id = parseVariableIdentifier();
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            if (strict) {
              if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
              }
            } else {
              if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
              } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
              }
            }
            tmp = parseParams(firstRestricted);
            firstRestricted = tmp.firstRestricted;
            if (tmp.message) {
              message = tmp.message;
            }
            previousStrict = strict;
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = generator;
            previousAwaitAllowed = state.awaitAllowed;
            state.awaitAllowed = isAsync;
            body = parseFunctionSourceElements();
            if (strict && firstRestricted) {
              throwError(firstRestricted, message);
            }
            if (strict && tmp.stricted) {
              throwErrorTolerant(tmp.stricted, message);
            }
            strict = previousStrict;
            state.yieldAllowed = previousYieldAllowed;
            state.awaitAllowed = previousAwaitAllowed;
            return markerApply(marker, delegate.createFunctionDeclaration(id, tmp.params, tmp.defaults, body, tmp.rest, generator, false, isAsync, tmp.returnType, typeParameters));
          }
          function parseFunctionExpression() {
            var token,
                id = null,
                firstRestricted,
                message,
                tmp,
                body,
                generator,
                isAsync,
                previousStrict,
                previousYieldAllowed,
                previousAwaitAllowed,
                marker = markerCreate(),
                typeParameters;
            isAsync = false;
            if (matchAsync()) {
              lex();
              isAsync = true;
            }
            expectKeyword('function');
            generator = false;
            if (match('*')) {
              lex();
              generator = true;
            }
            if (!match('(')) {
              if (!match('<')) {
                token = lookahead;
                id = parseVariableIdentifier();
                if (strict) {
                  if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                  }
                } else {
                  if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                  } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                  }
                }
              }
              if (match('<')) {
                typeParameters = parseTypeParameterDeclaration();
              }
            }
            tmp = parseParams(firstRestricted);
            firstRestricted = tmp.firstRestricted;
            if (tmp.message) {
              message = tmp.message;
            }
            previousStrict = strict;
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = generator;
            previousAwaitAllowed = state.awaitAllowed;
            state.awaitAllowed = isAsync;
            body = parseFunctionSourceElements();
            if (strict && firstRestricted) {
              throwError(firstRestricted, message);
            }
            if (strict && tmp.stricted) {
              throwErrorTolerant(tmp.stricted, message);
            }
            strict = previousStrict;
            state.yieldAllowed = previousYieldAllowed;
            state.awaitAllowed = previousAwaitAllowed;
            return markerApply(marker, delegate.createFunctionExpression(id, tmp.params, tmp.defaults, body, tmp.rest, generator, false, isAsync, tmp.returnType, typeParameters));
          }
          function parseYieldExpression() {
            var delegateFlag,
                expr,
                marker = markerCreate();
            expectKeyword('yield', !strict);
            delegateFlag = false;
            if (match('*')) {
              lex();
              delegateFlag = true;
            }
            expr = parseAssignmentExpression();
            return markerApply(marker, delegate.createYieldExpression(expr, delegateFlag));
          }
          function parseAwaitExpression() {
            var expr,
                marker = markerCreate();
            expectContextualKeyword('await');
            expr = parseAssignmentExpression();
            return markerApply(marker, delegate.createAwaitExpression(expr));
          }
          function parseMethodDefinition(existingPropNames, key, isStatic, generator, computed) {
            var token,
                param,
                propType,
                isValidDuplicateProp = false,
                isAsync,
                typeParameters,
                tokenValue,
                returnType,
                annotationMarker;
            propType = isStatic ? ClassPropertyType["static"] : ClassPropertyType.prototype;
            if (generator) {
              return delegate.createMethodDefinition(propType, '', key, parsePropertyMethodFunction({generator: true}));
            }
            tokenValue = key.type === 'Identifier' && key.name;
            if (tokenValue === 'get' && !match('(')) {
              key = parseObjectPropertyKey();
              if (existingPropNames[propType].hasOwnProperty(key.name)) {
                isValidDuplicateProp = existingPropNames[propType][key.name].get === undefined && existingPropNames[propType][key.name].data === undefined && existingPropNames[propType][key.name].set !== undefined;
                if (!isValidDuplicateProp) {
                  throwError(key, Messages.IllegalDuplicateClassProperty);
                }
              } else {
                existingPropNames[propType][key.name] = {};
              }
              existingPropNames[propType][key.name].get = true;
              expect('(');
              expect(')');
              if (match(':')) {
                returnType = parseTypeAnnotation();
              }
              return delegate.createMethodDefinition(propType, 'get', key, parsePropertyFunction({
                generator: false,
                returnType: returnType
              }));
            }
            if (tokenValue === 'set' && !match('(')) {
              key = parseObjectPropertyKey();
              if (existingPropNames[propType].hasOwnProperty(key.name)) {
                isValidDuplicateProp = existingPropNames[propType][key.name].set === undefined && existingPropNames[propType][key.name].data === undefined && existingPropNames[propType][key.name].get !== undefined;
                if (!isValidDuplicateProp) {
                  throwError(key, Messages.IllegalDuplicateClassProperty);
                }
              } else {
                existingPropNames[propType][key.name] = {};
              }
              existingPropNames[propType][key.name].set = true;
              expect('(');
              token = lookahead;
              param = [parseTypeAnnotatableIdentifier()];
              expect(')');
              if (match(':')) {
                returnType = parseTypeAnnotation();
              }
              return delegate.createMethodDefinition(propType, 'set', key, parsePropertyFunction({
                params: param,
                generator: false,
                name: token,
                returnType: returnType
              }));
            }
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            isAsync = tokenValue === 'async' && !match('(');
            if (isAsync) {
              key = parseObjectPropertyKey();
            }
            if (existingPropNames[propType].hasOwnProperty(key.name)) {
              throwError(key, Messages.IllegalDuplicateClassProperty);
            } else {
              existingPropNames[propType][key.name] = {};
            }
            existingPropNames[propType][key.name].data = true;
            return delegate.createMethodDefinition(propType, '', key, parsePropertyMethodFunction({
              generator: false,
              async: isAsync,
              typeParameters: typeParameters
            }));
          }
          function parseClassProperty(existingPropNames, key, computed, isStatic) {
            var typeAnnotation;
            typeAnnotation = parseTypeAnnotation();
            expect(';');
            return delegate.createClassProperty(key, typeAnnotation, computed, isStatic);
          }
          function parseClassElement(existingProps) {
            var computed,
                generator = false,
                key,
                marker = markerCreate(),
                isStatic = false;
            if (match(';')) {
              lex();
              return ;
            }
            if (lookahead.value === 'static') {
              lex();
              isStatic = true;
            }
            if (match('*')) {
              lex();
              generator = true;
            }
            computed = (lookahead.value === '[');
            key = parseObjectPropertyKey();
            if (!generator && lookahead.value === ':') {
              return markerApply(marker, parseClassProperty(existingProps, key, computed, isStatic));
            }
            return markerApply(marker, parseMethodDefinition(existingProps, key, isStatic, generator, computed));
          }
          function parseClassBody() {
            var classElement,
                classElements = [],
                existingProps = {},
                marker = markerCreate();
            existingProps[ClassPropertyType["static"]] = {};
            existingProps[ClassPropertyType.prototype] = {};
            expect('{');
            while (index < length) {
              if (match('}')) {
                break;
              }
              classElement = parseClassElement(existingProps);
              if (typeof classElement !== 'undefined') {
                classElements.push(classElement);
              }
            }
            expect('}');
            return markerApply(marker, delegate.createClassBody(classElements));
          }
          function parseClassImplements() {
            var id,
                implemented = [],
                marker,
                typeParameters;
            expectContextualKeyword('implements');
            while (index < length) {
              marker = markerCreate();
              id = parseVariableIdentifier();
              if (match('<')) {
                typeParameters = parseTypeParameterInstantiation();
              } else {
                typeParameters = null;
              }
              implemented.push(markerApply(marker, delegate.createClassImplements(id, typeParameters)));
              if (!match(',')) {
                break;
              }
              expect(',');
            }
            return implemented;
          }
          function parseClassExpression() {
            var id,
                implemented,
                previousYieldAllowed,
                superClass = null,
                superTypeParameters,
                marker = markerCreate(),
                typeParameters;
            expectKeyword('class');
            if (!matchKeyword('extends') && !matchContextualKeyword('implements') && !match('{')) {
              id = parseVariableIdentifier();
            }
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            if (matchKeyword('extends')) {
              expectKeyword('extends');
              previousYieldAllowed = state.yieldAllowed;
              state.yieldAllowed = false;
              superClass = parseLeftHandSideExpressionAllowCall();
              if (match('<')) {
                superTypeParameters = parseTypeParameterInstantiation();
              }
              state.yieldAllowed = previousYieldAllowed;
            }
            if (matchContextualKeyword('implements')) {
              implemented = parseClassImplements();
            }
            return markerApply(marker, delegate.createClassExpression(id, superClass, parseClassBody(), typeParameters, superTypeParameters, implemented));
          }
          function parseClassDeclaration() {
            var id,
                implemented,
                previousYieldAllowed,
                superClass = null,
                superTypeParameters,
                marker = markerCreate(),
                typeParameters;
            expectKeyword('class');
            id = parseVariableIdentifier();
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            if (matchKeyword('extends')) {
              expectKeyword('extends');
              previousYieldAllowed = state.yieldAllowed;
              state.yieldAllowed = false;
              superClass = parseLeftHandSideExpressionAllowCall();
              if (match('<')) {
                superTypeParameters = parseTypeParameterInstantiation();
              }
              state.yieldAllowed = previousYieldAllowed;
            }
            if (matchContextualKeyword('implements')) {
              implemented = parseClassImplements();
            }
            return markerApply(marker, delegate.createClassDeclaration(id, superClass, parseClassBody(), typeParameters, superTypeParameters, implemented));
          }
          function parseSourceElement() {
            var token;
            if (lookahead.type === Token.Keyword) {
              switch (lookahead.value) {
                case 'const':
                case 'let':
                  return parseConstLetDeclaration(lookahead.value);
                case 'function':
                  return parseFunctionDeclaration();
                default:
                  return parseStatement();
              }
            }
            if (matchContextualKeyword('type') && lookahead2().type === Token.Identifier) {
              return parseTypeAlias();
            }
            if (matchContextualKeyword('interface') && lookahead2().type === Token.Identifier) {
              return parseInterface();
            }
            if (matchContextualKeyword('declare')) {
              token = lookahead2();
              if (token.type === Token.Keyword) {
                switch (token.value) {
                  case 'class':
                    return parseDeclareClass();
                  case 'function':
                    return parseDeclareFunction();
                  case 'var':
                    return parseDeclareVariable();
                }
              } else if (token.type === Token.Identifier && token.value === 'module') {
                return parseDeclareModule();
              }
            }
            if (lookahead.type !== Token.EOF) {
              return parseStatement();
            }
          }
          function parseProgramElement() {
            if (lookahead.type === Token.Keyword) {
              switch (lookahead.value) {
                case 'export':
                  return parseExportDeclaration();
                case 'import':
                  return parseImportDeclaration();
              }
            }
            return parseSourceElement();
          }
          function parseProgramElements() {
            var sourceElement,
                sourceElements = [],
                token,
                directive,
                firstRestricted;
            while (index < length) {
              token = lookahead;
              if (token.type !== Token.StringLiteral) {
                break;
              }
              sourceElement = parseProgramElement();
              sourceElements.push(sourceElement);
              if (sourceElement.expression.type !== Syntax.Literal) {
                break;
              }
              directive = source.slice(token.range[0] + 1, token.range[1] - 1);
              if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                  throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
              } else {
                if (!firstRestricted && token.octal) {
                  firstRestricted = token;
                }
              }
            }
            while (index < length) {
              sourceElement = parseProgramElement();
              if (typeof sourceElement === 'undefined') {
                break;
              }
              sourceElements.push(sourceElement);
            }
            return sourceElements;
          }
          function parseProgram() {
            var body,
                marker = markerCreate();
            strict = false;
            peek();
            body = parseProgramElements();
            return markerApply(marker, delegate.createProgram(body));
          }
          function addComment(type, value, start, end, loc) {
            var comment;
            assert(typeof start === 'number', 'Comment must have valid position');
            if (state.lastCommentStart >= start) {
              return ;
            }
            state.lastCommentStart = start;
            comment = {
              type: type,
              value: value
            };
            if (extra.range) {
              comment.range = [start, end];
            }
            if (extra.loc) {
              comment.loc = loc;
            }
            extra.comments.push(comment);
            if (extra.attachComment) {
              extra.leadingComments.push(comment);
              extra.trailingComments.push(comment);
            }
          }
          function scanComment() {
            var comment,
                ch,
                loc,
                start,
                blockComment,
                lineComment;
            comment = '';
            blockComment = false;
            lineComment = false;
            while (index < length) {
              ch = source[index];
              if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch.charCodeAt(0))) {
                  loc.end = {
                    line: lineNumber,
                    column: index - lineStart - 1
                  };
                  lineComment = false;
                  addComment('Line', comment, start, index - 1, loc);
                  if (ch === '\r' && source[index] === '\n') {
                    ++index;
                  }
                  ++lineNumber;
                  lineStart = index;
                  comment = '';
                } else if (index >= length) {
                  lineComment = false;
                  comment += ch;
                  loc.end = {
                    line: lineNumber,
                    column: length - lineStart
                  };
                  addComment('Line', comment, start, length, loc);
                } else {
                  comment += ch;
                }
              } else if (blockComment) {
                if (isLineTerminator(ch.charCodeAt(0))) {
                  if (ch === '\r') {
                    ++index;
                    comment += '\r';
                  }
                  if (ch !== '\r' || source[index] === '\n') {
                    comment += source[index];
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  }
                } else {
                  ch = source[index++];
                  if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                  comment += ch;
                  if (ch === '*') {
                    ch = source[index];
                    if (ch === '/') {
                      comment = comment.substr(0, comment.length - 1);
                      blockComment = false;
                      ++index;
                      loc.end = {
                        line: lineNumber,
                        column: index - lineStart
                      };
                      addComment('Block', comment, start, index, loc);
                      comment = '';
                    }
                  }
                }
              } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                  loc = {start: {
                      line: lineNumber,
                      column: index - lineStart
                    }};
                  start = index;
                  index += 2;
                  lineComment = true;
                  if (index >= length) {
                    loc.end = {
                      line: lineNumber,
                      column: index - lineStart
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index, loc);
                  }
                } else if (ch === '*') {
                  start = index;
                  index += 2;
                  blockComment = true;
                  loc = {start: {
                      line: lineNumber,
                      column: index - lineStart - 2
                    }};
                  if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                } else {
                  break;
                }
              } else if (isWhiteSpace(ch.charCodeAt(0))) {
                ++index;
              } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++index;
                if (ch === '\r' && source[index] === '\n') {
                  ++index;
                }
                ++lineNumber;
                lineStart = index;
              } else {
                break;
              }
            }
          }
          XHTMLEntities = {
            quot: '\u0022',
            amp: '&',
            apos: '\u0027',
            lt: '<',
            gt: '>',
            nbsp: '\u00A0',
            iexcl: '\u00A1',
            cent: '\u00A2',
            pound: '\u00A3',
            curren: '\u00A4',
            yen: '\u00A5',
            brvbar: '\u00A6',
            sect: '\u00A7',
            uml: '\u00A8',
            copy: '\u00A9',
            ordf: '\u00AA',
            laquo: '\u00AB',
            not: '\u00AC',
            shy: '\u00AD',
            reg: '\u00AE',
            macr: '\u00AF',
            deg: '\u00B0',
            plusmn: '\u00B1',
            sup2: '\u00B2',
            sup3: '\u00B3',
            acute: '\u00B4',
            micro: '\u00B5',
            para: '\u00B6',
            middot: '\u00B7',
            cedil: '\u00B8',
            sup1: '\u00B9',
            ordm: '\u00BA',
            raquo: '\u00BB',
            frac14: '\u00BC',
            frac12: '\u00BD',
            frac34: '\u00BE',
            iquest: '\u00BF',
            Agrave: '\u00C0',
            Aacute: '\u00C1',
            Acirc: '\u00C2',
            Atilde: '\u00C3',
            Auml: '\u00C4',
            Aring: '\u00C5',
            AElig: '\u00C6',
            Ccedil: '\u00C7',
            Egrave: '\u00C8',
            Eacute: '\u00C9',
            Ecirc: '\u00CA',
            Euml: '\u00CB',
            Igrave: '\u00CC',
            Iacute: '\u00CD',
            Icirc: '\u00CE',
            Iuml: '\u00CF',
            ETH: '\u00D0',
            Ntilde: '\u00D1',
            Ograve: '\u00D2',
            Oacute: '\u00D3',
            Ocirc: '\u00D4',
            Otilde: '\u00D5',
            Ouml: '\u00D6',
            times: '\u00D7',
            Oslash: '\u00D8',
            Ugrave: '\u00D9',
            Uacute: '\u00DA',
            Ucirc: '\u00DB',
            Uuml: '\u00DC',
            Yacute: '\u00DD',
            THORN: '\u00DE',
            szlig: '\u00DF',
            agrave: '\u00E0',
            aacute: '\u00E1',
            acirc: '\u00E2',
            atilde: '\u00E3',
            auml: '\u00E4',
            aring: '\u00E5',
            aelig: '\u00E6',
            ccedil: '\u00E7',
            egrave: '\u00E8',
            eacute: '\u00E9',
            ecirc: '\u00EA',
            euml: '\u00EB',
            igrave: '\u00EC',
            iacute: '\u00ED',
            icirc: '\u00EE',
            iuml: '\u00EF',
            eth: '\u00F0',
            ntilde: '\u00F1',
            ograve: '\u00F2',
            oacute: '\u00F3',
            ocirc: '\u00F4',
            otilde: '\u00F5',
            ouml: '\u00F6',
            divide: '\u00F7',
            oslash: '\u00F8',
            ugrave: '\u00F9',
            uacute: '\u00FA',
            ucirc: '\u00FB',
            uuml: '\u00FC',
            yacute: '\u00FD',
            thorn: '\u00FE',
            yuml: '\u00FF',
            OElig: '\u0152',
            oelig: '\u0153',
            Scaron: '\u0160',
            scaron: '\u0161',
            Yuml: '\u0178',
            fnof: '\u0192',
            circ: '\u02C6',
            tilde: '\u02DC',
            Alpha: '\u0391',
            Beta: '\u0392',
            Gamma: '\u0393',
            Delta: '\u0394',
            Epsilon: '\u0395',
            Zeta: '\u0396',
            Eta: '\u0397',
            Theta: '\u0398',
            Iota: '\u0399',
            Kappa: '\u039A',
            Lambda: '\u039B',
            Mu: '\u039C',
            Nu: '\u039D',
            Xi: '\u039E',
            Omicron: '\u039F',
            Pi: '\u03A0',
            Rho: '\u03A1',
            Sigma: '\u03A3',
            Tau: '\u03A4',
            Upsilon: '\u03A5',
            Phi: '\u03A6',
            Chi: '\u03A7',
            Psi: '\u03A8',
            Omega: '\u03A9',
            alpha: '\u03B1',
            beta: '\u03B2',
            gamma: '\u03B3',
            delta: '\u03B4',
            epsilon: '\u03B5',
            zeta: '\u03B6',
            eta: '\u03B7',
            theta: '\u03B8',
            iota: '\u03B9',
            kappa: '\u03BA',
            lambda: '\u03BB',
            mu: '\u03BC',
            nu: '\u03BD',
            xi: '\u03BE',
            omicron: '\u03BF',
            pi: '\u03C0',
            rho: '\u03C1',
            sigmaf: '\u03C2',
            sigma: '\u03C3',
            tau: '\u03C4',
            upsilon: '\u03C5',
            phi: '\u03C6',
            chi: '\u03C7',
            psi: '\u03C8',
            omega: '\u03C9',
            thetasym: '\u03D1',
            upsih: '\u03D2',
            piv: '\u03D6',
            ensp: '\u2002',
            emsp: '\u2003',
            thinsp: '\u2009',
            zwnj: '\u200C',
            zwj: '\u200D',
            lrm: '\u200E',
            rlm: '\u200F',
            ndash: '\u2013',
            mdash: '\u2014',
            lsquo: '\u2018',
            rsquo: '\u2019',
            sbquo: '\u201A',
            ldquo: '\u201C',
            rdquo: '\u201D',
            bdquo: '\u201E',
            dagger: '\u2020',
            Dagger: '\u2021',
            bull: '\u2022',
            hellip: '\u2026',
            permil: '\u2030',
            prime: '\u2032',
            Prime: '\u2033',
            lsaquo: '\u2039',
            rsaquo: '\u203A',
            oline: '\u203E',
            frasl: '\u2044',
            euro: '\u20AC',
            image: '\u2111',
            weierp: '\u2118',
            real: '\u211C',
            trade: '\u2122',
            alefsym: '\u2135',
            larr: '\u2190',
            uarr: '\u2191',
            rarr: '\u2192',
            darr: '\u2193',
            harr: '\u2194',
            crarr: '\u21B5',
            lArr: '\u21D0',
            uArr: '\u21D1',
            rArr: '\u21D2',
            dArr: '\u21D3',
            hArr: '\u21D4',
            forall: '\u2200',
            part: '\u2202',
            exist: '\u2203',
            empty: '\u2205',
            nabla: '\u2207',
            isin: '\u2208',
            notin: '\u2209',
            ni: '\u220B',
            prod: '\u220F',
            sum: '\u2211',
            minus: '\u2212',
            lowast: '\u2217',
            radic: '\u221A',
            prop: '\u221D',
            infin: '\u221E',
            ang: '\u2220',
            and: '\u2227',
            or: '\u2228',
            cap: '\u2229',
            cup: '\u222A',
            'int': '\u222B',
            there4: '\u2234',
            sim: '\u223C',
            cong: '\u2245',
            asymp: '\u2248',
            ne: '\u2260',
            equiv: '\u2261',
            le: '\u2264',
            ge: '\u2265',
            sub: '\u2282',
            sup: '\u2283',
            nsub: '\u2284',
            sube: '\u2286',
            supe: '\u2287',
            oplus: '\u2295',
            otimes: '\u2297',
            perp: '\u22A5',
            sdot: '\u22C5',
            lceil: '\u2308',
            rceil: '\u2309',
            lfloor: '\u230A',
            rfloor: '\u230B',
            lang: '\u2329',
            rang: '\u232A',
            loz: '\u25CA',
            spades: '\u2660',
            clubs: '\u2663',
            hearts: '\u2665',
            diams: '\u2666'
          };
          function getQualifiedXJSName(object) {
            if (object.type === Syntax.XJSIdentifier) {
              return object.name;
            }
            if (object.type === Syntax.XJSNamespacedName) {
              return object.namespace.name + ':' + object.name.name;
            }
            if (object.type === Syntax.XJSMemberExpression) {
              return (getQualifiedXJSName(object.object) + '.' + getQualifiedXJSName(object.property));
            }
          }
          function isXJSIdentifierStart(ch) {
            return (ch !== 92) && isIdentifierStart(ch);
          }
          function isXJSIdentifierPart(ch) {
            return (ch !== 92) && (ch === 45 || isIdentifierPart(ch));
          }
          function scanXJSIdentifier() {
            var ch,
                start,
                value = '';
            start = index;
            while (index < length) {
              ch = source.charCodeAt(index);
              if (!isXJSIdentifierPart(ch)) {
                break;
              }
              value += source[index++];
            }
            return {
              type: Token.XJSIdentifier,
              value: value,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanXJSEntity() {
            var ch,
                str = '',
                start = index,
                count = 0,
                code;
            ch = source[index];
            assert(ch === '&', 'Entity must start with an ampersand');
            index++;
            while (index < length && count++ < 10) {
              ch = source[index++];
              if (ch === ';') {
                break;
              }
              str += ch;
            }
            if (ch === ';') {
              if (str[0] === '#') {
                if (str[1] === 'x') {
                  code = +('0' + str.substr(1));
                } else {
                  code = +str.substr(1).replace(Regex.LeadingZeros, '');
                }
                if (!isNaN(code)) {
                  return String.fromCharCode(code);
                }
              } else if (XHTMLEntities[str]) {
                return XHTMLEntities[str];
              }
            }
            index = start + 1;
            return '&';
          }
          function scanXJSText(stopChars) {
            var ch,
                str = '',
                start;
            start = index;
            while (index < length) {
              ch = source[index];
              if (stopChars.indexOf(ch) !== -1) {
                break;
              }
              if (ch === '&') {
                str += scanXJSEntity();
              } else {
                index++;
                if (ch === '\r' && source[index] === '\n') {
                  str += ch;
                  ch = source[index];
                  index++;
                }
                if (isLineTerminator(ch.charCodeAt(0))) {
                  ++lineNumber;
                  lineStart = index;
                }
                str += ch;
              }
            }
            return {
              type: Token.XJSText,
              value: str,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [start, index]
            };
          }
          function scanXJSStringLiteral() {
            var innerToken,
                quote,
                start;
            quote = source[index];
            assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
            start = index;
            ++index;
            innerToken = scanXJSText([quote]);
            if (quote !== source[index]) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            ++index;
            innerToken.range = [start, index];
            return innerToken;
          }
          function advanceXJSChild() {
            var ch = source.charCodeAt(index);
            if (ch !== 123 && ch !== 60) {
              return scanXJSText(['<', '{']);
            }
            return scanPunctuator();
          }
          function parseXJSIdentifier() {
            var token,
                marker = markerCreate();
            if (lookahead.type !== Token.XJSIdentifier) {
              throwUnexpected(lookahead);
            }
            token = lex();
            return markerApply(marker, delegate.createXJSIdentifier(token.value));
          }
          function parseXJSNamespacedName() {
            var namespace,
                name,
                marker = markerCreate();
            namespace = parseXJSIdentifier();
            expect(':');
            name = parseXJSIdentifier();
            return markerApply(marker, delegate.createXJSNamespacedName(namespace, name));
          }
          function parseXJSMemberExpression() {
            var marker = markerCreate(),
                expr = parseXJSIdentifier();
            while (match('.')) {
              lex();
              expr = markerApply(marker, delegate.createXJSMemberExpression(expr, parseXJSIdentifier()));
            }
            return expr;
          }
          function parseXJSElementName() {
            if (lookahead2().value === ':') {
              return parseXJSNamespacedName();
            }
            if (lookahead2().value === '.') {
              return parseXJSMemberExpression();
            }
            return parseXJSIdentifier();
          }
          function parseXJSAttributeName() {
            if (lookahead2().value === ':') {
              return parseXJSNamespacedName();
            }
            return parseXJSIdentifier();
          }
          function parseXJSAttributeValue() {
            var value,
                marker;
            if (match('{')) {
              value = parseXJSExpressionContainer();
              if (value.expression.type === Syntax.XJSEmptyExpression) {
                throwError(value, 'XJS attributes must only be assigned a non-empty ' + 'expression');
              }
            } else if (match('<')) {
              value = parseXJSElement();
            } else if (lookahead.type === Token.XJSText) {
              marker = markerCreate();
              value = markerApply(marker, delegate.createLiteral(lex()));
            } else {
              throwError({}, Messages.InvalidXJSAttributeValue);
            }
            return value;
          }
          function parseXJSEmptyExpression() {
            var marker = markerCreatePreserveWhitespace();
            while (source.charAt(index) !== '}') {
              index++;
            }
            return markerApply(marker, delegate.createXJSEmptyExpression());
          }
          function parseXJSExpressionContainer() {
            var expression,
                origInXJSChild,
                origInXJSTag,
                marker = markerCreate();
            origInXJSChild = state.inXJSChild;
            origInXJSTag = state.inXJSTag;
            state.inXJSChild = false;
            state.inXJSTag = false;
            expect('{');
            if (match('}')) {
              expression = parseXJSEmptyExpression();
            } else {
              expression = parseExpression();
            }
            state.inXJSChild = origInXJSChild;
            state.inXJSTag = origInXJSTag;
            expect('}');
            return markerApply(marker, delegate.createXJSExpressionContainer(expression));
          }
          function parseXJSSpreadAttribute() {
            var expression,
                origInXJSChild,
                origInXJSTag,
                marker = markerCreate();
            origInXJSChild = state.inXJSChild;
            origInXJSTag = state.inXJSTag;
            state.inXJSChild = false;
            state.inXJSTag = false;
            expect('{');
            expect('...');
            expression = parseAssignmentExpression();
            state.inXJSChild = origInXJSChild;
            state.inXJSTag = origInXJSTag;
            expect('}');
            return markerApply(marker, delegate.createXJSSpreadAttribute(expression));
          }
          function parseXJSAttribute() {
            var name,
                marker;
            if (match('{')) {
              return parseXJSSpreadAttribute();
            }
            marker = markerCreate();
            name = parseXJSAttributeName();
            if (match('=')) {
              lex();
              return markerApply(marker, delegate.createXJSAttribute(name, parseXJSAttributeValue()));
            }
            return markerApply(marker, delegate.createXJSAttribute(name));
          }
          function parseXJSChild() {
            var token,
                marker;
            if (match('{')) {
              token = parseXJSExpressionContainer();
            } else if (lookahead.type === Token.XJSText) {
              marker = markerCreatePreserveWhitespace();
              token = markerApply(marker, delegate.createLiteral(lex()));
            } else {
              token = parseXJSElement();
            }
            return token;
          }
          function parseXJSClosingElement() {
            var name,
                origInXJSChild,
                origInXJSTag,
                marker = markerCreate();
            origInXJSChild = state.inXJSChild;
            origInXJSTag = state.inXJSTag;
            state.inXJSChild = false;
            state.inXJSTag = true;
            expect('<');
            expect('/');
            name = parseXJSElementName();
            state.inXJSChild = origInXJSChild;
            state.inXJSTag = origInXJSTag;
            expect('>');
            return markerApply(marker, delegate.createXJSClosingElement(name));
          }
          function parseXJSOpeningElement() {
            var name,
                attribute,
                attributes = [],
                selfClosing = false,
                origInXJSChild,
                origInXJSTag,
                marker = markerCreate();
            origInXJSChild = state.inXJSChild;
            origInXJSTag = state.inXJSTag;
            state.inXJSChild = false;
            state.inXJSTag = true;
            expect('<');
            name = parseXJSElementName();
            while (index < length && lookahead.value !== '/' && lookahead.value !== '>') {
              attributes.push(parseXJSAttribute());
            }
            state.inXJSTag = origInXJSTag;
            if (lookahead.value === '/') {
              expect('/');
              state.inXJSChild = origInXJSChild;
              expect('>');
              selfClosing = true;
            } else {
              state.inXJSChild = true;
              expect('>');
            }
            return markerApply(marker, delegate.createXJSOpeningElement(name, attributes, selfClosing));
          }
          function parseXJSElement() {
            var openingElement,
                closingElement = null,
                children = [],
                origInXJSChild,
                origInXJSTag,
                marker = markerCreate();
            origInXJSChild = state.inXJSChild;
            origInXJSTag = state.inXJSTag;
            openingElement = parseXJSOpeningElement();
            if (!openingElement.selfClosing) {
              while (index < length) {
                state.inXJSChild = false;
                if (lookahead.value === '<' && lookahead2().value === '/') {
                  break;
                }
                state.inXJSChild = true;
                children.push(parseXJSChild());
              }
              state.inXJSChild = origInXJSChild;
              state.inXJSTag = origInXJSTag;
              closingElement = parseXJSClosingElement();
              if (getQualifiedXJSName(closingElement.name) !== getQualifiedXJSName(openingElement.name)) {
                throwError({}, Messages.ExpectedXJSClosingTag, getQualifiedXJSName(openingElement.name));
              }
            }
            if (!origInXJSChild && match('<')) {
              throwError(lookahead, Messages.AdjacentXJSElements);
            }
            return markerApply(marker, delegate.createXJSElement(openingElement, closingElement, children));
          }
          function parseTypeAlias() {
            var id,
                marker = markerCreate(),
                typeParameters = null,
                right;
            expectContextualKeyword('type');
            id = parseVariableIdentifier();
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            expect('=');
            right = parseType();
            consumeSemicolon();
            return markerApply(marker, delegate.createTypeAlias(id, typeParameters, right));
          }
          function parseInterfaceExtends() {
            var marker = markerCreate(),
                id,
                typeParameters = null;
            id = parseVariableIdentifier();
            if (match('<')) {
              typeParameters = parseTypeParameterInstantiation();
            }
            return markerApply(marker, delegate.createInterfaceExtends(id, typeParameters));
          }
          function parseInterfaceish(marker, allowStatic) {
            var body,
                bodyMarker,
                extended = [],
                id,
                typeParameters = null;
            id = parseVariableIdentifier();
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            if (matchKeyword('extends')) {
              expectKeyword('extends');
              while (index < length) {
                extended.push(parseInterfaceExtends());
                if (!match(',')) {
                  break;
                }
                expect(',');
              }
            }
            bodyMarker = markerCreate();
            body = markerApply(bodyMarker, parseObjectType(allowStatic));
            return markerApply(marker, delegate.createInterface(id, typeParameters, body, extended));
          }
          function parseInterface() {
            var body,
                bodyMarker,
                extended = [],
                id,
                marker = markerCreate(),
                typeParameters = null;
            expectContextualKeyword('interface');
            return parseInterfaceish(marker, false);
          }
          function parseDeclareClass() {
            var marker = markerCreate(),
                ret;
            expectContextualKeyword('declare');
            expectKeyword('class');
            ret = parseInterfaceish(marker, true);
            ret.type = Syntax.DeclareClass;
            return ret;
          }
          function parseDeclareFunction() {
            var id,
                idMarker,
                marker = markerCreate(),
                params,
                returnType,
                rest,
                tmp,
                typeParameters = null,
                value,
                valueMarker;
            expectContextualKeyword('declare');
            expectKeyword('function');
            idMarker = markerCreate();
            id = parseVariableIdentifier();
            valueMarker = markerCreate();
            if (match('<')) {
              typeParameters = parseTypeParameterDeclaration();
            }
            expect('(');
            tmp = parseFunctionTypeParams();
            params = tmp.params;
            rest = tmp.rest;
            expect(')');
            expect(':');
            returnType = parseType();
            value = markerApply(valueMarker, delegate.createFunctionTypeAnnotation(params, returnType, rest, typeParameters));
            id.typeAnnotation = markerApply(valueMarker, delegate.createTypeAnnotation(value));
            markerApply(idMarker, id);
            consumeSemicolon();
            return markerApply(marker, delegate.createDeclareFunction(id));
          }
          function parseDeclareVariable() {
            var id,
                marker = markerCreate();
            expectContextualKeyword('declare');
            expectKeyword('var');
            id = parseTypeAnnotatableIdentifier();
            consumeSemicolon();
            return markerApply(marker, delegate.createDeclareVariable(id));
          }
          function parseDeclareModule() {
            var body = [],
                bodyMarker,
                id,
                idMarker,
                marker = markerCreate(),
                token;
            expectContextualKeyword('declare');
            expectContextualKeyword('module');
            if (lookahead.type === Token.StringLiteral) {
              if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
              }
              idMarker = markerCreate();
              id = markerApply(idMarker, delegate.createLiteral(lex()));
            } else {
              id = parseVariableIdentifier();
            }
            bodyMarker = markerCreate();
            expect('{');
            while (index < length && !match('}')) {
              token = lookahead2();
              switch (token.value) {
                case 'class':
                  body.push(parseDeclareClass());
                  break;
                case 'function':
                  body.push(parseDeclareFunction());
                  break;
                case 'var':
                  body.push(parseDeclareVariable());
                  break;
                default:
                  throwUnexpected(lookahead);
              }
            }
            expect('}');
            return markerApply(marker, delegate.createDeclareModule(id, markerApply(bodyMarker, delegate.createBlockStatement(body))));
          }
          function collectToken() {
            var start,
                loc,
                token,
                range,
                value,
                entry;
            if (!state.inXJSChild) {
              skipComment();
            }
            start = index;
            loc = {start: {
                line: lineNumber,
                column: index - lineStart
              }};
            token = extra.advance();
            loc.end = {
              line: lineNumber,
              column: index - lineStart
            };
            if (token.type !== Token.EOF) {
              range = [token.range[0], token.range[1]];
              value = source.slice(token.range[0], token.range[1]);
              entry = {
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
              };
              if (token.regex) {
                entry.regex = {
                  pattern: token.regex.pattern,
                  flags: token.regex.flags
                };
              }
              extra.tokens.push(entry);
            }
            return token;
          }
          function collectRegex() {
            var pos,
                loc,
                regex,
                token;
            skipComment();
            pos = index;
            loc = {start: {
                line: lineNumber,
                column: index - lineStart
              }};
            regex = extra.scanRegExp();
            loc.end = {
              line: lineNumber,
              column: index - lineStart
            };
            if (!extra.tokenize) {
              if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                  if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                  }
                }
              }
              extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
              });
            }
            return regex;
          }
          function filterTokenLocation() {
            var i,
                entry,
                token,
                tokens = [];
            for (i = 0; i < extra.tokens.length; ++i) {
              entry = extra.tokens[i];
              token = {
                type: entry.type,
                value: entry.value
              };
              if (entry.regex) {
                token.regex = {
                  pattern: entry.regex.pattern,
                  flags: entry.regex.flags
                };
              }
              if (extra.range) {
                token.range = entry.range;
              }
              if (extra.loc) {
                token.loc = entry.loc;
              }
              tokens.push(token);
            }
            extra.tokens = tokens;
          }
          function patch() {
            if (extra.comments) {
              extra.skipComment = skipComment;
              skipComment = scanComment;
            }
            if (typeof extra.tokens !== 'undefined') {
              extra.advance = advance;
              extra.scanRegExp = scanRegExp;
              advance = collectToken;
              scanRegExp = collectRegex;
            }
          }
          function unpatch() {
            if (typeof extra.skipComment === 'function') {
              skipComment = extra.skipComment;
            }
            if (typeof extra.scanRegExp === 'function') {
              advance = extra.advance;
              scanRegExp = extra.scanRegExp;
            }
          }
          function extend(object, properties) {
            var entry,
                result = {};
            for (entry in object) {
              if (object.hasOwnProperty(entry)) {
                result[entry] = object[entry];
              }
            }
            for (entry in properties) {
              if (properties.hasOwnProperty(entry)) {
                result[entry] = properties[entry];
              }
            }
            return result;
          }
          function tokenize(code, options) {
            var toString,
                token,
                tokens;
            toString = String;
            if (typeof code !== 'string' && !(code instanceof String)) {
              code = toString(code);
            }
            delegate = SyntaxTreeDelegate;
            source = code;
            index = 0;
            lineNumber = (source.length > 0) ? 1 : 0;
            lineStart = 0;
            length = source.length;
            lookahead = null;
            state = {
              allowKeyword: true,
              allowIn: true,
              labelSet: {},
              inFunctionBody: false,
              inIteration: false,
              inSwitch: false,
              lastCommentStart: -1
            };
            extra = {};
            options = options || {};
            options.tokens = true;
            extra.tokens = [];
            extra.tokenize = true;
            extra.openParenToken = -1;
            extra.openCurlyToken = -1;
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            if (typeof options.comment === 'boolean' && options.comment) {
              extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
              extra.errors = [];
            }
            if (length > 0) {
              if (typeof source[0] === 'undefined') {
                if (code instanceof String) {
                  source = code.valueOf();
                }
              }
            }
            patch();
            try {
              peek();
              if (lookahead.type === Token.EOF) {
                return extra.tokens;
              }
              token = lex();
              while (lookahead.type !== Token.EOF) {
                try {
                  token = lex();
                } catch (lexError) {
                  token = lookahead;
                  if (extra.errors) {
                    extra.errors.push(lexError);
                    break;
                  } else {
                    throw lexError;
                  }
                }
              }
              filterTokenLocation();
              tokens = extra.tokens;
              if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
              }
              if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
              }
            } catch (e) {
              throw e;
            } finally {
              unpatch();
              extra = {};
            }
            return tokens;
          }
          function parse(code, options) {
            var program,
                toString;
            toString = String;
            if (typeof code !== 'string' && !(code instanceof String)) {
              code = toString(code);
            }
            delegate = SyntaxTreeDelegate;
            source = code;
            index = 0;
            lineNumber = (source.length > 0) ? 1 : 0;
            lineStart = 0;
            length = source.length;
            lookahead = null;
            state = {
              allowKeyword: false,
              allowIn: true,
              labelSet: {},
              parenthesizedCount: 0,
              inFunctionBody: false,
              inIteration: false,
              inSwitch: false,
              inXJSChild: false,
              inXJSTag: false,
              inType: false,
              lastCommentStart: -1,
              yieldAllowed: false,
              awaitAllowed: false
            };
            extra = {};
            if (typeof options !== 'undefined') {
              extra.range = (typeof options.range === 'boolean') && options.range;
              extra.loc = (typeof options.loc === 'boolean') && options.loc;
              extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;
              if (extra.loc && options.source !== null && options.source !== undefined) {
                delegate = extend(delegate, {'postProcess': function(node) {
                    node.loc.source = toString(options.source);
                    return node;
                  }});
              }
              if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
              }
              if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
              }
              if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
              }
              if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
              }
            }
            if (length > 0) {
              if (typeof source[0] === 'undefined') {
                if (code instanceof String) {
                  source = code.valueOf();
                }
              }
            }
            patch();
            try {
              program = parseProgram();
              if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
              }
              if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
              }
              if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
              }
            } catch (e) {
              throw e;
            } finally {
              unpatch();
              extra = {};
            }
            return program;
          }
          exports.version = '8001.1001.0-dev-harmony-fb';
          exports.tokenize = tokenize;
          exports.parse = parse;
          exports.Syntax = (function() {
            var name,
                types = {};
            if (typeof Object.create === 'function') {
              types = Object.create(null);
            }
            for (name in Syntax) {
              if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
              }
            }
            if (typeof Object.freeze === 'function') {
              Object.freeze(types);
            }
            return types;
          }());
        }));
      }, {}],
      10: [function(_dereq_, module, exports) {
        exports.SourceMapGenerator = _dereq_('./source-map/source-map-generator').SourceMapGenerator;
        exports.SourceMapConsumer = _dereq_('./source-map/source-map-consumer').SourceMapConsumer;
        exports.SourceNode = _dereq_('./source-map/source-node').SourceNode;
      }, {
        "./source-map/source-map-consumer": 15,
        "./source-map/source-map-generator": 16,
        "./source-map/source-node": 17
      }],
      11: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var util = _dereq_('./util');
          function ArraySet() {
            this._array = [];
            this._set = {};
          }
          ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
            var set = new ArraySet();
            for (var i = 0,
                len = aArray.length; i < len; i++) {
              set.add(aArray[i], aAllowDuplicates);
            }
            return set;
          };
          ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
            var isDuplicate = this.has(aStr);
            var idx = this._array.length;
            if (!isDuplicate || aAllowDuplicates) {
              this._array.push(aStr);
            }
            if (!isDuplicate) {
              this._set[util.toSetString(aStr)] = idx;
            }
          };
          ArraySet.prototype.has = function ArraySet_has(aStr) {
            return Object.prototype.hasOwnProperty.call(this._set, util.toSetString(aStr));
          };
          ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
            if (this.has(aStr)) {
              return this._set[util.toSetString(aStr)];
            }
            throw new Error('"' + aStr + '" is not in the set.');
          };
          ArraySet.prototype.at = function ArraySet_at(aIdx) {
            if (aIdx >= 0 && aIdx < this._array.length) {
              return this._array[aIdx];
            }
            throw new Error('No element indexed by ' + aIdx);
          };
          ArraySet.prototype.toArray = function ArraySet_toArray() {
            return this._array.slice();
          };
          exports.ArraySet = ArraySet;
        });
      }, {
        "./util": 18,
        "amdefine": 19
      }],
      12: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var base64 = _dereq_('./base64');
          var VLQ_BASE_SHIFT = 5;
          var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
          var VLQ_BASE_MASK = VLQ_BASE - 1;
          var VLQ_CONTINUATION_BIT = VLQ_BASE;
          function toVLQSigned(aValue) {
            return aValue < 0 ? ((-aValue) << 1) + 1 : (aValue << 1) + 0;
          }
          function fromVLQSigned(aValue) {
            var isNegative = (aValue & 1) === 1;
            var shifted = aValue >> 1;
            return isNegative ? -shifted : shifted;
          }
          exports.encode = function base64VLQ_encode(aValue) {
            var encoded = "";
            var digit;
            var vlq = toVLQSigned(aValue);
            do {
              digit = vlq & VLQ_BASE_MASK;
              vlq >>>= VLQ_BASE_SHIFT;
              if (vlq > 0) {
                digit |= VLQ_CONTINUATION_BIT;
              }
              encoded += base64.encode(digit);
            } while (vlq > 0);
            return encoded;
          };
          exports.decode = function base64VLQ_decode(aStr) {
            var i = 0;
            var strLen = aStr.length;
            var result = 0;
            var shift = 0;
            var continuation,
                digit;
            do {
              if (i >= strLen) {
                throw new Error("Expected more digits in base 64 VLQ value.");
              }
              digit = base64.decode(aStr.charAt(i++));
              continuation = !!(digit & VLQ_CONTINUATION_BIT);
              digit &= VLQ_BASE_MASK;
              result = result + (digit << shift);
              shift += VLQ_BASE_SHIFT;
            } while (continuation);
            return {
              value: fromVLQSigned(result),
              rest: aStr.slice(i)
            };
          };
        });
      }, {
        "./base64": 13,
        "amdefine": 19
      }],
      13: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var charToIntMap = {};
          var intToCharMap = {};
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function(ch, index) {
            charToIntMap[ch] = index;
            intToCharMap[index] = ch;
          });
          exports.encode = function base64_encode(aNumber) {
            if (aNumber in intToCharMap) {
              return intToCharMap[aNumber];
            }
            throw new TypeError("Must be between 0 and 63: " + aNumber);
          };
          exports.decode = function base64_decode(aChar) {
            if (aChar in charToIntMap) {
              return charToIntMap[aChar];
            }
            throw new TypeError("Not a valid base 64 digit: " + aChar);
          };
        });
      }, {"amdefine": 19}],
      14: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
            var mid = Math.floor((aHigh - aLow) / 2) + aLow;
            var cmp = aCompare(aNeedle, aHaystack[mid], true);
            if (cmp === 0) {
              return aHaystack[mid];
            } else if (cmp > 0) {
              if (aHigh - mid > 1) {
                return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
              }
              return aHaystack[mid];
            } else {
              if (mid - aLow > 1) {
                return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
              }
              return aLow < 0 ? null : aHaystack[aLow];
            }
          }
          exports.search = function search(aNeedle, aHaystack, aCompare) {
            return aHaystack.length > 0 ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare) : null;
          };
        });
      }, {"amdefine": 19}],
      15: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var util = _dereq_('./util');
          var binarySearch = _dereq_('./binary-search');
          var ArraySet = _dereq_('./array-set').ArraySet;
          var base64VLQ = _dereq_('./base64-vlq');
          function SourceMapConsumer(aSourceMap) {
            var sourceMap = aSourceMap;
            if (typeof aSourceMap === 'string') {
              sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
            }
            var version = util.getArg(sourceMap, 'version');
            var sources = util.getArg(sourceMap, 'sources');
            var names = util.getArg(sourceMap, 'names', []);
            var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
            var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
            var mappings = util.getArg(sourceMap, 'mappings');
            var file = util.getArg(sourceMap, 'file', null);
            if (version != this._version) {
              throw new Error('Unsupported version: ' + version);
            }
            this._names = ArraySet.fromArray(names, true);
            this._sources = ArraySet.fromArray(sources, true);
            this.sourceRoot = sourceRoot;
            this.sourcesContent = sourcesContent;
            this._mappings = mappings;
            this.file = file;
          }
          SourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap) {
            var smc = Object.create(SourceMapConsumer.prototype);
            smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
            smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
            smc.sourceRoot = aSourceMap._sourceRoot;
            smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
            smc.file = aSourceMap._file;
            smc.__generatedMappings = aSourceMap._mappings.slice().sort(util.compareByGeneratedPositions);
            smc.__originalMappings = aSourceMap._mappings.slice().sort(util.compareByOriginalPositions);
            return smc;
          };
          SourceMapConsumer.prototype._version = 3;
          Object.defineProperty(SourceMapConsumer.prototype, 'sources', {get: function() {
              return this._sources.toArray().map(function(s) {
                return this.sourceRoot ? util.join(this.sourceRoot, s) : s;
              }, this);
            }});
          SourceMapConsumer.prototype.__generatedMappings = null;
          Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {get: function() {
              if (!this.__generatedMappings) {
                this.__generatedMappings = [];
                this.__originalMappings = [];
                this._parseMappings(this._mappings, this.sourceRoot);
              }
              return this.__generatedMappings;
            }});
          SourceMapConsumer.prototype.__originalMappings = null;
          Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {get: function() {
              if (!this.__originalMappings) {
                this.__generatedMappings = [];
                this.__originalMappings = [];
                this._parseMappings(this._mappings, this.sourceRoot);
              }
              return this.__originalMappings;
            }});
          SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
            var generatedLine = 1;
            var previousGeneratedColumn = 0;
            var previousOriginalLine = 0;
            var previousOriginalColumn = 0;
            var previousSource = 0;
            var previousName = 0;
            var mappingSeparator = /^[,;]/;
            var str = aStr;
            var mapping;
            var temp;
            while (str.length > 0) {
              if (str.charAt(0) === ';') {
                generatedLine++;
                str = str.slice(1);
                previousGeneratedColumn = 0;
              } else if (str.charAt(0) === ',') {
                str = str.slice(1);
              } else {
                mapping = {};
                mapping.generatedLine = generatedLine;
                temp = base64VLQ.decode(str);
                mapping.generatedColumn = previousGeneratedColumn + temp.value;
                previousGeneratedColumn = mapping.generatedColumn;
                str = temp.rest;
                if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
                  temp = base64VLQ.decode(str);
                  mapping.source = this._sources.at(previousSource + temp.value);
                  previousSource += temp.value;
                  str = temp.rest;
                  if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
                    throw new Error('Found a source, but no line and column');
                  }
                  temp = base64VLQ.decode(str);
                  mapping.originalLine = previousOriginalLine + temp.value;
                  previousOriginalLine = mapping.originalLine;
                  mapping.originalLine += 1;
                  str = temp.rest;
                  if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
                    throw new Error('Found a source and line, but no column');
                  }
                  temp = base64VLQ.decode(str);
                  mapping.originalColumn = previousOriginalColumn + temp.value;
                  previousOriginalColumn = mapping.originalColumn;
                  str = temp.rest;
                  if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
                    temp = base64VLQ.decode(str);
                    mapping.name = this._names.at(previousName + temp.value);
                    previousName += temp.value;
                    str = temp.rest;
                  }
                }
                this.__generatedMappings.push(mapping);
                if (typeof mapping.originalLine === 'number') {
                  this.__originalMappings.push(mapping);
                }
              }
            }
            this.__originalMappings.sort(util.compareByOriginalPositions);
          };
          SourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator) {
            if (aNeedle[aLineName] <= 0) {
              throw new TypeError('Line must be greater than or equal to 1, got ' + aNeedle[aLineName]);
            }
            if (aNeedle[aColumnName] < 0) {
              throw new TypeError('Column must be greater than or equal to 0, got ' + aNeedle[aColumnName]);
            }
            return binarySearch.search(aNeedle, aMappings, aComparator);
          };
          SourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
            var needle = {
              generatedLine: util.getArg(aArgs, 'line'),
              generatedColumn: util.getArg(aArgs, 'column')
            };
            var mapping = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util.compareByGeneratedPositions);
            if (mapping) {
              var source = util.getArg(mapping, 'source', null);
              if (source && this.sourceRoot) {
                source = util.join(this.sourceRoot, source);
              }
              return {
                source: source,
                line: util.getArg(mapping, 'originalLine', null),
                column: util.getArg(mapping, 'originalColumn', null),
                name: util.getArg(mapping, 'name', null)
              };
            }
            return {
              source: null,
              line: null,
              column: null,
              name: null
            };
          };
          SourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource) {
            if (!this.sourcesContent) {
              return null;
            }
            if (this.sourceRoot) {
              aSource = util.relative(this.sourceRoot, aSource);
            }
            if (this._sources.has(aSource)) {
              return this.sourcesContent[this._sources.indexOf(aSource)];
            }
            var url;
            if (this.sourceRoot && (url = util.urlParse(this.sourceRoot))) {
              var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
              if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
                return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
              }
              if ((!url.path || url.path == "/") && this._sources.has("/" + aSource)) {
                return this.sourcesContent[this._sources.indexOf("/" + aSource)];
              }
            }
            throw new Error('"' + aSource + '" is not in the SourceMap.');
          };
          SourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
            var needle = {
              source: util.getArg(aArgs, 'source'),
              originalLine: util.getArg(aArgs, 'line'),
              originalColumn: util.getArg(aArgs, 'column')
            };
            if (this.sourceRoot) {
              needle.source = util.relative(this.sourceRoot, needle.source);
            }
            var mapping = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions);
            if (mapping) {
              return {
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null)
              };
            }
            return {
              line: null,
              column: null
            };
          };
          SourceMapConsumer.GENERATED_ORDER = 1;
          SourceMapConsumer.ORIGINAL_ORDER = 2;
          SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
            var context = aContext || null;
            var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
            var mappings;
            switch (order) {
              case SourceMapConsumer.GENERATED_ORDER:
                mappings = this._generatedMappings;
                break;
              case SourceMapConsumer.ORIGINAL_ORDER:
                mappings = this._originalMappings;
                break;
              default:
                throw new Error("Unknown order of iteration.");
            }
            var sourceRoot = this.sourceRoot;
            mappings.map(function(mapping) {
              var source = mapping.source;
              if (source && sourceRoot) {
                source = util.join(sourceRoot, source);
              }
              return {
                source: source,
                generatedLine: mapping.generatedLine,
                generatedColumn: mapping.generatedColumn,
                originalLine: mapping.originalLine,
                originalColumn: mapping.originalColumn,
                name: mapping.name
              };
            }).forEach(aCallback, context);
          };
          exports.SourceMapConsumer = SourceMapConsumer;
        });
      }, {
        "./array-set": 11,
        "./base64-vlq": 12,
        "./binary-search": 14,
        "./util": 18,
        "amdefine": 19
      }],
      16: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var base64VLQ = _dereq_('./base64-vlq');
          var util = _dereq_('./util');
          var ArraySet = _dereq_('./array-set').ArraySet;
          function SourceMapGenerator(aArgs) {
            this._file = util.getArg(aArgs, 'file');
            this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
            this._sources = new ArraySet();
            this._names = new ArraySet();
            this._mappings = [];
            this._sourcesContents = null;
          }
          SourceMapGenerator.prototype._version = 3;
          SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
            var sourceRoot = aSourceMapConsumer.sourceRoot;
            var generator = new SourceMapGenerator({
              file: aSourceMapConsumer.file,
              sourceRoot: sourceRoot
            });
            aSourceMapConsumer.eachMapping(function(mapping) {
              var newMapping = {generated: {
                  line: mapping.generatedLine,
                  column: mapping.generatedColumn
                }};
              if (mapping.source) {
                newMapping.source = mapping.source;
                if (sourceRoot) {
                  newMapping.source = util.relative(sourceRoot, newMapping.source);
                }
                newMapping.original = {
                  line: mapping.originalLine,
                  column: mapping.originalColumn
                };
                if (mapping.name) {
                  newMapping.name = mapping.name;
                }
              }
              generator.addMapping(newMapping);
            });
            aSourceMapConsumer.sources.forEach(function(sourceFile) {
              var content = aSourceMapConsumer.sourceContentFor(sourceFile);
              if (content) {
                generator.setSourceContent(sourceFile, content);
              }
            });
            return generator;
          };
          SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
            var generated = util.getArg(aArgs, 'generated');
            var original = util.getArg(aArgs, 'original', null);
            var source = util.getArg(aArgs, 'source', null);
            var name = util.getArg(aArgs, 'name', null);
            this._validateMapping(generated, original, source, name);
            if (source && !this._sources.has(source)) {
              this._sources.add(source);
            }
            if (name && !this._names.has(name)) {
              this._names.add(name);
            }
            this._mappings.push({
              generatedLine: generated.line,
              generatedColumn: generated.column,
              originalLine: original != null && original.line,
              originalColumn: original != null && original.column,
              source: source,
              name: name
            });
          };
          SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
            var source = aSourceFile;
            if (this._sourceRoot) {
              source = util.relative(this._sourceRoot, source);
            }
            if (aSourceContent !== null) {
              if (!this._sourcesContents) {
                this._sourcesContents = {};
              }
              this._sourcesContents[util.toSetString(source)] = aSourceContent;
            } else {
              delete this._sourcesContents[util.toSetString(source)];
              if (Object.keys(this._sourcesContents).length === 0) {
                this._sourcesContents = null;
              }
            }
          };
          SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile) {
            if (!aSourceFile) {
              aSourceFile = aSourceMapConsumer.file;
            }
            var sourceRoot = this._sourceRoot;
            if (sourceRoot) {
              aSourceFile = util.relative(sourceRoot, aSourceFile);
            }
            var newSources = new ArraySet();
            var newNames = new ArraySet();
            this._mappings.forEach(function(mapping) {
              if (mapping.source === aSourceFile && mapping.originalLine) {
                var original = aSourceMapConsumer.originalPositionFor({
                  line: mapping.originalLine,
                  column: mapping.originalColumn
                });
                if (original.source !== null) {
                  if (sourceRoot) {
                    mapping.source = util.relative(sourceRoot, original.source);
                  } else {
                    mapping.source = original.source;
                  }
                  mapping.originalLine = original.line;
                  mapping.originalColumn = original.column;
                  if (original.name !== null && mapping.name !== null) {
                    mapping.name = original.name;
                  }
                }
              }
              var source = mapping.source;
              if (source && !newSources.has(source)) {
                newSources.add(source);
              }
              var name = mapping.name;
              if (name && !newNames.has(name)) {
                newNames.add(name);
              }
            }, this);
            this._sources = newSources;
            this._names = newNames;
            aSourceMapConsumer.sources.forEach(function(sourceFile) {
              var content = aSourceMapConsumer.sourceContentFor(sourceFile);
              if (content) {
                if (sourceRoot) {
                  sourceFile = util.relative(sourceRoot, sourceFile);
                }
                this.setSourceContent(sourceFile, content);
              }
            }, this);
          };
          SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
            if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
              return ;
            } else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aOriginal && 'line' in aOriginal && 'column' in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
              return ;
            } else {
              throw new Error('Invalid mapping: ' + JSON.stringify({
                generated: aGenerated,
                source: aSource,
                orginal: aOriginal,
                name: aName
              }));
            }
          };
          SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
            var previousGeneratedColumn = 0;
            var previousGeneratedLine = 1;
            var previousOriginalColumn = 0;
            var previousOriginalLine = 0;
            var previousName = 0;
            var previousSource = 0;
            var result = '';
            var mapping;
            this._mappings.sort(util.compareByGeneratedPositions);
            for (var i = 0,
                len = this._mappings.length; i < len; i++) {
              mapping = this._mappings[i];
              if (mapping.generatedLine !== previousGeneratedLine) {
                previousGeneratedColumn = 0;
                while (mapping.generatedLine !== previousGeneratedLine) {
                  result += ';';
                  previousGeneratedLine++;
                }
              } else {
                if (i > 0) {
                  if (!util.compareByGeneratedPositions(mapping, this._mappings[i - 1])) {
                    continue;
                  }
                  result += ',';
                }
              }
              result += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
              previousGeneratedColumn = mapping.generatedColumn;
              if (mapping.source) {
                result += base64VLQ.encode(this._sources.indexOf(mapping.source) - previousSource);
                previousSource = this._sources.indexOf(mapping.source);
                result += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
                previousOriginalLine = mapping.originalLine - 1;
                result += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
                previousOriginalColumn = mapping.originalColumn;
                if (mapping.name) {
                  result += base64VLQ.encode(this._names.indexOf(mapping.name) - previousName);
                  previousName = this._names.indexOf(mapping.name);
                }
              }
            }
            return result;
          };
          SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
            return aSources.map(function(source) {
              if (!this._sourcesContents) {
                return null;
              }
              if (aSourceRoot) {
                source = util.relative(aSourceRoot, source);
              }
              var key = util.toSetString(source);
              return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
            }, this);
          };
          SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
            var map = {
              version: this._version,
              file: this._file,
              sources: this._sources.toArray(),
              names: this._names.toArray(),
              mappings: this._serializeMappings()
            };
            if (this._sourceRoot) {
              map.sourceRoot = this._sourceRoot;
            }
            if (this._sourcesContents) {
              map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
            }
            return map;
          };
          SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
            return JSON.stringify(this);
          };
          exports.SourceMapGenerator = SourceMapGenerator;
        });
      }, {
        "./array-set": 11,
        "./base64-vlq": 12,
        "./util": 18,
        "amdefine": 19
      }],
      17: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          var SourceMapGenerator = _dereq_('./source-map-generator').SourceMapGenerator;
          var util = _dereq_('./util');
          function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
            this.children = [];
            this.sourceContents = {};
            this.line = aLine === undefined ? null : aLine;
            this.column = aColumn === undefined ? null : aColumn;
            this.source = aSource === undefined ? null : aSource;
            this.name = aName === undefined ? null : aName;
            if (aChunks != null)
              this.add(aChunks);
          }
          SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer) {
            var node = new SourceNode();
            var remainingLines = aGeneratedCode.split('\n');
            var lastGeneratedLine = 1,
                lastGeneratedColumn = 0;
            var lastMapping = null;
            aSourceMapConsumer.eachMapping(function(mapping) {
              if (lastMapping === null) {
                while (lastGeneratedLine < mapping.generatedLine) {
                  node.add(remainingLines.shift() + "\n");
                  lastGeneratedLine++;
                }
                if (lastGeneratedColumn < mapping.generatedColumn) {
                  var nextLine = remainingLines[0];
                  node.add(nextLine.substr(0, mapping.generatedColumn));
                  remainingLines[0] = nextLine.substr(mapping.generatedColumn);
                  lastGeneratedColumn = mapping.generatedColumn;
                }
              } else {
                if (lastGeneratedLine < mapping.generatedLine) {
                  var code = "";
                  do {
                    code += remainingLines.shift() + "\n";
                    lastGeneratedLine++;
                    lastGeneratedColumn = 0;
                  } while (lastGeneratedLine < mapping.generatedLine);
                  if (lastGeneratedColumn < mapping.generatedColumn) {
                    var nextLine = remainingLines[0];
                    code += nextLine.substr(0, mapping.generatedColumn);
                    remainingLines[0] = nextLine.substr(mapping.generatedColumn);
                    lastGeneratedColumn = mapping.generatedColumn;
                  }
                  addMappingWithCode(lastMapping, code);
                } else {
                  var nextLine = remainingLines[0];
                  var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
                  remainingLines[0] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
                  lastGeneratedColumn = mapping.generatedColumn;
                  addMappingWithCode(lastMapping, code);
                }
              }
              lastMapping = mapping;
            }, this);
            addMappingWithCode(lastMapping, remainingLines.join("\n"));
            aSourceMapConsumer.sources.forEach(function(sourceFile) {
              var content = aSourceMapConsumer.sourceContentFor(sourceFile);
              if (content) {
                node.setSourceContent(sourceFile, content);
              }
            });
            return node;
            function addMappingWithCode(mapping, code) {
              if (mapping === null || mapping.source === undefined) {
                node.add(code);
              } else {
                node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, mapping.source, code, mapping.name));
              }
            }
          };
          SourceNode.prototype.add = function SourceNode_add(aChunk) {
            if (Array.isArray(aChunk)) {
              aChunk.forEach(function(chunk) {
                this.add(chunk);
              }, this);
            } else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
              if (aChunk) {
                this.children.push(aChunk);
              }
            } else {
              throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
            }
            return this;
          };
          SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
            if (Array.isArray(aChunk)) {
              for (var i = aChunk.length - 1; i >= 0; i--) {
                this.prepend(aChunk[i]);
              }
            } else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
              this.children.unshift(aChunk);
            } else {
              throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
            }
            return this;
          };
          SourceNode.prototype.walk = function SourceNode_walk(aFn) {
            var chunk;
            for (var i = 0,
                len = this.children.length; i < len; i++) {
              chunk = this.children[i];
              if (chunk instanceof SourceNode) {
                chunk.walk(aFn);
              } else {
                if (chunk !== '') {
                  aFn(chunk, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                  });
                }
              }
            }
          };
          SourceNode.prototype.join = function SourceNode_join(aSep) {
            var newChildren;
            var i;
            var len = this.children.length;
            if (len > 0) {
              newChildren = [];
              for (i = 0; i < len - 1; i++) {
                newChildren.push(this.children[i]);
                newChildren.push(aSep);
              }
              newChildren.push(this.children[i]);
              this.children = newChildren;
            }
            return this;
          };
          SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
            var lastChild = this.children[this.children.length - 1];
            if (lastChild instanceof SourceNode) {
              lastChild.replaceRight(aPattern, aReplacement);
            } else if (typeof lastChild === 'string') {
              this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
            } else {
              this.children.push(''.replace(aPattern, aReplacement));
            }
            return this;
          };
          SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
            this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
          };
          SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
            for (var i = 0,
                len = this.children.length; i < len; i++) {
              if (this.children[i] instanceof SourceNode) {
                this.children[i].walkSourceContents(aFn);
              }
            }
            var sources = Object.keys(this.sourceContents);
            for (var i = 0,
                len = sources.length; i < len; i++) {
              aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
            }
          };
          SourceNode.prototype.toString = function SourceNode_toString() {
            var str = "";
            this.walk(function(chunk) {
              str += chunk;
            });
            return str;
          };
          SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
            var generated = {
              code: "",
              line: 1,
              column: 0
            };
            var map = new SourceMapGenerator(aArgs);
            var sourceMappingActive = false;
            var lastOriginalSource = null;
            var lastOriginalLine = null;
            var lastOriginalColumn = null;
            var lastOriginalName = null;
            this.walk(function(chunk, original) {
              generated.code += chunk;
              if (original.source !== null && original.line !== null && original.column !== null) {
                if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
                  map.addMapping({
                    source: original.source,
                    original: {
                      line: original.line,
                      column: original.column
                    },
                    generated: {
                      line: generated.line,
                      column: generated.column
                    },
                    name: original.name
                  });
                }
                lastOriginalSource = original.source;
                lastOriginalLine = original.line;
                lastOriginalColumn = original.column;
                lastOriginalName = original.name;
                sourceMappingActive = true;
              } else if (sourceMappingActive) {
                map.addMapping({generated: {
                    line: generated.line,
                    column: generated.column
                  }});
                lastOriginalSource = null;
                sourceMappingActive = false;
              }
              chunk.split('').forEach(function(ch) {
                if (ch === '\n') {
                  generated.line++;
                  generated.column = 0;
                } else {
                  generated.column++;
                }
              });
            });
            this.walkSourceContents(function(sourceFile, sourceContent) {
              map.setSourceContent(sourceFile, sourceContent);
            });
            return {
              code: generated.code,
              map: map
            };
          };
          exports.SourceNode = SourceNode;
        });
      }, {
        "./source-map-generator": 16,
        "./util": 18,
        "amdefine": 19
      }],
      18: [function(_dereq_, module, exports) {
        if (typeof define !== 'function') {
          var define = _dereq_('amdefine')(module, _dereq_);
        }
        define(function(_dereq_, exports, module) {
          function getArg(aArgs, aName, aDefaultValue) {
            if (aName in aArgs) {
              return aArgs[aName];
            } else if (arguments.length === 3) {
              return aDefaultValue;
            } else {
              throw new Error('"' + aName + '" is a required argument.');
            }
          }
          exports.getArg = getArg;
          var urlRegexp = /([\w+\-.]+):\/\/((\w+:\w+)@)?([\w.]+)?(:(\d+))?(\S+)?/;
          var dataUrlRegexp = /^data:.+\,.+/;
          function urlParse(aUrl) {
            var match = aUrl.match(urlRegexp);
            if (!match) {
              return null;
            }
            return {
              scheme: match[1],
              auth: match[3],
              host: match[4],
              port: match[6],
              path: match[7]
            };
          }
          exports.urlParse = urlParse;
          function urlGenerate(aParsedUrl) {
            var url = aParsedUrl.scheme + "://";
            if (aParsedUrl.auth) {
              url += aParsedUrl.auth + "@";
            }
            if (aParsedUrl.host) {
              url += aParsedUrl.host;
            }
            if (aParsedUrl.port) {
              url += ":" + aParsedUrl.port;
            }
            if (aParsedUrl.path) {
              url += aParsedUrl.path;
            }
            return url;
          }
          exports.urlGenerate = urlGenerate;
          function join(aRoot, aPath) {
            var url;
            if (aPath.match(urlRegexp) || aPath.match(dataUrlRegexp)) {
              return aPath;
            }
            if (aPath.charAt(0) === '/' && (url = urlParse(aRoot))) {
              url.path = aPath;
              return urlGenerate(url);
            }
            return aRoot.replace(/\/$/, '') + '/' + aPath;
          }
          exports.join = join;
          function toSetString(aStr) {
            return '$' + aStr;
          }
          exports.toSetString = toSetString;
          function fromSetString(aStr) {
            return aStr.substr(1);
          }
          exports.fromSetString = fromSetString;
          function relative(aRoot, aPath) {
            aRoot = aRoot.replace(/\/$/, '');
            var url = urlParse(aRoot);
            if (aPath.charAt(0) == "/" && url && url.path == "/") {
              return aPath.slice(1);
            }
            return aPath.indexOf(aRoot + '/') === 0 ? aPath.substr(aRoot.length + 1) : aPath;
          }
          exports.relative = relative;
          function strcmp(aStr1, aStr2) {
            var s1 = aStr1 || "";
            var s2 = aStr2 || "";
            return (s1 > s2) - (s1 < s2);
          }
          function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
            var cmp;
            cmp = strcmp(mappingA.source, mappingB.source);
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.originalLine - mappingB.originalLine;
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.originalColumn - mappingB.originalColumn;
            if (cmp || onlyCompareOriginal) {
              return cmp;
            }
            cmp = strcmp(mappingA.name, mappingB.name);
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp) {
              return cmp;
            }
            return mappingA.generatedColumn - mappingB.generatedColumn;
          }
          ;
          exports.compareByOriginalPositions = compareByOriginalPositions;
          function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
            var cmp;
            cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp || onlyCompareGenerated) {
              return cmp;
            }
            cmp = strcmp(mappingA.source, mappingB.source);
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.originalLine - mappingB.originalLine;
            if (cmp) {
              return cmp;
            }
            cmp = mappingA.originalColumn - mappingB.originalColumn;
            if (cmp) {
              return cmp;
            }
            return strcmp(mappingA.name, mappingB.name);
          }
          ;
          exports.compareByGeneratedPositions = compareByGeneratedPositions;
        });
      }, {"amdefine": 19}],
      19: [function(_dereq_, module, exports) {
        (function(process, __filename) {
          'use strict';
          function amdefine(module, requireFn) {
            'use strict';
            var defineCache = {},
                loaderCache = {},
                alreadyCalled = false,
                path = _dereq_('path'),
                makeRequire,
                stringRequire;
            function trimDots(ary) {
              var i,
                  part;
              for (i = 0; ary[i]; i += 1) {
                part = ary[i];
                if (part === '.') {
                  ary.splice(i, 1);
                  i -= 1;
                } else if (part === '..') {
                  if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    break;
                  } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                  }
                }
              }
            }
            function normalize(name, baseName) {
              var baseParts;
              if (name && name.charAt(0) === '.') {
                if (baseName) {
                  baseParts = baseName.split('/');
                  baseParts = baseParts.slice(0, baseParts.length - 1);
                  baseParts = baseParts.concat(name.split('/'));
                  trimDots(baseParts);
                  name = baseParts.join('/');
                }
              }
              return name;
            }
            function makeNormalize(relName) {
              return function(name) {
                return normalize(name, relName);
              };
            }
            function makeLoad(id) {
              function load(value) {
                loaderCache[id] = value;
              }
              load.fromText = function(id, text) {
                throw new Error('amdefine does not implement load.fromText');
              };
              return load;
            }
            makeRequire = function(systemRequire, exports, module, relId) {
              function amdRequire(deps, callback) {
                if (typeof deps === 'string') {
                  return stringRequire(systemRequire, exports, module, deps, relId);
                } else {
                  deps = deps.map(function(depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                  });
                  process.nextTick(function() {
                    callback.apply(null, deps);
                  });
                }
              }
              amdRequire.toUrl = function(filePath) {
                if (filePath.indexOf('.') === 0) {
                  return normalize(filePath, path.dirname(module.filename));
                } else {
                  return filePath;
                }
              };
              return amdRequire;
            };
            requireFn = requireFn || function req() {
              return module.require.apply(module, arguments);
            };
            function runFactory(id, deps, factory) {
              var r,
                  e,
                  m,
                  result;
              if (id) {
                e = loaderCache[id] = {};
                m = {
                  id: id,
                  uri: __filename,
                  exports: e
                };
                r = makeRequire(requireFn, e, m, id);
              } else {
                if (alreadyCalled) {
                  throw new Error('amdefine with no module ID cannot be called more than once per file.');
                }
                alreadyCalled = true;
                e = module.exports;
                m = module;
                r = makeRequire(requireFn, e, m, module.id);
              }
              if (deps) {
                deps = deps.map(function(depName) {
                  return r(depName);
                });
              }
              if (typeof factory === 'function') {
                result = factory.apply(m.exports, deps);
              } else {
                result = factory;
              }
              if (result !== undefined) {
                m.exports = result;
                if (id) {
                  loaderCache[id] = m.exports;
                }
              }
            }
            stringRequire = function(systemRequire, exports, module, id, relId) {
              var index = id.indexOf('!'),
                  originalId = id,
                  prefix,
                  plugin;
              if (index === -1) {
                id = normalize(id, relId);
                if (id === 'require') {
                  return makeRequire(systemRequire, exports, module, relId);
                } else if (id === 'exports') {
                  return exports;
                } else if (id === 'module') {
                  return module;
                } else if (loaderCache.hasOwnProperty(id)) {
                  return loaderCache[id];
                } else if (defineCache[id]) {
                  runFactory.apply(null, defineCache[id]);
                  return loaderCache[id];
                } else {
                  if (systemRequire) {
                    return systemRequire(originalId);
                  } else {
                    throw new Error('No module with ID: ' + id);
                  }
                }
              } else {
                prefix = id.substring(0, index);
                id = id.substring(index + 1, id.length);
                plugin = stringRequire(systemRequire, exports, module, prefix, relId);
                if (plugin.normalize) {
                  id = plugin.normalize(id, makeNormalize(relId));
                } else {
                  id = normalize(id, relId);
                }
                if (loaderCache[id]) {
                  return loaderCache[id];
                } else {
                  plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});
                  return loaderCache[id];
                }
              }
            };
            function define(id, deps, factory) {
              if (Array.isArray(id)) {
                factory = deps;
                deps = id;
                id = undefined;
              } else if (typeof id !== 'string') {
                factory = id;
                id = deps = undefined;
              }
              if (deps && !Array.isArray(deps)) {
                factory = deps;
                deps = undefined;
              }
              if (!deps) {
                deps = ['require', 'exports', 'module'];
              }
              if (id) {
                defineCache[id] = [id, deps, factory];
              } else {
                runFactory(id, deps, factory);
              }
            }
            define.require = function(id) {
              if (loaderCache[id]) {
                return loaderCache[id];
              }
              if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
              }
            };
            define.amd = {};
            return define;
          }
          module.exports = amdefine;
        }).call(this, _dereq_('_process'), "/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js");
      }, {
        "_process": 7,
        "path": 6
      }],
      20: [function(_dereq_, module, exports) {
        var docblockRe = /^\s*(\/\*\*(.|\r?\n)*?\*\/)/;
        var ltrimRe = /^\s*/;
        function extract(contents) {
          var match = contents.match(docblockRe);
          if (match) {
            return match[0].replace(ltrimRe, '') || '';
          }
          return '';
        }
        var commentStartRe = /^\/\*\*?/;
        var commentEndRe = /\*+\/$/;
        var wsRe = /[\t ]+/g;
        var stringStartRe = /(\r?\n|^) *\*/g;
        var multilineRe = /(?:^|\r?\n) *(@[^\r\n]*?) *\r?\n *([^@\r\n\s][^@\r\n]+?) *\r?\n/g;
        var propertyRe = /(?:^|\r?\n) *@(\S+) *([^\r\n]*)/g;
        function parse(docblock) {
          docblock = docblock.replace(commentStartRe, '').replace(commentEndRe, '').replace(wsRe, ' ').replace(stringStartRe, '$1');
          var prev = '';
          while (prev != docblock) {
            prev = docblock;
            docblock = docblock.replace(multilineRe, "\n$1 $2\n");
          }
          docblock = docblock.trim();
          var result = [];
          var match;
          while (match = propertyRe.exec(docblock)) {
            result.push([match[1], match[2]]);
          }
          return result;
        }
        function parseAsObject(docblock) {
          var pairs = parse(docblock);
          var result = {};
          for (var i = 0; i < pairs.length; i++) {
            result[pairs[i][0]] = pairs[i][1];
          }
          return result;
        }
        exports.extract = extract;
        exports.parse = parse;
        exports.parseAsObject = parseAsObject;
      }, {}],
      21: [function(_dereq_, module, exports) {
        "use strict";
        var esprima = _dereq_('esprima-fb');
        var utils = _dereq_('./utils');
        var getBoundaryNode = utils.getBoundaryNode;
        var declareIdentInScope = utils.declareIdentInLocalScope;
        var initScopeMetadata = utils.initScopeMetadata;
        var Syntax = esprima.Syntax;
        function _nodeIsClosureScopeBoundary(node, parentNode) {
          if (node.type === Syntax.Program) {
            return true;
          }
          var parentIsFunction = parentNode.type === Syntax.FunctionDeclaration || parentNode.type === Syntax.FunctionExpression || parentNode.type === Syntax.ArrowFunctionExpression;
          return node.type === Syntax.BlockStatement && parentIsFunction;
        }
        function _nodeIsBlockScopeBoundary(node, parentNode) {
          if (node.type === Syntax.Program) {
            return false;
          }
          return node.type === Syntax.BlockStatement && parentNode.type === Syntax.CatchClause;
        }
        function traverse(node, path, state) {
          var parentNode = path[0];
          if (!Array.isArray(node) && state.localScope.parentNode !== parentNode) {
            if (_nodeIsClosureScopeBoundary(node, parentNode)) {
              var scopeIsStrict = state.scopeIsStrict || node.body.length > 0 && node.body[0].type === Syntax.ExpressionStatement && node.body[0].expression.type === Syntax.Literal && node.body[0].expression.value === 'use strict';
              if (node.type === Syntax.Program) {
                state = utils.updateState(state, {scopeIsStrict: scopeIsStrict});
              } else {
                state = utils.updateState(state, {
                  localScope: {
                    parentNode: parentNode,
                    parentScope: state.localScope,
                    identifiers: {},
                    tempVarIndex: 0
                  },
                  scopeIsStrict: scopeIsStrict
                });
                declareIdentInScope('arguments', initScopeMetadata(node), state);
                if (parentNode.params.length > 0) {
                  var param;
                  for (var i = 0; i < parentNode.params.length; i++) {
                    param = parentNode.params[i];
                    if (param.type === Syntax.Identifier) {
                      declareIdentInScope(param.name, initScopeMetadata(parentNode), state);
                    }
                  }
                }
                if (parentNode.type === Syntax.FunctionExpression && parentNode.id) {
                  var metaData = initScopeMetadata(parentNode, path.parentNodeslice, parentNode);
                  declareIdentInScope(parentNode.id.name, metaData, state);
                }
              }
              collectClosureIdentsAndTraverse(node, path, state);
            }
            if (_nodeIsBlockScopeBoundary(node, parentNode)) {
              state = utils.updateState(state, {localScope: {
                  parentNode: parentNode,
                  parentScope: state.localScope,
                  identifiers: {}
                }});
              if (parentNode.type === Syntax.CatchClause) {
                declareIdentInScope(parentNode.param.name, initScopeMetadata(parentNode), state);
              }
              collectBlockIdentsAndTraverse(node, path, state);
            }
          }
          function traverser(node, path, state) {
            node.range && utils.catchup(node.range[0], state);
            traverse(node, path, state);
            node.range && utils.catchup(node.range[1], state);
          }
          utils.analyzeAndTraverse(walker, traverser, node, path, state);
        }
        function collectClosureIdentsAndTraverse(node, path, state) {
          utils.analyzeAndTraverse(visitLocalClosureIdentifiers, collectClosureIdentsAndTraverse, node, path, state);
        }
        function collectBlockIdentsAndTraverse(node, path, state) {
          utils.analyzeAndTraverse(visitLocalBlockIdentifiers, collectBlockIdentsAndTraverse, node, path, state);
        }
        function visitLocalClosureIdentifiers(node, path, state) {
          var metaData;
          switch (node.type) {
            case Syntax.FunctionExpression:
              return false;
            case Syntax.ClassDeclaration:
            case Syntax.ClassExpression:
            case Syntax.FunctionDeclaration:
              if (node.id) {
                metaData = initScopeMetadata(getBoundaryNode(path), path.slice(), node);
                declareIdentInScope(node.id.name, metaData, state);
              }
              return false;
            case Syntax.VariableDeclarator:
              if (path[0].kind === 'var') {
                metaData = initScopeMetadata(getBoundaryNode(path), path.slice(), node);
                declareIdentInScope(node.id.name, metaData, state);
              }
              break;
          }
        }
        function visitLocalBlockIdentifiers(node, path, state) {
          if (node.type === Syntax.CatchClause) {
            return false;
          }
        }
        function walker(node, path, state) {
          var visitors = state.g.visitors;
          for (var i = 0; i < visitors.length; i++) {
            if (visitors[i].test(node, path, state)) {
              return visitors[i](traverse, node, path, state);
            }
          }
        }
        var _astCache = {};
        function transform(visitors, source, options) {
          options = options || {};
          var ast;
          try {
            var cachedAst = _astCache[source];
            ast = cachedAst || (_astCache[source] = esprima.parse(source, {
              comment: true,
              loc: true,
              range: true
            }));
          } catch (e) {
            e.message = 'Parse Error: ' + e.message;
            throw e;
          }
          var state = utils.createState(source, ast, options);
          state.g.visitors = visitors;
          if (options.sourceMap) {
            var SourceMapGenerator = _dereq_('source-map').SourceMapGenerator;
            state.g.sourceMap = new SourceMapGenerator({file: options.filename || 'transformed.js'});
          }
          traverse(ast, [], state);
          utils.catchup(source.length, state);
          var ret = {
            code: state.g.buffer,
            extra: state.g.extra
          };
          if (options.sourceMap) {
            ret.sourceMap = state.g.sourceMap;
            ret.sourceMapFilename = options.filename || 'source.js';
          }
          return ret;
        }
        exports.transform = transform;
        exports.Syntax = Syntax;
      }, {
        "./utils": 22,
        "esprima-fb": 9,
        "source-map": 10
      }],
      22: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var leadingIndentRegexp = /(^|\n)( {2}|\t)/g;
        var nonWhiteRegexp = /(\S)/g;
        function createState(source, rootNode, transformOptions) {
          return {
            localScope: {
              parentNode: rootNode,
              parentScope: null,
              identifiers: {},
              tempVarIndex: 0
            },
            superClass: null,
            mungeNamespace: '',
            methodNode: null,
            methodFuncNode: null,
            className: null,
            scopeIsStrict: null,
            indentBy: 0,
            g: {
              opts: transformOptions,
              position: 0,
              extra: {},
              buffer: '',
              source: source,
              docblock: null,
              tagNamespaceUsed: false,
              isBolt: undefined,
              sourceMap: null,
              sourceMapFilename: 'source.js',
              sourceLine: 1,
              bufferLine: 1,
              originalProgramAST: null,
              sourceColumn: 0,
              bufferColumn: 0
            }
          };
        }
        function updateState(state, update) {
          var ret = Object.create(state);
          Object.keys(update).forEach(function(updatedKey) {
            ret[updatedKey] = update[updatedKey];
          });
          return ret;
        }
        function catchup(end, state, contentTransformer) {
          if (end < state.g.position) {
            return ;
          }
          var source = state.g.source.substring(state.g.position, end);
          var transformed = updateIndent(source, state);
          if (state.g.sourceMap && transformed) {
            state.g.sourceMap.addMapping({
              generated: {
                line: state.g.bufferLine,
                column: state.g.bufferColumn
              },
              original: {
                line: state.g.sourceLine,
                column: state.g.sourceColumn
              },
              source: state.g.sourceMapFilename
            });
            var sourceLines = source.split('\n');
            var transformedLines = transformed.split('\n');
            for (var i = 1; i < sourceLines.length - 1; i++) {
              state.g.sourceMap.addMapping({
                generated: {
                  line: state.g.bufferLine,
                  column: 0
                },
                original: {
                  line: state.g.sourceLine,
                  column: 0
                },
                source: state.g.sourceMapFilename
              });
              state.g.sourceLine++;
              state.g.bufferLine++;
            }
            if (sourceLines.length > 1) {
              state.g.sourceLine++;
              state.g.bufferLine++;
              state.g.sourceColumn = 0;
              state.g.bufferColumn = 0;
            }
            state.g.sourceColumn += sourceLines[sourceLines.length - 1].length;
            state.g.bufferColumn += transformedLines[transformedLines.length - 1].length;
          }
          state.g.buffer += contentTransformer ? contentTransformer(transformed) : transformed;
          state.g.position = end;
        }
        function getNodeSourceText(node, state) {
          return state.g.source.substring(node.range[0], node.range[1]);
        }
        function replaceNonWhite(value) {
          return value.replace(nonWhiteRegexp, ' ');
        }
        function stripNonWhite(value) {
          return value.replace(nonWhiteRegexp, '');
        }
        function catchupWhiteOut(end, state) {
          catchup(end, state, replaceNonWhite);
        }
        function catchupWhiteSpace(end, state) {
          catchup(end, state, stripNonWhite);
        }
        var reNonNewline = /[^\n]/g;
        function stripNonNewline(value) {
          return value.replace(reNonNewline, function() {
            return '';
          });
        }
        function catchupNewlines(end, state) {
          catchup(end, state, stripNonNewline);
        }
        function move(end, state) {
          if (state.g.sourceMap) {
            if (end < state.g.position) {
              state.g.position = 0;
              state.g.sourceLine = 1;
              state.g.sourceColumn = 0;
            }
            var source = state.g.source.substring(state.g.position, end);
            var sourceLines = source.split('\n');
            if (sourceLines.length > 1) {
              state.g.sourceLine += sourceLines.length - 1;
              state.g.sourceColumn = 0;
            }
            state.g.sourceColumn += sourceLines[sourceLines.length - 1].length;
          }
          state.g.position = end;
        }
        function append(str, state) {
          if (state.g.sourceMap && str) {
            state.g.sourceMap.addMapping({
              generated: {
                line: state.g.bufferLine,
                column: state.g.bufferColumn
              },
              original: {
                line: state.g.sourceLine,
                column: state.g.sourceColumn
              },
              source: state.g.sourceMapFilename
            });
            var transformedLines = str.split('\n');
            if (transformedLines.length > 1) {
              state.g.bufferLine += transformedLines.length - 1;
              state.g.bufferColumn = 0;
            }
            state.g.bufferColumn += transformedLines[transformedLines.length - 1].length;
          }
          state.g.buffer += str;
        }
        function updateIndent(str, state) {
          var indentBy = state.indentBy;
          if (indentBy < 0) {
            for (var i = 0; i < -indentBy; i++) {
              str = str.replace(leadingIndentRegexp, '$1');
            }
          } else {
            for (var i = 0; i < indentBy; i++) {
              str = str.replace(leadingIndentRegexp, '$1$2$2');
            }
          }
          return str;
        }
        function indentBefore(start, state) {
          var end = start;
          start = start - 1;
          while (start > 0 && state.g.source[start] != '\n') {
            if (!state.g.source[start].match(/[ \t]/)) {
              end = start;
            }
            start--;
          }
          return state.g.source.substring(start + 1, end);
        }
        function getDocblock(state) {
          if (!state.g.docblock) {
            var docblock = _dereq_('./docblock');
            state.g.docblock = docblock.parseAsObject(docblock.extract(state.g.source));
          }
          return state.g.docblock;
        }
        function identWithinLexicalScope(identName, state, stopBeforeNode) {
          var currScope = state.localScope;
          while (currScope) {
            if (currScope.identifiers[identName] !== undefined) {
              return true;
            }
            if (stopBeforeNode && currScope.parentNode === stopBeforeNode) {
              break;
            }
            currScope = currScope.parentScope;
          }
          return false;
        }
        function identInLocalScope(identName, state) {
          return state.localScope.identifiers[identName] !== undefined;
        }
        function initScopeMetadata(boundaryNode, path, node) {
          return {
            boundaryNode: boundaryNode,
            bindingPath: path,
            bindingNode: node
          };
        }
        function declareIdentInLocalScope(identName, metaData, state) {
          state.localScope.identifiers[identName] = {
            boundaryNode: metaData.boundaryNode,
            path: metaData.bindingPath,
            node: metaData.bindingNode,
            state: Object.create(state)
          };
        }
        function getLexicalBindingMetadata(identName, state) {
          return state.localScope.identifiers[identName];
        }
        function analyzeAndTraverse(analyzer, traverser, node, path, state) {
          if (node.type) {
            if (analyzer(node, path, state) === false) {
              return ;
            }
            path.unshift(node);
          }
          getOrderedChildren(node).forEach(function(child) {
            traverser(child, path, state);
          });
          node.type && path.shift();
        }
        function getOrderedChildren(node) {
          var queue = [];
          for (var key in node) {
            if (node.hasOwnProperty(key)) {
              enqueueNodeWithStartIndex(queue, node[key]);
            }
          }
          queue.sort(function(a, b) {
            return a[1] - b[1];
          });
          return queue.map(function(pair) {
            return pair[0];
          });
        }
        function enqueueNodeWithStartIndex(queue, node) {
          if (typeof node !== 'object' || node === null) {
            return ;
          }
          if (node.range) {
            queue.push([node, node.range[0]]);
          } else if (Array.isArray(node)) {
            for (var ii = 0; ii < node.length; ii++) {
              enqueueNodeWithStartIndex(queue, node[ii]);
            }
          }
        }
        function containsChildOfType(node, type) {
          return containsChildMatching(node, function(node) {
            return node.type === type;
          });
        }
        function containsChildMatching(node, matcher) {
          var foundMatchingChild = false;
          function nodeTypeAnalyzer(node) {
            if (matcher(node) === true) {
              foundMatchingChild = true;
              return false;
            }
          }
          function nodeTypeTraverser(child, path, state) {
            if (!foundMatchingChild) {
              foundMatchingChild = containsChildMatching(child, matcher);
            }
          }
          analyzeAndTraverse(nodeTypeAnalyzer, nodeTypeTraverser, node, []);
          return foundMatchingChild;
        }
        var scopeTypes = {};
        scopeTypes[Syntax.FunctionExpression] = true;
        scopeTypes[Syntax.FunctionDeclaration] = true;
        scopeTypes[Syntax.Program] = true;
        function getBoundaryNode(path) {
          for (var ii = 0; ii < path.length; ++ii) {
            if (scopeTypes[path[ii].type]) {
              return path[ii];
            }
          }
          throw new Error('Expected to find a node with one of the following types in path:\n' + JSON.stringify(Object.keys(scopeTypes)));
        }
        function getTempVar(tempVarIndex) {
          return '$__' + tempVarIndex;
        }
        function getTempVarWithValue(tempVarIndex, tempVarValue) {
          return getTempVar(tempVarIndex) + '=' + tempVarValue;
        }
        exports.append = append;
        exports.catchup = catchup;
        exports.catchupWhiteOut = catchupWhiteOut;
        exports.catchupWhiteSpace = catchupWhiteSpace;
        exports.catchupNewlines = catchupNewlines;
        exports.containsChildMatching = containsChildMatching;
        exports.containsChildOfType = containsChildOfType;
        exports.createState = createState;
        exports.declareIdentInLocalScope = declareIdentInLocalScope;
        exports.getBoundaryNode = getBoundaryNode;
        exports.getDocblock = getDocblock;
        exports.getLexicalBindingMetadata = getLexicalBindingMetadata;
        exports.initScopeMetadata = initScopeMetadata;
        exports.identWithinLexicalScope = identWithinLexicalScope;
        exports.identInLocalScope = identInLocalScope;
        exports.indentBefore = indentBefore;
        exports.move = move;
        exports.scopeTypes = scopeTypes;
        exports.updateIndent = updateIndent;
        exports.updateState = updateState;
        exports.analyzeAndTraverse = analyzeAndTraverse;
        exports.getOrderedChildren = getOrderedChildren;
        exports.getNodeSourceText = getNodeSourceText;
        exports.getTempVar = getTempVar;
        exports.getTempVarWithValue = getTempVarWithValue;
      }, {
        "./docblock": 20,
        "esprima-fb": 9
      }],
      23: [function(_dereq_, module, exports) {
        var restParamVisitors = _dereq_('./es6-rest-param-visitors');
        var destructuringVisitors = _dereq_('./es6-destructuring-visitors');
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        function visitArrowFunction(traverse, node, path, state) {
          var notInExpression = (path[0].type === Syntax.ExpressionStatement);
          if (notInExpression) {
            utils.append('(', state);
          }
          utils.append('function', state);
          renderParams(traverse, node, path, state);
          utils.catchupWhiteSpace(node.body.range[0], state);
          var renderBody = node.body.type == Syntax.BlockStatement ? renderStatementBody : renderExpressionBody;
          path.unshift(node);
          renderBody(traverse, node, path, state);
          path.shift();
          var containsBindingSyntax = utils.containsChildMatching(node.body, function(node) {
            return node.type === Syntax.ThisExpression || (node.type === Syntax.Identifier && node.name === "super");
          });
          if (containsBindingSyntax) {
            utils.append('.bind(this)', state);
          }
          utils.catchupWhiteSpace(node.range[1], state);
          if (notInExpression) {
            utils.append(')', state);
          }
          return false;
        }
        function renderParams(traverse, node, path, state) {
          if (isParensFreeSingleParam(node, state) || !node.params.length) {
            utils.append('(', state);
          }
          if (node.params.length !== 0) {
            path.unshift(node);
            traverse(node.params, path, state);
            path.unshift();
          }
          utils.append(')', state);
        }
        function isParensFreeSingleParam(node, state) {
          return node.params.length === 1 && state.g.source[state.g.position] !== '(';
        }
        function renderExpressionBody(traverse, node, path, state) {
          utils.append('{', state);
          if (node.rest) {
            utils.append(restParamVisitors.renderRestParamSetup(node, state), state);
          }
          destructuringVisitors.renderDestructuredComponents(node, utils.updateState(state, {localScope: {
              parentNode: state.parentNode,
              parentScope: state.parentScope,
              identifiers: state.identifiers,
              tempVarIndex: 0
            }}));
          utils.append('return ', state);
          renderStatementBody(traverse, node, path, state);
          utils.append(';}', state);
        }
        function renderStatementBody(traverse, node, path, state) {
          traverse(node.body, path, state);
          utils.catchup(node.body.range[1], state);
        }
        visitArrowFunction.test = function(node, path, state) {
          return node.type === Syntax.ArrowFunctionExpression;
        };
        exports.visitorList = [visitArrowFunction];
      }, {
        "../src/utils": 22,
        "./es6-destructuring-visitors": 25,
        "./es6-rest-param-visitors": 28,
        "esprima-fb": 9
      }],
      24: [function(_dereq_, module, exports) {
        'use strict';
        var base62 = _dereq_('base62');
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        var reservedWordsHelper = _dereq_('./reserved-words-helper');
        var declareIdentInLocalScope = utils.declareIdentInLocalScope;
        var initScopeMetadata = utils.initScopeMetadata;
        var SUPER_PROTO_IDENT_PREFIX = '____SuperProtoOf';
        var _anonClassUUIDCounter = 0;
        var _mungedSymbolMaps = {};
        function resetSymbols() {
          _anonClassUUIDCounter = 0;
          _mungedSymbolMaps = {};
        }
        function _generateAnonymousClassName(state) {
          var mungeNamespace = state.mungeNamespace || '';
          return '____Class' + mungeNamespace + base62.encode(_anonClassUUIDCounter++);
        }
        function _getMungedName(identName, state) {
          var mungeNamespace = state.mungeNamespace;
          var shouldMinify = state.g.opts.minify;
          if (shouldMinify) {
            if (!_mungedSymbolMaps[mungeNamespace]) {
              _mungedSymbolMaps[mungeNamespace] = {
                symbolMap: {},
                identUUIDCounter: 0
              };
            }
            var symbolMap = _mungedSymbolMaps[mungeNamespace].symbolMap;
            if (!symbolMap[identName]) {
              symbolMap[identName] = base62.encode(_mungedSymbolMaps[mungeNamespace].identUUIDCounter++);
            }
            identName = symbolMap[identName];
          }
          return '$' + mungeNamespace + identName;
        }
        function _getSuperClassInfo(node, state) {
          var ret = {
            name: null,
            expression: null
          };
          if (node.superClass) {
            if (node.superClass.type === Syntax.Identifier) {
              ret.name = node.superClass.name;
            } else {
              ret.name = _generateAnonymousClassName(state);
              ret.expression = state.g.source.substring(node.superClass.range[0], node.superClass.range[1]);
            }
          }
          return ret;
        }
        function _isConstructorMethod(classElement) {
          return classElement.type === Syntax.MethodDefinition && classElement.key.type === Syntax.Identifier && classElement.key.name === 'constructor';
        }
        function _shouldMungeIdentifier(node, state) {
          return (!!state.methodFuncNode && !utils.getDocblock(state).hasOwnProperty('preventMunge') && /^_(?!_)/.test(node.name));
        }
        function visitClassMethod(traverse, node, path, state) {
          if (!state.g.opts.es5 && (node.kind === 'get' || node.kind === 'set')) {
            throw new Error('This transform does not support ' + node.kind + 'ter methods for ES6 ' + 'classes. (line: ' + node.loc.start.line + ', col: ' + node.loc.start.column + ')');
          }
          state = utils.updateState(state, {methodNode: node});
          utils.catchup(node.range[0], state);
          path.unshift(node);
          traverse(node.value, path, state);
          path.shift();
          return false;
        }
        visitClassMethod.test = function(node, path, state) {
          return node.type === Syntax.MethodDefinition;
        };
        function visitClassFunctionExpression(traverse, node, path, state) {
          var methodNode = path[0];
          var isGetter = methodNode.kind === 'get';
          var isSetter = methodNode.kind === 'set';
          state = utils.updateState(state, {methodFuncNode: node});
          if (methodNode.key.name === 'constructor') {
            utils.append('function ' + state.className, state);
          } else {
            var methodAccessor;
            var prototypeOrStatic = methodNode["static"] ? '' : '.prototype';
            var objectAccessor = state.className + prototypeOrStatic;
            if (methodNode.key.type === Syntax.Identifier) {
              methodAccessor = methodNode.key.name;
              if (_shouldMungeIdentifier(methodNode.key, state)) {
                methodAccessor = _getMungedName(methodAccessor, state);
              }
              if (isGetter || isSetter) {
                methodAccessor = JSON.stringify(methodAccessor);
              } else if (reservedWordsHelper.isReservedWord(methodAccessor)) {
                methodAccessor = '[' + JSON.stringify(methodAccessor) + ']';
              } else {
                methodAccessor = '.' + methodAccessor;
              }
            } else if (methodNode.key.type === Syntax.Literal) {
              methodAccessor = JSON.stringify(methodNode.key.value);
              if (!(isGetter || isSetter)) {
                methodAccessor = '[' + methodAccessor + ']';
              }
            }
            if (isSetter || isGetter) {
              utils.append('Object.defineProperty(' + objectAccessor + ',' + methodAccessor + ',' + '{enumerable:true,configurable:true,' + methodNode.kind + ':function', state);
            } else {
              utils.append(objectAccessor + methodAccessor + '=function' + (node.generator ? '*' : ''), state);
            }
          }
          utils.move(methodNode.key.range[1], state);
          utils.append('(', state);
          var params = node.params;
          if (params.length > 0) {
            utils.catchupNewlines(params[0].range[0], state);
            for (var i = 0; i < params.length; i++) {
              utils.catchup(node.params[i].range[0], state);
              path.unshift(node);
              traverse(params[i], path, state);
              path.shift();
            }
          }
          utils.append(')', state);
          utils.catchupWhiteSpace(node.body.range[0], state);
          utils.append('{', state);
          if (!state.scopeIsStrict) {
            utils.append('"use strict";', state);
            state = utils.updateState(state, {scopeIsStrict: true});
          }
          utils.move(node.body.range[0] + '{'.length, state);
          path.unshift(node);
          traverse(node.body, path, state);
          path.shift();
          utils.catchup(node.body.range[1], state);
          if (methodNode.key.name !== 'constructor') {
            if (isGetter || isSetter) {
              utils.append('})', state);
            }
            utils.append(';', state);
          }
          return false;
        }
        visitClassFunctionExpression.test = function(node, path, state) {
          return node.type === Syntax.FunctionExpression && path[0].type === Syntax.MethodDefinition;
        };
        function visitClassMethodParam(traverse, node, path, state) {
          var paramName = node.name;
          if (_shouldMungeIdentifier(node, state)) {
            paramName = _getMungedName(node.name, state);
          }
          utils.append(paramName, state);
          utils.move(node.range[1], state);
        }
        visitClassMethodParam.test = function(node, path, state) {
          if (!path[0] || !path[1]) {
            return ;
          }
          var parentFuncExpr = path[0];
          var parentClassMethod = path[1];
          return parentFuncExpr.type === Syntax.FunctionExpression && parentClassMethod.type === Syntax.MethodDefinition && node.type === Syntax.Identifier;
        };
        function _renderClassBody(traverse, node, path, state) {
          var className = state.className;
          var superClass = state.superClass;
          if (superClass.name) {
            if (superClass.expression !== null) {
              utils.append('var ' + superClass.name + '=' + superClass.expression + ';', state);
            }
            var keyName = superClass.name + '____Key';
            var keyNameDeclarator = '';
            if (!utils.identWithinLexicalScope(keyName, state)) {
              keyNameDeclarator = 'var ';
              declareIdentInLocalScope(keyName, initScopeMetadata(node), state);
            }
            utils.append('for(' + keyNameDeclarator + keyName + ' in ' + superClass.name + '){' + 'if(' + superClass.name + '.hasOwnProperty(' + keyName + ')){' + className + '[' + keyName + ']=' + superClass.name + '[' + keyName + '];' + '}' + '}', state);
            var superProtoIdentStr = SUPER_PROTO_IDENT_PREFIX + superClass.name;
            if (!utils.identWithinLexicalScope(superProtoIdentStr, state)) {
              utils.append('var ' + superProtoIdentStr + '=' + superClass.name + '===null?' + 'null:' + superClass.name + '.prototype;', state);
              declareIdentInLocalScope(superProtoIdentStr, initScopeMetadata(node), state);
            }
            utils.append(className + '.prototype=Object.create(' + superProtoIdentStr + ');', state);
            utils.append(className + '.prototype.constructor=' + className + ';', state);
            utils.append(className + '.__superConstructor__=' + superClass.name + ';', state);
          }
          if (!node.body.body.filter(_isConstructorMethod).pop()) {
            utils.append('function ' + className + '(){', state);
            if (!state.scopeIsStrict) {
              utils.append('"use strict";', state);
            }
            if (superClass.name) {
              utils.append('if(' + superClass.name + '!==null){' + superClass.name + '.apply(this,arguments);}', state);
            }
            utils.append('}', state);
          }
          utils.move(node.body.range[0] + '{'.length, state);
          traverse(node.body, path, state);
          utils.catchupWhiteSpace(node.range[1], state);
        }
        function visitClassDeclaration(traverse, node, path, state) {
          var className = node.id.name;
          var superClass = _getSuperClassInfo(node, state);
          state = utils.updateState(state, {
            mungeNamespace: className,
            className: className,
            superClass: superClass
          });
          _renderClassBody(traverse, node, path, state);
          return false;
        }
        visitClassDeclaration.test = function(node, path, state) {
          return node.type === Syntax.ClassDeclaration;
        };
        function visitClassExpression(traverse, node, path, state) {
          var className = node.id && node.id.name || _generateAnonymousClassName(state);
          var superClass = _getSuperClassInfo(node, state);
          utils.append('(function(){', state);
          state = utils.updateState(state, {
            mungeNamespace: className,
            className: className,
            superClass: superClass
          });
          _renderClassBody(traverse, node, path, state);
          utils.append('return ' + className + ';})()', state);
          return false;
        }
        visitClassExpression.test = function(node, path, state) {
          return node.type === Syntax.ClassExpression;
        };
        function visitPrivateIdentifier(traverse, node, path, state) {
          utils.append(_getMungedName(node.name, state), state);
          utils.move(node.range[1], state);
        }
        visitPrivateIdentifier.test = function(node, path, state) {
          if (node.type === Syntax.Identifier && _shouldMungeIdentifier(node, state)) {
            if (path[0].type === Syntax.MemberExpression && path[0].object !== node && path[0].computed === false) {
              return true;
            }
            if (utils.identWithinLexicalScope(node.name, state, state.methodFuncNode)) {
              return true;
            }
            if (path[0].type === Syntax.Property && path[1].type === Syntax.ObjectExpression) {
              return true;
            }
            if (path[0].type === Syntax.FunctionExpression || path[0].type === Syntax.FunctionDeclaration || path[0].type === Syntax.ArrowFunctionExpression) {
              for (var i = 0; i < path[0].params.length; i++) {
                if (path[0].params[i] === node) {
                  return true;
                }
              }
            }
          }
          return false;
        };
        function visitSuperCallExpression(traverse, node, path, state) {
          var superClassName = state.superClass.name;
          if (node.callee.type === Syntax.Identifier) {
            if (_isConstructorMethod(state.methodNode)) {
              utils.append(superClassName + '.call(', state);
            } else {
              var protoProp = SUPER_PROTO_IDENT_PREFIX + superClassName;
              if (state.methodNode.key.type === Syntax.Identifier) {
                protoProp += '.' + state.methodNode.key.name;
              } else if (state.methodNode.key.type === Syntax.Literal) {
                protoProp += '[' + JSON.stringify(state.methodNode.key.value) + ']';
              }
              utils.append(protoProp + ".call(", state);
            }
            utils.move(node.callee.range[1], state);
          } else if (node.callee.type === Syntax.MemberExpression) {
            utils.append(SUPER_PROTO_IDENT_PREFIX + superClassName, state);
            utils.move(node.callee.object.range[1], state);
            if (node.callee.computed) {
              utils.catchup(node.callee.property.range[1] + ']'.length, state);
            } else {
              utils.append('.' + node.callee.property.name, state);
            }
            utils.append('.call(', state);
            utils.move(node.callee.range[1], state);
          }
          utils.append('this', state);
          if (node.arguments.length > 0) {
            utils.append(',', state);
            utils.catchupWhiteSpace(node.arguments[0].range[0], state);
            traverse(node.arguments, path, state);
          }
          utils.catchupWhiteSpace(node.range[1], state);
          utils.append(')', state);
          return false;
        }
        visitSuperCallExpression.test = function(node, path, state) {
          if (state.superClass && node.type === Syntax.CallExpression) {
            var callee = node.callee;
            if (callee.type === Syntax.Identifier && callee.name === 'super' || callee.type == Syntax.MemberExpression && callee.object.name === 'super') {
              return true;
            }
          }
          return false;
        };
        function visitSuperMemberExpression(traverse, node, path, state) {
          var superClassName = state.superClass.name;
          utils.append(SUPER_PROTO_IDENT_PREFIX + superClassName, state);
          utils.move(node.object.range[1], state);
        }
        visitSuperMemberExpression.test = function(node, path, state) {
          return state.superClass && node.type === Syntax.MemberExpression && node.object.type === Syntax.Identifier && node.object.name === 'super';
        };
        exports.resetSymbols = resetSymbols;
        exports.visitorList = [visitClassDeclaration, visitClassExpression, visitClassFunctionExpression, visitClassMethod, visitClassMethodParam, visitPrivateIdentifier, visitSuperCallExpression, visitSuperMemberExpression];
      }, {
        "../src/utils": 22,
        "./reserved-words-helper": 32,
        "base62": 8,
        "esprima-fb": 9
      }],
      25: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        var reservedWordsHelper = _dereq_('./reserved-words-helper');
        var restParamVisitors = _dereq_('./es6-rest-param-visitors');
        var restPropertyHelpers = _dereq_('./es7-rest-property-helpers');
        function visitStructuredVariable(traverse, node, path, state) {
          utils.append(utils.getTempVar(state.localScope.tempVarIndex) + '=', state);
          utils.catchupWhiteSpace(node.init.range[0], state);
          traverse(node.init, path, state);
          utils.catchup(node.init.range[1], state);
          utils.append(',' + getDestructuredComponents(node.id, state), state);
          state.localScope.tempVarIndex++;
          return false;
        }
        visitStructuredVariable.test = function(node, path, state) {
          return node.type === Syntax.VariableDeclarator && isStructuredPattern(node.id);
        };
        function isStructuredPattern(node) {
          return node.type === Syntax.ObjectPattern || node.type === Syntax.ArrayPattern;
        }
        function getDestructuredComponents(node, state) {
          var tmpIndex = state.localScope.tempVarIndex;
          var components = [];
          var patternItems = getPatternItems(node);
          for (var idx = 0; idx < patternItems.length; idx++) {
            var item = patternItems[idx];
            if (!item) {
              continue;
            }
            if (item.type === Syntax.SpreadElement) {
              components.push(item.argument.name + '=Array.prototype.slice.call(' + utils.getTempVar(tmpIndex) + ',' + idx + ')');
              continue;
            }
            if (item.type === Syntax.SpreadProperty) {
              var restExpression = restPropertyHelpers.renderRestExpression(utils.getTempVar(tmpIndex), patternItems);
              components.push(item.argument.name + '=' + restExpression);
              continue;
            }
            var accessor = getPatternItemAccessor(node, item, tmpIndex, idx);
            var value = getPatternItemValue(node, item);
            if (value.type === Syntax.Identifier) {
              components.push(value.name + '=' + accessor);
            } else {
              components.push(utils.getTempVarWithValue(++state.localScope.tempVarIndex, accessor) + ',' + getDestructuredComponents(value, state));
            }
          }
          return components.join(',');
        }
        function getPatternItems(node) {
          return node.properties || node.elements;
        }
        function getPatternItemAccessor(node, patternItem, tmpIndex, idx) {
          var tmpName = utils.getTempVar(tmpIndex);
          if (node.type === Syntax.ObjectPattern) {
            if (reservedWordsHelper.isReservedWord(patternItem.key.name)) {
              return tmpName + '["' + patternItem.key.name + '"]';
            } else if (patternItem.key.type === Syntax.Literal) {
              return tmpName + '[' + JSON.stringify(patternItem.key.value) + ']';
            } else if (patternItem.key.type === Syntax.Identifier) {
              return tmpName + '.' + patternItem.key.name;
            }
          } else if (node.type === Syntax.ArrayPattern) {
            return tmpName + '[' + idx + ']';
          }
        }
        function getPatternItemValue(node, patternItem) {
          return node.type === Syntax.ObjectPattern ? patternItem.value : patternItem;
        }
        function visitStructuredAssignment(traverse, node, path, state) {
          var exprNode = node.expression;
          utils.append('var ' + utils.getTempVar(state.localScope.tempVarIndex) + '=', state);
          utils.catchupWhiteSpace(exprNode.right.range[0], state);
          traverse(exprNode.right, path, state);
          utils.catchup(exprNode.right.range[1], state);
          utils.append(';' + getDestructuredComponents(exprNode.left, state) + ';', state);
          utils.catchupWhiteSpace(node.range[1], state);
          state.localScope.tempVarIndex++;
          return false;
        }
        visitStructuredAssignment.test = function(node, path, state) {
          return node.type === Syntax.ExpressionStatement && node.expression.type === Syntax.AssignmentExpression && isStructuredPattern(node.expression.left);
        };
        function visitStructuredParameter(traverse, node, path, state) {
          utils.append(utils.getTempVar(getParamIndex(node, path)), state);
          utils.catchupWhiteSpace(node.range[1], state);
          return true;
        }
        function getParamIndex(paramNode, path) {
          var funcNode = path[0];
          var tmpIndex = 0;
          for (var k = 0; k < funcNode.params.length; k++) {
            var param = funcNode.params[k];
            if (param === paramNode) {
              break;
            }
            if (isStructuredPattern(param)) {
              tmpIndex++;
            }
          }
          return tmpIndex;
        }
        visitStructuredParameter.test = function(node, path, state) {
          return isStructuredPattern(node) && isFunctionNode(path[0]);
        };
        function isFunctionNode(node) {
          return (node.type == Syntax.FunctionDeclaration || node.type == Syntax.FunctionExpression || node.type == Syntax.MethodDefinition || node.type == Syntax.ArrowFunctionExpression);
        }
        function visitFunctionBodyForStructuredParameter(traverse, node, path, state) {
          var funcNode = path[0];
          utils.catchup(funcNode.body.range[0] + 1, state);
          renderDestructuredComponents(funcNode, state);
          if (funcNode.rest) {
            utils.append(restParamVisitors.renderRestParamSetup(funcNode, state), state);
          }
          return true;
        }
        function renderDestructuredComponents(funcNode, state) {
          var destructuredComponents = [];
          for (var k = 0; k < funcNode.params.length; k++) {
            var param = funcNode.params[k];
            if (isStructuredPattern(param)) {
              destructuredComponents.push(getDestructuredComponents(param, state));
              state.localScope.tempVarIndex++;
            }
          }
          if (destructuredComponents.length) {
            utils.append('var ' + destructuredComponents.join(',') + ';', state);
          }
        }
        visitFunctionBodyForStructuredParameter.test = function(node, path, state) {
          return node.type === Syntax.BlockStatement && isFunctionNode(path[0]);
        };
        exports.visitorList = [visitStructuredVariable, visitStructuredAssignment, visitStructuredParameter, visitFunctionBodyForStructuredParameter];
        exports.renderDestructuredComponents = renderDestructuredComponents;
      }, {
        "../src/utils": 22,
        "./es6-rest-param-visitors": 28,
        "./es7-rest-property-helpers": 30,
        "./reserved-words-helper": 32,
        "esprima-fb": 9
      }],
      26: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        var reservedWordsHelper = _dereq_('./reserved-words-helper');
        function visitObjectConciseMethod(traverse, node, path, state) {
          var isGenerator = node.value.generator;
          if (isGenerator) {
            utils.catchupWhiteSpace(node.range[0] + 1, state);
          }
          if (node.computed) {
            utils.catchup(node.key.range[1] + 1, state);
          } else if (reservedWordsHelper.isReservedWord(node.key.name)) {
            utils.catchup(node.key.range[0], state);
            utils.append('"', state);
            utils.catchup(node.key.range[1], state);
            utils.append('"', state);
          }
          utils.catchup(node.key.range[1], state);
          utils.append(':function' + (isGenerator ? '*' : ''), state);
          path.unshift(node);
          traverse(node.value, path, state);
          path.shift();
          return false;
        }
        visitObjectConciseMethod.test = function(node, path, state) {
          return node.type === Syntax.Property && node.value.type === Syntax.FunctionExpression && node.method === true;
        };
        exports.visitorList = [visitObjectConciseMethod];
      }, {
        "../src/utils": 22,
        "./reserved-words-helper": 32,
        "esprima-fb": 9
      }],
      27: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        function visitObjectLiteralShortNotation(traverse, node, path, state) {
          utils.catchup(node.key.range[1], state);
          utils.append(':' + node.key.name, state);
          return false;
        }
        visitObjectLiteralShortNotation.test = function(node, path, state) {
          return node.type === Syntax.Property && node.kind === 'init' && node.shorthand === true && path[0].type !== Syntax.ObjectPattern;
        };
        exports.visitorList = [visitObjectLiteralShortNotation];
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      28: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        function _nodeIsFunctionWithRestParam(node) {
          return (node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression || node.type === Syntax.ArrowFunctionExpression) && node.rest;
        }
        function visitFunctionParamsWithRestParam(traverse, node, path, state) {
          if (node.parametricType) {
            utils.catchup(node.parametricType.range[0], state);
            path.unshift(node);
            traverse(node.parametricType, path, state);
            path.shift();
          }
          if (node.params.length) {
            path.unshift(node);
            traverse(node.params, path, state);
            path.shift();
          } else {
            utils.catchup(node.rest.range[0] - 3, state);
          }
          utils.catchupWhiteSpace(node.rest.range[1], state);
          path.unshift(node);
          traverse(node.body, path, state);
          path.shift();
          return false;
        }
        visitFunctionParamsWithRestParam.test = function(node, path, state) {
          return _nodeIsFunctionWithRestParam(node);
        };
        function renderRestParamSetup(functionNode, state) {
          var idx = state.localScope.tempVarIndex++;
          var len = state.localScope.tempVarIndex++;
          return 'for (var ' + functionNode.rest.name + '=[],' + utils.getTempVarWithValue(idx, functionNode.params.length) + ',' + utils.getTempVarWithValue(len, 'arguments.length') + ';' + utils.getTempVar(idx) + '<' + utils.getTempVar(len) + ';' + utils.getTempVar(idx) + '++) ' + functionNode.rest.name + '.push(arguments[' + utils.getTempVar(idx) + ']);';
        }
        function visitFunctionBodyWithRestParam(traverse, node, path, state) {
          utils.catchup(node.range[0] + 1, state);
          var parentNode = path[0];
          utils.append(renderRestParamSetup(parentNode, state), state);
          return true;
        }
        visitFunctionBodyWithRestParam.test = function(node, path, state) {
          return node.type === Syntax.BlockStatement && _nodeIsFunctionWithRestParam(path[0]);
        };
        exports.renderRestParamSetup = renderRestParamSetup;
        exports.visitorList = [visitFunctionParamsWithRestParam, visitFunctionBodyWithRestParam];
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      29: [function(_dereq_, module, exports) {
        'use strict';
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        function visitTemplateLiteral(traverse, node, path, state) {
          var templateElements = node.quasis;
          utils.append('(', state);
          for (var ii = 0; ii < templateElements.length; ii++) {
            var templateElement = templateElements[ii];
            if (templateElement.value.raw !== '') {
              utils.append(getCookedValue(templateElement), state);
              if (!templateElement.tail) {
                utils.append(' + ', state);
              }
              utils.move(templateElement.range[0], state);
              utils.catchupNewlines(templateElement.range[1], state);
            } else {
              if (ii > 0 && !templateElement.tail) {
                utils.append(' + ', state);
              }
            }
            utils.move(templateElement.range[1], state);
            if (!templateElement.tail) {
              var substitution = node.expressions[ii];
              if (substitution.type === Syntax.Identifier || substitution.type === Syntax.MemberExpression || substitution.type === Syntax.CallExpression) {
                utils.catchup(substitution.range[1], state);
              } else {
                utils.append('(', state);
                traverse(substitution, path, state);
                utils.catchup(substitution.range[1], state);
                utils.append(')', state);
              }
              if (templateElements[ii + 1].value.cooked !== '') {
                utils.append(' + ', state);
              }
            }
          }
          utils.move(node.range[1], state);
          utils.append(')', state);
          return false;
        }
        visitTemplateLiteral.test = function(node, path, state) {
          return node.type === Syntax.TemplateLiteral;
        };
        function visitTaggedTemplateExpression(traverse, node, path, state) {
          var template = node.quasi;
          var numQuasis = template.quasis.length;
          utils.move(node.tag.range[0], state);
          traverse(node.tag, path, state);
          utils.catchup(node.tag.range[1], state);
          utils.append('(function() { var siteObj = [', state);
          for (var ii = 0; ii < numQuasis; ii++) {
            utils.append(getCookedValue(template.quasis[ii]), state);
            if (ii !== numQuasis - 1) {
              utils.append(', ', state);
            }
          }
          utils.append(']; siteObj.raw = [', state);
          for (ii = 0; ii < numQuasis; ii++) {
            utils.append(getRawValue(template.quasis[ii]), state);
            if (ii !== numQuasis - 1) {
              utils.append(', ', state);
            }
          }
          utils.append(']; Object.freeze(siteObj.raw); Object.freeze(siteObj); return siteObj; }()', state);
          if (numQuasis > 1) {
            for (ii = 0; ii < template.expressions.length; ii++) {
              var expression = template.expressions[ii];
              utils.append(', ', state);
              utils.move(template.quasis[ii].range[0], state);
              utils.catchupNewlines(template.quasis[ii].range[1], state);
              utils.move(expression.range[0], state);
              traverse(expression, path, state);
              utils.catchup(expression.range[1], state);
            }
          }
          utils.catchupNewlines(node.range[1], state);
          utils.append(')', state);
          return false;
        }
        visitTaggedTemplateExpression.test = function(node, path, state) {
          return node.type === Syntax.TaggedTemplateExpression;
        };
        function getCookedValue(templateElement) {
          return JSON.stringify(templateElement.value.cooked);
        }
        function getRawValue(templateElement) {
          return JSON.stringify(templateElement.value.raw);
        }
        exports.visitorList = [visitTemplateLiteral, visitTaggedTemplateExpression];
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      30: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        var restFunction = '(function(source, exclusion) {' + 'var rest = {};' + 'var hasOwn = Object.prototype.hasOwnProperty;' + 'if (source == null) {' + 'throw new TypeError();' + '}' + 'for (var key in source) {' + 'if (hasOwn.call(source, key) && !hasOwn.call(exclusion, key)) {' + 'rest[key] = source[key];' + '}' + '}' + 'return rest;' + '})';
        function getPropertyNames(properties) {
          var names = [];
          for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            if (property.type === Syntax.SpreadProperty) {
              continue;
            }
            if (property.type === Syntax.Identifier) {
              names.push(property.name);
            } else {
              names.push(property.key.name);
            }
          }
          return names;
        }
        function getRestFunctionCall(source, exclusion) {
          return restFunction + '(' + source + ',' + exclusion + ')';
        }
        function getSimpleShallowCopy(accessorExpression) {
          return getRestFunctionCall(accessorExpression, '{}');
        }
        function renderRestExpression(accessorExpression, excludedProperties) {
          var excludedNames = getPropertyNames(excludedProperties);
          if (!excludedNames.length) {
            return getSimpleShallowCopy(accessorExpression);
          }
          return getRestFunctionCall(accessorExpression, '{' + excludedNames.join(':1,') + ':1}');
        }
        exports.renderRestExpression = renderRestExpression;
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      31: [function(_dereq_, module, exports) {
        var Syntax = _dereq_('esprima-fb').Syntax;
        var utils = _dereq_('../src/utils');
        function visitObjectLiteralSpread(traverse, node, path, state) {
          utils.catchup(node.range[0], state);
          utils.append('Object.assign({', state);
          utils.move(node.range[0] + 1, state);
          var previousWasSpread = false;
          for (var i = 0; i < node.properties.length; i++) {
            var property = node.properties[i];
            if (property.type === Syntax.SpreadProperty) {
              if (!previousWasSpread) {
                utils.append('}', state);
              }
              if (i === 0) {
                utils.append(',', state);
              }
              utils.catchup(property.range[0], state);
              utils.move(property.range[0] + 3, state);
              traverse(property.argument, path, state);
              utils.catchup(property.range[1], state);
              previousWasSpread = true;
            } else {
              utils.catchup(property.range[0], state);
              if (previousWasSpread) {
                utils.append('{', state);
              }
              traverse(property, path, state);
              utils.catchup(property.range[1], state);
              previousWasSpread = false;
            }
          }
          utils.catchupWhiteSpace(node.range[1] - 1, state);
          utils.move(node.range[1], state);
          if (!previousWasSpread) {
            utils.append('}', state);
          }
          utils.append(')', state);
          return false;
        }
        visitObjectLiteralSpread.test = function(node, path, state) {
          if (node.type !== Syntax.ObjectExpression) {
            return false;
          }
          var hasAtLeastOneSpreadProperty = false;
          for (var i = 0; i < node.properties.length; i++) {
            var property = node.properties[i];
            if (property.type === Syntax.SpreadProperty) {
              hasAtLeastOneSpreadProperty = true;
            } else if (property.kind !== 'init') {
              return false;
            }
          }
          return hasAtLeastOneSpreadProperty;
        };
        exports.visitorList = [visitObjectLiteralSpread];
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      32: [function(_dereq_, module, exports) {
        var KEYWORDS = ['break', 'do', 'in', 'typeof', 'case', 'else', 'instanceof', 'var', 'catch', 'export', 'new', 'void', 'class', 'extends', 'return', 'while', 'const', 'finally', 'super', 'with', 'continue', 'for', 'switch', 'yield', 'debugger', 'function', 'this', 'default', 'if', 'throw', 'delete', 'import', 'try'];
        var FUTURE_RESERVED_WORDS = ['enum', 'await', 'implements', 'package', 'protected', 'static', 'interface', 'private', 'public'];
        var LITERALS = ['null', 'true', 'false'];
        var RESERVED_WORDS = [].concat(KEYWORDS, FUTURE_RESERVED_WORDS, LITERALS);
        var reservedWordsMap = Object.create(null);
        RESERVED_WORDS.forEach(function(k) {
          reservedWordsMap[k] = true;
        });
        exports.isReservedWord = function(word) {
          return !!reservedWordsMap[word];
        };
      }, {}],
      33: [function(_dereq_, module, exports) {
        var esprima = _dereq_('esprima-fb');
        var utils = _dereq_('../src/utils');
        var Syntax = esprima.Syntax;
        function _isFunctionNode(node) {
          return node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression || node.type === Syntax.ArrowFunctionExpression;
        }
        function visitClassProperty(traverse, node, path, state) {
          utils.catchup(node.range[0], state);
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitClassProperty.test = function(node, path, state) {
          return node.type === Syntax.ClassProperty;
        };
        function visitTypeAlias(traverse, node, path, state) {
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitTypeAlias.test = function(node, path, state) {
          return node.type === Syntax.TypeAlias;
        };
        function visitInterfaceDeclaration(traverse, node, path, state) {
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitInterfaceDeclaration.test = function(node, path, state) {
          return node.type === Syntax.InterfaceDeclaration;
        };
        function visitDeclare(traverse, node, path, state) {
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitDeclare.test = function(node, path, state) {
          switch (node.type) {
            case Syntax.DeclareVariable:
            case Syntax.DeclareFunction:
            case Syntax.DeclareClass:
            case Syntax.DeclareModule:
              return true;
          }
          return false;
        };
        function visitFunctionParametricAnnotation(traverse, node, path, state) {
          utils.catchup(node.range[0], state);
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitFunctionParametricAnnotation.test = function(node, path, state) {
          return node.type === Syntax.TypeParameterDeclaration && path[0] && _isFunctionNode(path[0]) && node === path[0].typeParameters;
        };
        function visitFunctionReturnAnnotation(traverse, node, path, state) {
          utils.catchup(node.range[0], state);
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitFunctionReturnAnnotation.test = function(node, path, state) {
          return path[0] && _isFunctionNode(path[0]) && node === path[0].returnType;
        };
        function visitOptionalFunctionParameterAnnotation(traverse, node, path, state) {
          utils.catchup(node.range[0] + node.name.length, state);
          utils.catchupWhiteOut(node.range[1], state);
          return false;
        }
        visitOptionalFunctionParameterAnnotation.test = function(node, path, state) {
          return node.type === Syntax.Identifier && node.optional && path[0] && _isFunctionNode(path[0]);
        };
        function visitTypeAnnotatedIdentifier(traverse, node, path, state) {
          utils.catchup(node.typeAnnotation.range[0], state);
          utils.catchupWhiteOut(node.typeAnnotation.range[1], state);
          return false;
        }
        visitTypeAnnotatedIdentifier.test = function(node, path, state) {
          return node.type === Syntax.Identifier && node.typeAnnotation;
        };
        function visitTypeAnnotatedObjectOrArrayPattern(traverse, node, path, state) {
          utils.catchup(node.typeAnnotation.range[0], state);
          utils.catchupWhiteOut(node.typeAnnotation.range[1], state);
          return false;
        }
        visitTypeAnnotatedObjectOrArrayPattern.test = function(node, path, state) {
          var rightType = node.type === Syntax.ObjectPattern || node.type === Syntax.ArrayPattern;
          return rightType && node.typeAnnotation;
        };
        function visitMethod(traverse, node, path, state) {
          path.unshift(node);
          traverse(node.key, path, state);
          path.unshift(node.value);
          traverse(node.value.params, path, state);
          node.value.rest && traverse(node.value.rest, path, state);
          node.value.returnType && traverse(node.value.returnType, path, state);
          traverse(node.value.body, path, state);
          path.shift();
          path.shift();
          return false;
        }
        visitMethod.test = function(node, path, state) {
          return (node.type === "Property" && (node.method || node.kind === "set" || node.kind === "get")) || (node.type === "MethodDefinition");
        };
        exports.visitorList = [visitClassProperty, visitDeclare, visitInterfaceDeclaration, visitFunctionParametricAnnotation, visitFunctionReturnAnnotation, visitMethod, visitOptionalFunctionParameterAnnotation, visitTypeAlias, visitTypeAnnotatedIdentifier, visitTypeAnnotatedObjectOrArrayPattern];
      }, {
        "../src/utils": 22,
        "esprima-fb": 9
      }],
      34: [function(_dereq_, module, exports) {
        "use strict";
        var Syntax = _dereq_('jstransform').Syntax;
        var utils = _dereq_('jstransform/src/utils');
        var FALLBACK_TAGS = _dereq_('./xjs').knownTags;
        var renderXJSExpressionContainer = _dereq_('./xjs').renderXJSExpressionContainer;
        var renderXJSLiteral = _dereq_('./xjs').renderXJSLiteral;
        var quoteAttrName = _dereq_('./xjs').quoteAttrName;
        var trimLeft = _dereq_('./xjs').trimLeft;
        var reNonWhiteParen = /([^\s\(\)])/g;
        function stripNonWhiteParen(value) {
          return value.replace(reNonWhiteParen, '');
        }
        var tagConvention = /^[a-z]|\-/;
        function isTagName(name) {
          return tagConvention.test(name);
        }
        function visitReactTag(traverse, object, path, state) {
          var openingElement = object.openingElement;
          var nameObject = openingElement.name;
          var attributesObject = openingElement.attributes;
          utils.catchup(openingElement.range[0], state, trimLeft);
          if (nameObject.type === Syntax.XJSNamespacedName && nameObject.namespace) {
            throw new Error('Namespace tags are not supported. ReactJSX is not XML.');
          }
          utils.append('React.createElement(', state);
          if (nameObject.type === Syntax.XJSIdentifier && isTagName(nameObject.name)) {
            if (!FALLBACK_TAGS.hasOwnProperty(nameObject.name)) {
              throw new Error('Lower case component names (' + nameObject.name + ') are no longer ' + 'supported in JSX: See http://fb.me/react-jsx-lower-case');
            }
            utils.append('"' + nameObject.name + '"', state);
            utils.move(nameObject.range[1], state);
          } else {
            utils.move(nameObject.range[0], state);
            utils.catchup(nameObject.range[1], state);
          }
          utils.append(', ', state);
          var hasAttributes = attributesObject.length;
          var hasAtLeastOneSpreadProperty = attributesObject.some(function(attr) {
            return attr.type === Syntax.XJSSpreadAttribute;
          });
          if (hasAtLeastOneSpreadProperty) {
            utils.append('React.__spread({', state);
          } else if (hasAttributes) {
            utils.append('{', state);
          } else {
            utils.append('null', state);
          }
          var previousWasSpread = false;
          attributesObject.forEach(function(attr, index) {
            var isLast = index === attributesObject.length - 1;
            if (attr.type === Syntax.XJSSpreadAttribute) {
              if (!previousWasSpread) {
                utils.append('}, ', state);
              }
              utils.catchup(attr.range[0], state, stripNonWhiteParen);
              utils.move(attr.range[0] + 1, state);
              utils.catchup(attr.argument.range[0], state, stripNonWhiteParen);
              traverse(attr.argument, path, state);
              utils.catchup(attr.argument.range[1], state);
              utils.catchup(attr.range[1] - 1, state, stripNonWhiteParen);
              if (!isLast) {
                utils.append(', ', state);
              }
              utils.move(attr.range[1], state);
              previousWasSpread = true;
              return ;
            }
            if (!isLast) {
              isLast = attributesObject[index + 1].type === Syntax.XJSSpreadAttribute;
            }
            if (attr.name.namespace) {
              throw new Error('Namespace attributes are not supported. ReactJSX is not XML.');
            }
            var name = attr.name.name;
            utils.catchup(attr.range[0], state, trimLeft);
            if (previousWasSpread) {
              utils.append('{', state);
            }
            utils.append(quoteAttrName(name), state);
            utils.append(': ', state);
            if (!attr.value) {
              state.g.buffer += 'true';
              state.g.position = attr.name.range[1];
              if (!isLast) {
                utils.append(', ', state);
              }
            } else {
              utils.move(attr.name.range[1], state);
              utils.catchupNewlines(attr.value.range[0], state);
              if (attr.value.type === Syntax.Literal) {
                renderXJSLiteral(attr.value, isLast, state);
              } else {
                renderXJSExpressionContainer(traverse, attr.value, isLast, path, state);
              }
            }
            utils.catchup(attr.range[1], state, trimLeft);
            previousWasSpread = false;
          });
          if (!openingElement.selfClosing) {
            utils.catchup(openingElement.range[1] - 1, state, trimLeft);
            utils.move(openingElement.range[1], state);
          }
          if (hasAttributes && !previousWasSpread) {
            utils.append('}', state);
          }
          if (hasAtLeastOneSpreadProperty) {
            utils.append(')', state);
          }
          var childrenToRender = object.children.filter(function(child) {
            return !(child.type === Syntax.Literal && typeof child.value === 'string' && child.value.match(/^[ \t]*[\r\n][ \t\r\n]*$/));
          });
          if (childrenToRender.length > 0) {
            var lastRenderableIndex;
            childrenToRender.forEach(function(child, index) {
              if (child.type !== Syntax.XJSExpressionContainer || child.expression.type !== Syntax.XJSEmptyExpression) {
                lastRenderableIndex = index;
              }
            });
            if (lastRenderableIndex !== undefined) {
              utils.append(', ', state);
            }
            childrenToRender.forEach(function(child, index) {
              utils.catchup(child.range[0], state, trimLeft);
              var isLast = index >= lastRenderableIndex;
              if (child.type === Syntax.Literal) {
                renderXJSLiteral(child, isLast, state);
              } else if (child.type === Syntax.XJSExpressionContainer) {
                renderXJSExpressionContainer(traverse, child, isLast, path, state);
              } else {
                traverse(child, path, state);
                if (!isLast) {
                  utils.append(', ', state);
                }
              }
              utils.catchup(child.range[1], state, trimLeft);
            });
          }
          if (openingElement.selfClosing) {
            utils.catchup(openingElement.range[1] - 2, state, trimLeft);
            utils.move(openingElement.range[1], state);
          } else {
            utils.catchup(object.closingElement.range[0], state, trimLeft);
            utils.move(object.closingElement.range[1], state);
          }
          utils.append(')', state);
          return false;
        }
        visitReactTag.test = function(object, path, state) {
          return object.type === Syntax.XJSElement;
        };
        exports.visitorList = [visitReactTag];
      }, {
        "./xjs": 36,
        "jstransform": 21,
        "jstransform/src/utils": 22
      }],
      35: [function(_dereq_, module, exports) {
        "use strict";
        var Syntax = _dereq_('jstransform').Syntax;
        var utils = _dereq_('jstransform/src/utils');
        function addDisplayName(displayName, object, state) {
          if (object && object.type === Syntax.CallExpression && object.callee.type === Syntax.MemberExpression && object.callee.object.type === Syntax.Identifier && object.callee.object.name === 'React' && object.callee.property.type === Syntax.Identifier && object.callee.property.name === 'createClass' && object['arguments'].length === 1 && object['arguments'][0].type === Syntax.ObjectExpression) {
            var properties = object['arguments'][0].properties;
            var safe = properties.every(function(property) {
              var value = property.key.type === Syntax.Identifier ? property.key.name : property.key.value;
              return value !== 'displayName';
            });
            if (safe) {
              utils.catchup(object['arguments'][0].range[0] + 1, state);
              utils.append('displayName: "' + displayName + '",', state);
            }
          }
        }
        function visitReactDisplayName(traverse, object, path, state) {
          var left,
              right;
          if (object.type === Syntax.AssignmentExpression) {
            left = object.left;
            right = object.right;
          } else if (object.type === Syntax.Property) {
            left = object.key;
            right = object.value;
          } else if (object.type === Syntax.VariableDeclarator) {
            left = object.id;
            right = object.init;
          }
          if (left && left.type === Syntax.MemberExpression) {
            left = left.property;
          }
          if (left && left.type === Syntax.Identifier) {
            addDisplayName(left.name, right, state);
          }
        }
        visitReactDisplayName.test = function(object, path, state) {
          return (object.type === Syntax.AssignmentExpression || object.type === Syntax.Property || object.type === Syntax.VariableDeclarator);
        };
        exports.visitorList = [visitReactDisplayName];
      }, {
        "jstransform": 21,
        "jstransform/src/utils": 22
      }],
      36: [function(_dereq_, module, exports) {
        "use strict";
        var Syntax = _dereq_('jstransform').Syntax;
        var utils = _dereq_('jstransform/src/utils');
        var knownTags = {
          a: true,
          abbr: true,
          address: true,
          applet: true,
          area: true,
          article: true,
          aside: true,
          audio: true,
          b: true,
          base: true,
          bdi: true,
          bdo: true,
          big: true,
          blockquote: true,
          body: true,
          br: true,
          button: true,
          canvas: true,
          caption: true,
          circle: true,
          cite: true,
          code: true,
          col: true,
          colgroup: true,
          command: true,
          data: true,
          datalist: true,
          dd: true,
          defs: true,
          del: true,
          details: true,
          dfn: true,
          dialog: true,
          div: true,
          dl: true,
          dt: true,
          ellipse: true,
          em: true,
          embed: true,
          fieldset: true,
          figcaption: true,
          figure: true,
          footer: true,
          form: true,
          g: true,
          h1: true,
          h2: true,
          h3: true,
          h4: true,
          h5: true,
          h6: true,
          head: true,
          header: true,
          hgroup: true,
          hr: true,
          html: true,
          i: true,
          iframe: true,
          img: true,
          input: true,
          ins: true,
          kbd: true,
          keygen: true,
          label: true,
          legend: true,
          li: true,
          line: true,
          linearGradient: true,
          link: true,
          main: true,
          map: true,
          mark: true,
          marquee: true,
          mask: false,
          menu: true,
          menuitem: true,
          meta: true,
          meter: true,
          nav: true,
          noscript: true,
          object: true,
          ol: true,
          optgroup: true,
          option: true,
          output: true,
          p: true,
          param: true,
          path: true,
          pattern: false,
          picture: true,
          polygon: true,
          polyline: true,
          pre: true,
          progress: true,
          q: true,
          radialGradient: true,
          rect: true,
          rp: true,
          rt: true,
          ruby: true,
          s: true,
          samp: true,
          script: true,
          section: true,
          select: true,
          small: true,
          source: true,
          span: true,
          stop: true,
          strong: true,
          style: true,
          sub: true,
          summary: true,
          sup: true,
          svg: true,
          table: true,
          tbody: true,
          td: true,
          text: true,
          textarea: true,
          tfoot: true,
          th: true,
          thead: true,
          time: true,
          title: true,
          tr: true,
          track: true,
          tspan: true,
          u: true,
          ul: true,
          'var': true,
          video: true,
          wbr: true
        };
        function renderXJSLiteral(object, isLast, state, start, end) {
          var lines = object.value.split(/\r\n|\n|\r/);
          if (start) {
            utils.append(start, state);
          }
          var lastNonEmptyLine = 0;
          lines.forEach(function(line, index) {
            if (line.match(/[^ \t]/)) {
              lastNonEmptyLine = index;
            }
          });
          lines.forEach(function(line, index) {
            var isFirstLine = index === 0;
            var isLastLine = index === lines.length - 1;
            var isLastNonEmptyLine = index === lastNonEmptyLine;
            var trimmedLine = line.replace(/\t/g, ' ');
            if (!isFirstLine) {
              trimmedLine = trimmedLine.replace(/^[ ]+/, '');
            }
            if (!isLastLine) {
              trimmedLine = trimmedLine.replace(/[ ]+$/, '');
            }
            if (!isFirstLine) {
              utils.append(line.match(/^[ \t]*/)[0], state);
            }
            if (trimmedLine || isLastNonEmptyLine) {
              utils.append(JSON.stringify(trimmedLine) + (!isLastNonEmptyLine ? " + ' ' +" : ''), state);
              if (isLastNonEmptyLine) {
                if (end) {
                  utils.append(end, state);
                }
                if (!isLast) {
                  utils.append(', ', state);
                }
              }
              if (trimmedLine && !isLastLine) {
                utils.append(line.match(/[ \t]*$/)[0], state);
              }
            }
            if (!isLastLine) {
              utils.append('\n', state);
            }
          });
          utils.move(object.range[1], state);
        }
        function renderXJSExpressionContainer(traverse, object, isLast, path, state) {
          utils.move(object.range[0] + 1, state);
          traverse(object.expression, path, state);
          if (!isLast && object.expression.type !== Syntax.XJSEmptyExpression) {
            utils.catchup(object.expression.range[1], state, trimLeft);
            utils.append(', ', state);
          }
          utils.catchup(object.range[1] - 1, state, trimLeft);
          utils.move(object.range[1], state);
          return false;
        }
        function quoteAttrName(attr) {
          if (!/^[a-z_$][a-z\d_$]*$/i.test(attr)) {
            return '"' + attr + '"';
          }
          return attr;
        }
        function trimLeft(value) {
          return value.replace(/^[ ]+/, '');
        }
        exports.knownTags = knownTags;
        exports.renderXJSExpressionContainer = renderXJSExpressionContainer;
        exports.renderXJSLiteral = renderXJSLiteral;
        exports.quoteAttrName = quoteAttrName;
        exports.trimLeft = trimLeft;
      }, {
        "jstransform": 21,
        "jstransform/src/utils": 22
      }],
      37: [function(_dereq_, module, exports) {
        var es6ArrowFunctions = _dereq_('jstransform/visitors/es6-arrow-function-visitors');
        var es6Classes = _dereq_('jstransform/visitors/es6-class-visitors');
        var es6Destructuring = _dereq_('jstransform/visitors/es6-destructuring-visitors');
        var es6ObjectConciseMethod = _dereq_('jstransform/visitors/es6-object-concise-method-visitors');
        var es6ObjectShortNotation = _dereq_('jstransform/visitors/es6-object-short-notation-visitors');
        var es6RestParameters = _dereq_('jstransform/visitors/es6-rest-param-visitors');
        var es6Templates = _dereq_('jstransform/visitors/es6-template-visitors');
        var es7SpreadProperty = _dereq_('jstransform/visitors/es7-spread-property-visitors');
        var react = _dereq_('./transforms/react');
        var reactDisplayName = _dereq_('./transforms/reactDisplayName');
        var transformVisitors = {
          'es6-arrow-functions': es6ArrowFunctions.visitorList,
          'es6-classes': es6Classes.visitorList,
          'es6-destructuring': es6Destructuring.visitorList,
          'es6-object-concise-method': es6ObjectConciseMethod.visitorList,
          'es6-object-short-notation': es6ObjectShortNotation.visitorList,
          'es6-rest-params': es6RestParameters.visitorList,
          'es6-templates': es6Templates.visitorList,
          'es7-spread-property': es7SpreadProperty.visitorList,
          'react': react.visitorList.concat(reactDisplayName.visitorList)
        };
        var transformSets = {
          'harmony': ['es6-arrow-functions', 'es6-object-concise-method', 'es6-object-short-notation', 'es6-classes', 'es6-rest-params', 'es6-templates', 'es6-destructuring', 'es7-spread-property'],
          'react': ['react']
        };
        var transformRunOrder = ['es6-arrow-functions', 'es6-object-concise-method', 'es6-object-short-notation', 'es6-classes', 'es6-rest-params', 'es6-templates', 'es6-destructuring', 'es7-spread-property', 'react'];
        function getAllVisitors(excludes) {
          var ret = [];
          for (var i = 0,
              il = transformRunOrder.length; i < il; i++) {
            if (!excludes || excludes.indexOf(transformRunOrder[i]) === -1) {
              ret = ret.concat(transformVisitors[transformRunOrder[i]]);
            }
          }
          return ret;
        }
        function getVisitorsBySet(sets) {
          var visitorsToInclude = sets.reduce(function(visitors, set) {
            if (!transformSets.hasOwnProperty(set)) {
              throw new Error('Unknown visitor set: ' + set);
            }
            transformSets[set].forEach(function(visitor) {
              visitors[visitor] = true;
            });
            return visitors;
          }, {});
          var visitorList = [];
          for (var i = 0; i < transformRunOrder.length; i++) {
            if (visitorsToInclude.hasOwnProperty(transformRunOrder[i])) {
              visitorList = visitorList.concat(transformVisitors[transformRunOrder[i]]);
            }
          }
          return visitorList;
        }
        exports.getVisitorsBySet = getVisitorsBySet;
        exports.getAllVisitors = getAllVisitors;
        exports.transformVisitors = transformVisitors;
      }, {
        "./transforms/react": 34,
        "./transforms/reactDisplayName": 35,
        "jstransform/visitors/es6-arrow-function-visitors": 23,
        "jstransform/visitors/es6-class-visitors": 24,
        "jstransform/visitors/es6-destructuring-visitors": 25,
        "jstransform/visitors/es6-object-concise-method-visitors": 26,
        "jstransform/visitors/es6-object-short-notation-visitors": 27,
        "jstransform/visitors/es6-rest-param-visitors": 28,
        "jstransform/visitors/es6-template-visitors": 29,
        "jstransform/visitors/es7-spread-property-visitors": 31
      }]
    }, {}, [1])(1);
  });
})(require("buffer").Buffer, require("process"));
