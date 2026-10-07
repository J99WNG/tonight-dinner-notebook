/**
 * Atomic-design compatibility barrel.
 *
 * Atoms are indivisible visual treatments. Molecules combine those treatments
 * into reusable content patterns. Existing consumers import from this module;
 * new focused components may import from the layer-specific files directly.
 */
export {
  FormFootnote,
  ReadyBadge,
  SupportingText,
  operationalType,
} from '@/components/atoms/operational-atoms';

export {
  DetailLine,
  DetailPanel,
  EmptyState,
} from '@/components/molecules/feedback';

export { ChoiceItem, ChoiceList } from '@/components/molecules/choice-list';

export { OperationalSurface } from '@/components/molecules/operational-surface';
