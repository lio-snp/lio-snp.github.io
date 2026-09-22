# Academic homepage

The root route uses the approved cool-gray black-cat design. Existing bilingual notes, CV, and about routes remain available; Notes links to `/en/blog/`.

- Markup: `src/pages/index.astro`
- Content and styling: `public/homepage/`
- Media: `public/homepage/assets/`
- GitHub profile: `https://github.com/lio-snp`

The cat walks on the divider below About and News. Its daily visit uses Beijing time (UTC+8): enter at 12:00, nap, leave by 14:00. The footer’s **Where is my cat?** button starts an 84-second visit at any time and scrolls to the cat. Pressing it during a manual visit returns to the current cat without restarting it. Afterwards it returns to the daily schedule. Reduced motion uses a still sleeping pose.

Animation uses the supplied eight-column sheet at `public/homepage/assets/black-cat/motion-sprites.png`, copied without image edits. Walking cycles through eight poses at 110 ms per pose. Sitting down and waking up use timed intermediate poses; sleeping cycles gently through closed-eye poses, with an occasional peek. Each pose is individually clipped, uniformly scaled, and aligned to the same floor to keep the original 30px desktop / 24px mobile anchor. The prior sheet is retained for reference.

Validate with `npm test`, `npm run check`, and `npm run build`. GitHub Actions publishes the Astro `dist/` output to Pages.
