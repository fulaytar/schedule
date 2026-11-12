import { Calculator, Coffee, Dumbbell, Gamepad2, Globe, GraduationCap, Laptop, type LucideProps } from 'lucide-react';
import type { CatKey } from '../types';
import { iconOption } from '../lib/icons';

const ICONS = {
  math: Calculator,
  geo: Globe,
  it: Laptop,
  ind: GraduationCap,
  gym: Dumbbell,
  fun: Gamepad2,
  free: Coffee,
} as const;

/** Іконка категорії; якщо задано icon — своя іконка заняття (напр. Dota 2) */
export function CatIcon({ cat, icon, size = 16, ...props }: { cat: CatKey; icon?: string } & LucideProps) {
  const opt = iconOption(icon);
  if (opt?.img) {
    const px = Number(size) + 2;
    return <img src={opt.img} alt="" aria-hidden width={px} height={px} style={{ flex: 'none', borderRadius: 4 }} />;
  }
  const Icon = opt?.lucide ?? ICONS[cat];
  return <Icon aria-hidden size={size} strokeWidth={2.2} {...props} />;
}
