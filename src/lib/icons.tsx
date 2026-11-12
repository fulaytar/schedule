import {
  BookOpen,
  Bike,
  Car,
  Clapperboard,
  Gamepad2,
  Heart,
  House,
  Music,
  ShoppingCart,
  Star,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

/** Іконка, яку можна вибрати для заняття: або значок lucide, або картинка з public/icons */
export interface IconOption {
  key: string;
  label: string;
  lucide?: LucideIcon;
  img?: string;
  /** Яку назву підставити, якщо поле порожнє */
  title?: string;
}

export const ICON_OPTIONS: IconOption[] = [
  { key: 'dota2', label: 'Dota 2', img: './icons/dota2.png', title: 'Dota 2' },
  { key: 'gamepad', label: 'Ігри', lucide: Gamepad2 },
  { key: 'film', label: 'Кіно', lucide: Clapperboard },
  { key: 'music', label: 'Музика', lucide: Music },
  { key: 'book', label: 'Книга', lucide: BookOpen },
  { key: 'bike', label: 'Велосипед', lucide: Bike },
  { key: 'car', label: 'Дорога', lucide: Car },
  { key: 'food', label: 'Їжа', lucide: Utensils },
  { key: 'shop', label: 'Покупки', lucide: ShoppingCart },
  { key: 'home', label: 'Дім', lucide: House },
  { key: 'friends', label: 'Друзі', lucide: Users },
  { key: 'heart', label: 'Особисте', lucide: Heart },
  { key: 'star', label: 'Важливе', lucide: Star },
];

export const iconOption = (key?: string) => (key ? ICON_OPTIONS.find((o) => o.key === key) : undefined);
