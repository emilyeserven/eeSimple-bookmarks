import type { ReactNode } from "react";

import { Component } from "react";

/**
 * A minimal, reusable error boundary: catches an uncaught render error in its subtree and shows
 * `fallback` instead of unmounting the surrounding page. Reset (re-attempt rendering) by changing the
 * `resetKey` prop — e.g. when the previewed entity/tab changes, or the user reloads the section.
 *
 * Extracted from the Page Layouts preview so other settings panels (Card Display) can wrap their own
 * board/preview and degrade gracefully instead of blanking the whole page.
 */
export class ErrorBoundaryBox extends Component<
  { resetKey: string;
    fallback: ReactNode;
    children: ReactNode; },
  { failed: boolean }
> {
  constructor(props: { resetKey: string;
    fallback: ReactNode;
    children: ReactNode; }) {
    super(props);
    this.state = {
      failed: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({
        failed: false,
      });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
