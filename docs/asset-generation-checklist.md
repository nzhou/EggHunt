# EggHunt Asset Checklist

## 1) Backgrounds (4)
Generate and place these files:
- `assets/themes/garden.webp`
- `assets/themes/forest.webp`
- `assets/themes/playground.webp`
- `assets/themes/indoor.webp`

Recommended size: 2560x1600 master, export 1920x1200 runtime.

## 2) Props (transparent PNG)
Generate separate transparent PNG files for each prop variant.
Use naming:
- `assets/props/prop_<type>_<nn>.png`

Types in current manifest:
- `bunny`
- `plush_bunny`
- `chick`
- `easter_flower`
- `tulip`
- `basket`
- `carrot`
- `pinwheel`
- `storybook`

## 3) Eggs (transparent PNG)
Generate separate transparent PNG egg styles.
Use naming:
- `assets/eggs/egg_pattern_<style>_<nn>.png`

## 4) Quality rules
- Transparent background for all props and eggs.
- Centered, uncropped object.
- No text/watermark.
- Consistent fairytale style.
- Clean silhouette when viewed small.

## 5) Manifest
Update `assets/manifest.json` if filenames differ.
