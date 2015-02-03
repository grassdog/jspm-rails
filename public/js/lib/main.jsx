import React from "react";
import Widgets from "./widgets";
// import Router from "react-router";

var WidgetList = React.createClass({

  render() {
    var widgets = this.props.widgets.map(widget => {
      return <Widget widget={ widget } key= { widget.id } />;
    });

    return <ul>{widgets}</ul>;
  }
});


class Widget extends React.Component {
  render() {
    return <li>{this.props.widget.name}</li>;
  }
}

React.render(<WidgetList widgets = { Widgets.all() } />, document.getElementById("container"));

