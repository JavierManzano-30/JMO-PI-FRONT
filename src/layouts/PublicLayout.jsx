import React from 'react';
import { AppLayout } from './AppLayout.jsx';
import { createPublicLayoutConfig } from './layoutConfig.js';

export function PublicLayout() {
  return <AppLayout layout={createPublicLayoutConfig()} />;
}
