import { FieldNote, FieldNoteCategory } from '@/@types/fieldNote.type';

import mountain from '@/public/mountain.jpg';
import waterfall from '@/public/waterfall_me.jpg';
import clouds from '@/public/clouds.jpg';
import flower from '@/public/flower_rose.jpg';
import cat from '@/public/cat.jpg';
import sketch from '@/public/sketch.jpg';
import painting1 from '@/public/painting1.jpg';
import painting2 from '@/public/Painting2.jpg';

export const categoryLabels: Record<FieldNoteCategory, string> = {
  hikes: 'Hikes & Photography',
  design: 'Design Notes',
  books: 'Books',
  hardware: 'Hardware',
  engineering: 'Engineering Lessons',
};

// Real photo assets recategorized from the old undifferentiated hobbies grid
// — no new content, just grouped by category instead of a loose grid.
export const fieldNotes: FieldNote[] = [
  { id: 'beach', category: 'hikes', title: 'Chilling near a beach', caption: 'Somewhere with a horizon.', image: mountain },
  { id: 'waterfall', category: 'hikes', title: 'Admiring the waterfall', caption: 'Stood there longer than planned.', image: waterfall },
  { id: 'clouds', category: 'hikes', title: 'Clouds', caption: 'Looked up, took the shot.', image: clouds },
  { id: 'flower', category: 'hikes', title: 'Rose in dew', caption: 'Early morning, still wet.', image: flower },
  { id: 'cat', category: 'hikes', title: 'Cats', caption: 'Not a hike, but couldn\'t leave this out.', image: cat },
  { id: 'sketch', category: 'design', title: 'One of my many sketches', caption: 'Analog first, always.', image: sketch },
  { id: 'painting1', category: 'design', title: 'A night sky painting', caption: 'Paint before code, most days.', image: painting1 },
  { id: 'painting2', category: 'design', title: 'Another one of my paintings', caption: 'Still figuring out the palette.', image: painting2 },

  // PLACEHOLDER-PENDING-REAL-CONTENT: no specific book titles given yet —
  // swap title/caption/image once real entries are chosen.
  { id: 'book-1', category: 'books', title: '[PLACEHOLDER] Book title', caption: '[PLACEHOLDER] one-line takeaway', image: null, isPlaceholder: true },
  { id: 'book-2', category: 'books', title: '[PLACEHOLDER] Book title', caption: '[PLACEHOLDER] one-line takeaway', image: null, isPlaceholder: true },

  // Real — grounded in the actual hardware/robotics work (full write-up at
  // /projects/hardware-prototypes and the Maker Lab section).
  {
    id: 'sensor-robotics',
    category: 'hardware',
    title: 'Sensor-driven robotic prototypes',
    caption: 'Arduino + Raspberry Pi builds — ultrasonic, motion, temperature, environmental sensors, real-time control.',
    image: null,
  },
  {
    id: 'edge-ai-lesson',
    category: 'engineering',
    title: 'On-device vs. cloud inference',
    caption: 'The real lesson from edge-AI work: latency, reliability, and system-level tradeoffs rarely have a clean winner.',
    image: null,
  },
];

export function fieldNotesByCategory(category: FieldNoteCategory): FieldNote[] {
  return fieldNotes.filter((note) => note.category === category);
}
