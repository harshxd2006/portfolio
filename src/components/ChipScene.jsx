import { Component, Suspense, lazy } from 'react';
import ChipSceneLegacy from './ChipSceneLegacy';

const ChipGLBScene = lazy(() => import('./ChipGLBScene'));

class ChipLoadErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.warn('[ChipScene] GLB failed, using legacy scene:', error);
    }
  }

  render() {
    if (this.state.failed) {
      return <ChipSceneLegacy {...this.props} />;
    }
    return this.props.children;
  }
}

export default function ChipScene(props) {
  return (
    <ChipLoadErrorBoundary {...props}>
      <Suspense fallback={<ChipSceneLegacy {...props} />}>
        <ChipGLBScene {...props} />
      </Suspense>
    </ChipLoadErrorBoundary>
  );
}
