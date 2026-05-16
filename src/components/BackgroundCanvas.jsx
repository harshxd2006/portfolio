import { Component, lazy, Suspense } from 'react';
import TunnelCanvas2D from './TunnelCanvas2D';

const TunnelWebGL = lazy(() => import('./TunnelWebGL'));

class TunnelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <TunnelCanvas2D {...this.props} />;
    }
    return this.props.children;
  }
}

export default function BackgroundCanvas(props) {
  return (
    <TunnelErrorBoundary {...props}>
      <Suspense fallback={<TunnelCanvas2D {...props} />}>
        <TunnelWebGL {...props} />
      </Suspense>
    </TunnelErrorBoundary>
  );
}
