# Sticker Background Removal

Use `tools/remove_background.py` to turn sticker images into transparent PNGs.

For the cleanest cutouts, install the optional AI remover:

```bash
pip install -r requirements-background.txt
python3 tools/remove_background.py aboutus --recursive --method rembg --in-place
```

Without extra installs, use the Pillow-only fallback. It works best when the
background is flat or nearly flat and touches the image edges:

```bash
python3 tools/remove_background.py aboutus --recursive --method edge --in-place
```

By default, `--in-place` keeps a copy of each original under
`_original-backgrounds/`. Use `--output-dir transparent` instead if you want
new files without overwriting the originals.

Useful fallback tuning:

```bash
python3 tools/remove_background.py aboutus/flower.png --method edge --high 20 --bg-color '#f0f1f1'
```

- Lower `--high` if a white sticker border is getting erased.
- Raise `--high` if a faint background halo remains.
- Add `--erode 1` for stubborn halos.
- Adjust `--transparent-cutoff` if feathering leaves pixels that are almost,
  but not fully, transparent.
- Add `--trim --padding 24` if you want the output cropped to the cutout.
