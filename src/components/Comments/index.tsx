/* eslint-disable no-use-before-define */
import React, { Component } from 'react';
import styles from './comments.module.scss';

export default class Comments extends Component {
  commentBox: any;

  constructor(props) {
    super(props);
    this.commentBox = React.createRef();
  }

  componentDidMount() {
    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute('repo', 'joaogn/utterances-to-challenge06');
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'dark-blue');
    this.commentBox.current.appendChild(scriptEl);
  }

  render() {
    return (
      <div ref={this.commentBox} id="comments" className={styles.container} />
    );
  }
}
