/* */ 
(function(process) {
  module.exports = globSync;
  globSync.GlobSync = GlobSync;
  var fs = require("fs");
  var minimatch = require("minimatch");
  var Minimatch = minimatch.Minimatch;
  var Glob = require("./glob").Glob;
  var util = require("util");
  var path = require("path");
  var assert = require("assert");
  var common = require("./common");
  var alphasort = common.alphasort;
  var isAbsolute = common.isAbsolute;
  var setopts = common.setopts;
  var ownProp = common.ownProp;
  function globSync(pattern, options) {
    if (typeof options === 'function' || arguments.length === 3)
      throw new TypeError('callback provided to sync glob');
    return new GlobSync(pattern, options).found;
  }
  function GlobSync(pattern, options) {
    if (!pattern)
      throw new Error("must provide pattern");
    if (typeof options === 'function' || arguments.length === 3)
      throw new TypeError('callback provided to sync glob');
    if (!(this instanceof GlobSync))
      return new GlobSync(pattern, options);
    setopts(this, pattern, options);
    if (this.noprocess)
      return this;
    var n = this.minimatch.set.length;
    this.matches = new Array(n);
    for (var i = 0; i < n; i++) {
      this._process(this.minimatch.set[i], i, false);
    }
    this._finish();
  }
  GlobSync.prototype._finish = function() {
    assert(this instanceof GlobSync);
    common.finish(this);
  };
  GlobSync.prototype._process = function(pattern, index, inGlobStar) {
    assert(this instanceof GlobSync);
    var n = 0;
    while (typeof pattern[n] === "string") {
      n++;
    }
    var prefix;
    switch (n) {
      case pattern.length:
        this._processSimple(pattern.join('/'), index);
        return ;
      case 0:
        prefix = null;
        break;
      default:
        prefix = pattern.slice(0, n).join("/");
        break;
    }
    var remain = pattern.slice(n);
    var read;
    if (prefix === null)
      read = ".";
    else if (isAbsolute(prefix) || isAbsolute(pattern.join("/"))) {
      if (!prefix || !isAbsolute(prefix))
        prefix = "/" + prefix;
      read = prefix;
    } else
      read = prefix;
    var abs = this._makeAbs(read);
    var isGlobStar = remain[0] === minimatch.GLOBSTAR;
    if (isGlobStar)
      this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
    else
      this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
  };
  GlobSync.prototype._processReaddir = function(prefix, read, abs, remain, index, inGlobStar) {
    var entries = this._readdir(abs, inGlobStar);
    if (!entries)
      return ;
    var pn = remain[0];
    var negate = !!this.minimatch.negate;
    var rawGlob = pn._glob;
    var dotOk = this.dot || rawGlob.charAt(0) === ".";
    var matchedEntries = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.charAt(0) !== "." || dotOk) {
        var m;
        if (negate && !prefix) {
          m = !e.match(pn);
        } else {
          m = e.match(pn);
        }
        if (m)
          matchedEntries.push(e);
      }
    }
    var len = matchedEntries.length;
    if (len === 0)
      return ;
    if (remain.length === 1 && !this.mark && !this.stat) {
      if (!this.matches[index])
        this.matches[index] = Object.create(null);
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        if (prefix) {
          if (prefix.slice(-1) !== "/")
            e = prefix + "/" + e;
          else
            e = prefix + e;
        }
        if (e.charAt(0) === "/" && !this.nomount) {
          e = path.join(this.root, e);
        }
        this.matches[index][e] = true;
      }
      return ;
    }
    remain.shift();
    for (var i = 0; i < len; i++) {
      var e = matchedEntries[i];
      var newPattern;
      if (prefix)
        newPattern = [prefix, e];
      else
        newPattern = [e];
      this._process(newPattern.concat(remain), index, inGlobStar);
    }
  };
  GlobSync.prototype._emitMatch = function(index, e) {
    if (!this.matches[index][e]) {
      if (this.nodir) {
        var c = this.cache[this._makeAbs(e)];
        if (c === 'DIR' || Array.isArray(c))
          return ;
      }
      this.matches[index][e] = true;
      if (this.stat || this.mark)
        this._stat(this._makeAbs(e));
    }
  };
  GlobSync.prototype._readdirInGlobStar = function(abs) {
    var entries;
    var lstat;
    var stat;
    try {
      lstat = fs.lstatSync(abs);
    } catch (er) {
      return null;
    }
    var isSym = lstat.isSymbolicLink();
    this.symlinks[abs] = isSym;
    if (!isSym && !lstat.isDirectory())
      this.cache[abs] = 'FILE';
    else
      entries = this._readdir(abs, false);
    return entries;
  };
  GlobSync.prototype._readdir = function(abs, inGlobStar) {
    var entries;
    if (inGlobStar && !ownProp(this.symlinks, abs))
      return this._readdirInGlobStar(abs);
    if (ownProp(this.cache, abs)) {
      var c = this.cache[abs];
      if (!c || c === 'FILE')
        return null;
      if (Array.isArray(c))
        return c;
    }
    try {
      return this._readdirEntries(abs, fs.readdirSync(abs).sort(alphasort));
    } catch (er) {
      this._readdirError(abs, er);
      return null;
    }
  };
  GlobSync.prototype._readdirEntries = function(abs, entries) {
    if (!this.mark && !this.stat) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (abs === "/")
          e = abs + e;
        else
          e = abs + "/" + e;
        this.cache[e] = true;
      }
    }
    this.cache[abs] = entries;
    return entries;
  };
  GlobSync.prototype._readdirError = function(f, er) {
    switch (er.code) {
      case "ENOTDIR":
        this.cache[f] = 'FILE';
        break;
      case "ENOENT":
      case "ELOOP":
      case "ENAMETOOLONG":
      case "UNKNOWN":
        this.cache[f] = false;
        break;
      default:
        this.cache[f] = false;
        if (this.strict)
          throw er;
        if (!this.silent)
          console.error("glob error", er);
        break;
    }
  };
  GlobSync.prototype._processGlobStar = function(prefix, read, abs, remain, index, inGlobStar) {
    var entries = this._readdir(abs, inGlobStar);
    if (!entries)
      return ;
    var remainWithoutGlobStar = remain.slice(1);
    var gspref = prefix ? [prefix] : [];
    var noGlobStar = gspref.concat(remainWithoutGlobStar);
    this._process(noGlobStar, index, false);
    var len = entries.length;
    var isSym = this.symlinks[abs];
    if (isSym && inGlobStar)
      return ;
    for (var i = 0; i < len; i++) {
      var e = entries[i];
      if (e.charAt(0) === "." && !this.dot)
        continue;
      var instead = gspref.concat(entries[i], remainWithoutGlobStar);
      this._process(instead, index, true);
      var below = gspref.concat(entries[i], remain);
      this._process(below, index, true);
    }
  };
  GlobSync.prototype._processSimple = function(prefix, index) {
    var exists = this._stat(prefix);
    if (!this.matches[index])
      this.matches[index] = Object.create(null);
    if (!exists)
      return ;
    if (prefix && isAbsolute(prefix) && !this.nomount) {
      if (prefix.charAt(0) === "/") {
        prefix = path.join(this.root, prefix);
      } else {
        prefix = path.resolve(this.root, prefix);
      }
    }
    if (process.platform === "win32")
      prefix = prefix.replace(/\\/g, "/");
    this.matches[index][prefix] = true;
  };
  GlobSync.prototype._stat = function(f) {
    var abs = f;
    if (f.charAt(0) === "/")
      abs = path.join(this.root, f);
    else if (this.changedCwd)
      abs = path.resolve(this.cwd, f);
    if (f.length > this.maxLength)
      return false;
    if (!this.stat && ownProp(this.cache, f)) {
      var c = this.cache[f];
      if (Array.isArray(c))
        c = 'DIR';
      if (abs.slice(-1) === "/" && c !== 'DIR')
        return false;
      return c;
    }
    var exists;
    var stat = this.statCache[abs];
    if (!stat) {
      try {
        stat = fs.statSync(abs);
      } catch (er) {
        return false;
      }
    }
    this.statCache[abs] = stat;
    if (abs.slice(-1) === "/" && !stat.isDirectory())
      return false;
    var c = stat.isDirectory() ? 'DIR' : 'FILE';
    this.cache[f] = this.cache[f] || c;
    return c;
  };
  GlobSync.prototype._mark = function(p) {
    return common.mark(this, p);
  };
  GlobSync.prototype._makeAbs = function(f) {
    return common.makeAbs(this, f);
  };
})(require("process"));
