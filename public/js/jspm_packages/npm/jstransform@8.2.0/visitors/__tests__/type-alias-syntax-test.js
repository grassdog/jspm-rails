/* */ 
require("mock-modules").autoMockOff();
describe('static type syntax syntax', function() {
  var flowSyntaxVisitors;
  var jstransform;
  beforeEach(function() {
    require("mock-modules").dumpCache();
    flowSyntaxVisitors = require("../type-syntax").visitorList;
    jstransform = require("jstransform");
  });
  function transform(code, visitors) {
    code = jstransform.transform(flowSyntaxVisitors, code.join('\n')).code;
    if (visitors) {
      code = jstransform.transform(visitors, code).code;
    }
    return code;
  }
  describe('type alias', () => {
    it('strips type aliases', () => {
      var code = transform(['var type = 42;', 'type FBID = number;', 'type type = string', 'type += 42;']);
      eval(code);
      expect(type).toBe(84);
    });
  });
});
