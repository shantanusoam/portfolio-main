import { StaticImageData } from 'next/image';

export type FieldNoteCategory =
  | 'books'
  | 'hikes'
  | 'design'
  | 'hardware'
  | 'engineering';

export type FieldNote = {
  id: string;
  category: FieldNoteCategory;
  title: string;
  caption: string;
  // null = no real photo/asset yet — renders a caption-only card instead of
  // pointing a static import at a file that doesn't exist.
  image: StaticImageData | null;
  isPlaceholder?: boolean;
};
