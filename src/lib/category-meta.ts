import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

import { Neo } from '@/constants/theme';
import { DocumentCategory } from '@/lib/types';

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  prescription: Neo.blue,
  lab_report: Neo.mint,
  vaccination: Neo.yellow,
  discharge_summary: Neo.pink,
  insurance: Neo.purple,
  scan: Neo.orange,
  other: Neo.mutedSurface,
};

export const CATEGORY_ICONS: Record<DocumentCategory, ComponentProps<typeof Ionicons>['name']> = {
  prescription: 'medkit',
  lab_report: 'flask',
  vaccination: 'shield-checkmark',
  discharge_summary: 'exit',
  insurance: 'umbrella',
  scan: 'scan',
  other: 'document-text',
};
