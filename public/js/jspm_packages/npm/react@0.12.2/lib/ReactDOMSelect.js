/* */ 
"use strict";
var AutoFocusMixin = require("./AutoFocusMixin");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactElement = require("./ReactElement");
var ReactDOM = require("./ReactDOM");
var ReactUpdates = require("./ReactUpdates");
var assign = require("./Object.assign");
var select = ReactElement.createFactory(ReactDOM.select.type);
function updateWithPendingValueIfMounted() {
  if (this.isMounted()) {
    this.setState({value: this._pendingValue});
    this._pendingValue = 0;
  }
}
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return ;
  }
  if (props.multiple) {
    if (!Array.isArray(props[propName])) {
      return new Error(("The `" + propName + "` prop supplied to <select> must be an array if ") + ("`multiple` is true."));
    }
  } else {
    if (Array.isArray(props[propName])) {
      return new Error(("The `" + propName + "` prop supplied to <select> must be a scalar ") + ("value if `multiple` is false."));
    }
  }
}
function updateOptions(component, propValue) {
  var multiple = component.props.multiple;
  var value = propValue != null ? propValue : component.state.value;
  var options = component.getDOMNode().options;
  var selectedValue,
      i,
      l;
  if (multiple) {
    selectedValue = {};
    for (i = 0, l = value.length; i < l; ++i) {
      selectedValue['' + value[i]] = true;
    }
  } else {
    selectedValue = '' + value;
  }
  for (i = 0, l = options.length; i < l; i++) {
    var selected = multiple ? selectedValue.hasOwnProperty(options[i].value) : options[i].value === selectedValue;
    if (selected !== options[i].selected) {
      options[i].selected = selected;
    }
  }
}
var ReactDOMSelect = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMSelect',
  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],
  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },
  getInitialState: function() {
    return {value: this.props.defaultValue || (this.props.multiple ? [] : '')};
  },
  componentWillMount: function() {
    this._pendingValue = null;
  },
  componentWillReceiveProps: function(nextProps) {
    if (!this.props.multiple && nextProps.multiple) {
      this.setState({value: [this.state.value]});
    } else if (this.props.multiple && !nextProps.multiple) {
      this.setState({value: this.state.value[0]});
    }
  },
  render: function() {
    var props = assign({}, this.props);
    props.onChange = this._handleChange;
    props.value = null;
    return select(props, this.props.children);
  },
  componentDidMount: function() {
    updateOptions(this, LinkedValueUtils.getValue(this));
  },
  componentDidUpdate: function(prevProps) {
    var value = LinkedValueUtils.getValue(this);
    var prevMultiple = !!prevProps.multiple;
    var multiple = !!this.props.multiple;
    if (value != null || prevMultiple !== multiple) {
      updateOptions(this, value);
    }
  },
  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      returnValue = onChange.call(this, event);
    }
    var selectedValue;
    if (this.props.multiple) {
      selectedValue = [];
      var options = event.target.options;
      for (var i = 0,
          l = options.length; i < l; i++) {
        if (options[i].selected) {
          selectedValue.push(options[i].value);
        }
      }
    } else {
      selectedValue = event.target.value;
    }
    this._pendingValue = selectedValue;
    ReactUpdates.asap(updateWithPendingValueIfMounted, this);
    return returnValue;
  }
});
module.exports = ReactDOMSelect;
