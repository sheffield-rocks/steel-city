import { TRANSPORT_MODES } from '@transport/domain';

export function getTransportGreeting(): string {
  const [defaultMode] = TRANSPORT_MODES;
  return `Hello World from ${defaultMode}`;
}
