import { Component, lazy, Suspense } from 'react';
import TunnelCanvas2D from './TunnelCanvas2D';
import { getGraphicsProfile } from '../utils/graphicsPerf';

const TunnelWebGL = lazy(() => import('./GLTFTunnel'));

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
  const perf = getGraphicsProfile();

  if (perf.prefer2DTunnel) {
    return <TunnelCanvas2D {...props} />;
  }

  return (
    <TunnelErrorBoundary {...props}>
      <Suspense fallback={<TunnelCanvas2D {...props} />}>
        <TunnelWebGL {...props} />
      </Suspense>
    </TunnelErrorBoundary>
  );
}
