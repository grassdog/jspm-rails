import React from "react";
import Router from "react-router";

// TODO Add react router code

export var First = React.createClass({
  componentDidMount() {
    console.log("Hello mounted!")
  },
  render() {
    return <div>First {this.props.message}</div>;

  }
});


export class Second extends React.Component {
  componentDidMount() {
    console.log("Second mounted!")
  }

  render() {
    return <div>Second {this.props.message}</div>;
  }
}

// React.render(<Hello message="world"/>, document.body);

// React.render(<Second message="wurld"/>, document.body);

