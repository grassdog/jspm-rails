/* */ 
var tap = require("tap"),
    globalBefore = Object.keys(global),
    mm = require("../minimatch"),
    files = ["a", "b", "c", "d", "abc", "abd", "abe", "bb", "bcd", "ca", "cb", "dd", "de", "bdir/", "bdir/cfile"],
    next = files.concat(["a-b", "aXb", ".x", ".y"]);
tap.test("basic tests", function(t) {
  var start = Date.now();
  ;
  ["http://www.bashcookbook.com/bashinfo" + "/source/bash-1.14.7/tests/glob-test", ["a*", ["a", "abc", "abd", "abe"]], ["X*", ["X*"], {nonull: true}], ["X*", []], ["\\*", ["\\*"], {nonull: true}], ["\\**", ["\\**"], {nonull: true}], ["\\*\\*", ["\\*\\*"], {nonull: true}], ["b*/", ["bdir/"]], ["c*", ["c", "ca", "cb"]], ["**", files], ["\\.\\./*/", ["\\.\\./*/"], {nonull: true}], ["s/\\..*//", ["s/\\..*//"], {nonull: true}], "legendary larry crashes bashes", ["/^root:/{s/^[^:]*:[^:]*:\([^:]*\).*$/\\1/", ["/^root:/{s/^[^:]*:[^:]*:\([^:]*\).*$/\\1/"], {nonull: true}], ["/^root:/{s/^[^:]*:[^:]*:\([^:]*\).*$/\1/", ["/^root:/{s/^[^:]*:[^:]*:\([^:]*\).*$/\1/"], {nonull: true}], "character classes", ["[a-c]b*", ["abc", "abd", "abe", "bb", "cb"]], ["[a-y]*[^c]", ["abd", "abe", "bb", "bcd", "bdir/", "ca", "cb", "dd", "de"]], ["a*[^c]", ["abd", "abe"]], function() {
    files.push("a-b", "aXb");
  }, ["a[X-]b", ["a-b", "aXb"]], function() {
    files.push(".x", ".y");
  }, ["[^a-c]*", ["d", "dd", "de"]], function() {
    files.push("a*b/", "a*b/ooo");
  }, ["a\\*b/*", ["a*b/ooo"]], ["a\\*?/*", ["a*b/ooo"]], ["*\\\\!*", [], {null: true}, ["echo !7"]], ["*\\!*", ["echo !7"], null, ["echo !7"]], ["*.\\*", ["r.*"], null, ["r.*"]], ["a[b]c", ["abc"]], ["a[\\b]c", ["abc"]], ["a?c", ["abc"]], ["a\\*c", [], {null: true}, ["abc"]], ["", [""], {null: true}, [""]], "http://www.opensource.apple.com/source/bash/bash-23/" + "bash/tests/glob-test", function() {
    files.push("man/", "man/man1/", "man/man1/bash.1");
  }, ["*/man*/bash.*", ["man/man1/bash.1"]], ["man/man1/bash.1", ["man/man1/bash.1"]], ["a***c", ["abc"], null, ["abc"]], ["a*****?c", ["abc"], null, ["abc"]], ["?*****??", ["abc"], null, ["abc"]], ["*****??", ["abc"], null, ["abc"]], ["?*****?c", ["abc"], null, ["abc"]], ["?***?****c", ["abc"], null, ["abc"]], ["?***?****?", ["abc"], null, ["abc"]], ["?***?****", ["abc"], null, ["abc"]], ["*******c", ["abc"], null, ["abc"]], ["*******?", ["abc"], null, ["abc"]], ["a*cd**?**??k", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["a**?**cd**?**??k", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["a**?**cd**?**??k***", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["a**?**cd**?**??***k", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["a**?**cd**?**??***k**", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["a****c**?**??*****", ["abcdecdhjk"], null, ["abcdecdhjk"]], ["[-abc]", ["-"], null, ["-"]], ["[abc-]", ["-"], null, ["-"]], ["\\", ["\\"], null, ["\\"]], ["[\\\\]", ["\\"], null, ["\\"]], ["[[]", ["["], null, ["["]], ["[", ["["], null, ["["]], ["[*", ["[abc"], null, ["[abc"]], "a right bracket shall lose its special meaning and\n" + "represent itself in a bracket expression if it occurs\n" + "first in the list.  -- POSIX.2 2.8.3.2", ["[]]", ["]"], null, ["]"]], ["[]-]", ["]"], null, ["]"]], ["[a-\z]", ["p"], null, ["p"]], ["??**********?****?", [], {null: true}, ["abc"]], ["??**********?****c", [], {null: true}, ["abc"]], ["?************c****?****", [], {null: true}, ["abc"]], ["*c*?**", [], {null: true}, ["abc"]], ["a*****c*?**", [], {null: true}, ["abc"]], ["a********???*******", [], {null: true}, ["abc"]], ["[]", [], {null: true}, ["a"]], ["[abc", [], {null: true}, ["["]], "nocase tests", ["XYZ", ["xYz"], {
    nocase: true,
    null: true
  }, ["xYz", "ABC", "IjK"]], ["ab*", ["ABC"], {
    nocase: true,
    null: true
  }, ["xYz", "ABC", "IjK"]], ["[ia]?[ck]", ["ABC", "IjK"], {
    nocase: true,
    null: true
  }, ["xYz", "ABC", "IjK"]], "onestar/twostar", ["{/*,*}", [], {null: true}, ["/asdf/asdf/asdf"]], ["{/?,*}", ["/a", "bb"], {null: true}, ["/a", "/b/b", "/a/b/c", "bb"]], "dots should not match unless requested", ["**", ["a/b"], {}, ["a/b", "a/.d", ".a/.d"]], function() {
    files = ["a/./b", "a/../b", "a/c/b", "a/.d/b"];
  }, ["a/*/b", ["a/c/b", "a/.d/b"], {dot: true}], ["a/.*/b", ["a/./b", "a/../b", "a/.d/b"], {dot: true}], ["a/*/b", ["a/c/b"], {dot: false}], ["a/.*/b", ["a/./b", "a/../b", "a/.d/b"], {dot: false}], ["**", ["a/b", "a/.d", ".a/.d"], {dot: true}, [".a/.d", "a/.d", "a/b"]], "paren sets cannot contain slashes", ["*(a/b)", ["*(a/b)"], {nonull: true}, ["a/b"]], ["*(a|{b),c)}", ["a", "ab", "ac"], {}, ["a", "ab", "ac", "ad"]], ["[!a*", ["[!ab"], {}, ["[!ab", "[ab"]], ["[#a*", ["[#ab"], {}, ["[#ab", "[ab"]], ["+(a|*\\|c\\\\|d\\\\\\|e\\\\\\\\|f\\\\\\\\\\|g", ["+(a|b\\|c\\\\|d\\\\|e\\\\\\\\|f\\\\\\\\|g"], {}, ["+(a|b\\|c\\\\|d\\\\|e\\\\\\\\|f\\\\\\\\|g", "a", "b\\c"]], function() {
    files = ["a", "b", "c", "d", "ab", "ac", "ad", "bc", "cb", "bc,d", "c,db", "c,d", "d)", "(b|c", "*(b|c", "b|c", "b|cc", "cb|c", "x(a|b|c)", "x(a|c)", "(a|b|c)", "(a|c)"];
  }, ["*(a|{b,c})", ["a", "b", "c", "ab", "ac"]], ["{a,*(b|c,d)}", ["a", "(b|c", "*(b|c", "d)"]], ["{a,*(b|{c,d})}", ["a", "b", "bc", "cb", "c", "d"]], ["*(a|{b|c,c})", ["a", "b", "c", "ab", "ac", "bc", "cb"]], ["*(a|{b|c,c})", ["x(a|b|c)", "x(a|c)", "(a|b|c)", "(a|c)"], {noext: true}], ["a?b", ["x/y/acb", "acb/"], {matchBase: true}, ["x/y/acb", "acb/", "acb/d/e", "x/y/acb/d"]], ["#*", ["#a", "#b"], {nocomment: true}, ["#a", "#b", "c#d"]], "negation tests", function() {
    files = ["d", "e", "!ab", "!abc", "a!b", "\\!a"];
  }, ["!a*", ["\\!a", "d", "e", "!ab", "!abc"]], ["!a*", ["!ab", "!abc"], {nonegate: true}], ["!!a*", ["a!b"]], ["!\\!a*", ["a!b", "d", "e", "\\!a"]], function() {
    files = ["foo.js", "foo.bar", "foo.js.js", "blar.js", "foo.", "boo.js.boo"];
  }, ["*.!(js)", ["foo.bar", "foo.", "boo.js.boo"]]].forEach(function(c) {
    if (typeof c === "function")
      return c();
    if (typeof c === "string")
      return t.comment(c);
    var pattern = c[0],
        expect = c[1].sort(alpha),
        options = c[2],
        f = c[3] || files,
        tapOpts = c[4] || {};
    var Class = mm.defaults(options).Minimatch;
    var m = new Class(pattern, {});
    var r = m.makeRe();
    tapOpts.re = String(r) || JSON.stringify(r);
    tapOpts.files = JSON.stringify(f);
    tapOpts.pattern = pattern;
    tapOpts.set = m.set;
    tapOpts.negated = m.negate;
    var actual = mm.match(f, pattern, options);
    actual.sort(alpha);
    t.equivalent(actual, expect, JSON.stringify(pattern) + " " + JSON.stringify(expect), tapOpts);
  });
  t.comment("time=" + (Date.now() - start) + "ms");
  t.end();
});
tap.test("global leak test", function(t) {
  var globalAfter = Object.keys(global);
  t.equivalent(globalAfter, globalBefore, "no new globals, please");
  t.end();
});
function alpha(a, b) {
  return a > b ? 1 : -1;
}
