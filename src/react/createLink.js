/* eslint-disable import/no-extraneous-dependencies */
import React, { Component, PropTypes } from 'react';

export default function createLink(history) {
  class Link extends Component {
    static propTypes = {
      to: PropTypes.string.isRequired,
      className: PropTypes.string,
      children: PropTypes.any,
    };

    onClick = (e) => {
      e.preventDefault();
      history.push(this.props.to);
    };

    render() {
      const { to, className, children } = this.props;

      return (
        <a href={to} className={className} onClick={this.onClick}>
          {children}
        </a>
      );
    }
  }

  return Link;
}
