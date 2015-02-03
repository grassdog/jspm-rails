/* */ 
(function(process) {
  "use strict";
  var BeforeInputEventPlugin = require("./BeforeInputEventPlugin");
  var ChangeEventPlugin = require("./ChangeEventPlugin");
  var ClientReactRootIndex = require("./ClientReactRootIndex");
  var CompositionEventPlugin = require("./CompositionEventPlugin");
  var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
  var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
  var ExecutionEnvironment = require("./ExecutionEnvironment");
  var HTMLDOMPropertyConfig = require("./HTMLDOMPropertyConfig");
  var MobileSafariClickEventPlugin = require("./MobileSafariClickEventPlugin");
  var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
  var ReactComponentBrowserEnvironment = require("./ReactComponentBrowserEnvironment");
  var ReactDefaultBatchingStrategy = require("./ReactDefaultBatchingStrategy");
  var ReactDOMComponent = require("./ReactDOMComponent");
  var ReactDOMButton = require("./ReactDOMButton");
  var ReactDOMForm = require("./ReactDOMForm");
  var ReactDOMImg = require("./ReactDOMImg");
  var ReactDOMInput = require("./ReactDOMInput");
  var ReactDOMOption = require("./ReactDOMOption");
  var ReactDOMSelect = require("./ReactDOMSelect");
  var ReactDOMTextarea = require("./ReactDOMTextarea");
  var ReactEventListener = require("./ReactEventListener");
  var ReactInjection = require("./ReactInjection");
  var ReactInstanceHandles = require("./ReactInstanceHandles");
  var ReactMount = require("./ReactMount");
  var SelectEventPlugin = require("./SelectEventPlugin");
  var ServerReactRootIndex = require("./ServerReactRootIndex");
  var SimpleEventPlugin = require("./SimpleEventPlugin");
  var SVGDOMPropertyConfig = require("./SVGDOMPropertyConfig");
  var createFullPageComponent = require("./createFullPageComponent");
  function inject() {
    ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener);
    ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
    ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
    ReactInjection.EventPluginHub.injectMount(ReactMount);
    ReactInjection.EventPluginHub.injectEventPluginsByName({
      SimpleEventPlugin: SimpleEventPlugin,
      EnterLeaveEventPlugin: EnterLeaveEventPlugin,
      ChangeEventPlugin: ChangeEventPlugin,
      CompositionEventPlugin: CompositionEventPlugin,
      MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
      SelectEventPlugin: SelectEventPlugin,
      BeforeInputEventPlugin: BeforeInputEventPlugin
    });
    ReactInjection.NativeComponent.injectGenericComponentClass(ReactDOMComponent);
    ReactInjection.NativeComponent.injectComponentClasses({
      'button': ReactDOMButton,
      'form': ReactDOMForm,
      'img': ReactDOMImg,
      'input': ReactDOMInput,
      'option': ReactDOMOption,
      'select': ReactDOMSelect,
      'textarea': ReactDOMTextarea,
      'html': createFullPageComponent('html'),
      'head': createFullPageComponent('head'),
      'body': createFullPageComponent('body')
    });
    ReactInjection.CompositeComponent.injectMixin(ReactBrowserComponentMixin);
    ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
    ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);
    ReactInjection.EmptyComponent.injectEmptyComponent('noscript');
    ReactInjection.Updates.injectReconcileTransaction(ReactComponentBrowserEnvironment.ReactReconcileTransaction);
    ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);
    ReactInjection.RootIndex.injectCreateReactRootIndex(ExecutionEnvironment.canUseDOM ? ClientReactRootIndex.createReactRootIndex : ServerReactRootIndex.createReactRootIndex);
    ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
    if ("production" !== process.env.NODE_ENV) {
      var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
      if ((/[?&]react_perf\b/).test(url)) {
        var ReactDefaultPerf = require("./ReactDefaultPerf");
        ReactDefaultPerf.start();
      }
    }
  }
  module.exports = {inject: inject};
})(require("process"));
