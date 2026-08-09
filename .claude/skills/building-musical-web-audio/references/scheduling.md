# Scheduling

Use `audioContext.currentTime`.

Direct contacts: schedule with a tiny future safety offset (a few
milliseconds) so the note is never scheduled in the past.

Sequences (strums, phrases): use a short look-ahead interval (20-30ms),
schedule a bounded future window (80-120ms), keep tempo changes possible,
queue visual events with their audio timestamps so visuals can wait for
the audio clock to reach them rather than firing on the visual frame that
detected the contact.

Do not schedule an entire long game soundtrack in advance.
