import { Calculator, Coffee, Dumbbell, Globe, GraduationCap, Laptop, type LucideProps } from 'lucide-react';
import type { CatKey } from '../types';

const ICONS = {
  math: Calculator,
  geo: Globe,
  it: Laptop,
  ind: GraduationCap,
  gym: Dumbbell,
  free: Coffee,
} as const;

export function CatIcon({ cat, ...props }: { cat: CatKey } & LucideProps) {
  const Icon = ICONS[cat];
  return <Icon aria-hidden size={16} strokeWidth={2.2} {...props} />;
}
