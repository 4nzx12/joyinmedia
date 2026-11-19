# Joyin Media

Joyin Media's React and Vite website, redesigned with warm editorial typography, theme-aware video backgrounds, glass and metal controls, animated metrics, and project marquees. The existing projects, client stories, contact destinations, and section URLs are retained.

## Run locally

Use Node.js 20.19+ or 22.12+ (a supported LTS release is recommended).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is disabled:

```powershell
npm.cmd run dev
```

`index.html` is now the application entry point. Use the Vite server instead of opening the HTML file directly or using a basic Live Server extension.

## Build and deploy

```sh
npm run build
npm run preview
```

Pushing to `main` runs `.github/workflows/static.yml`, which builds the site and publishes `dist/` to GitHub Pages. For other static hosts, upload the contents of `dist/`. The build generates optimized JS/CSS and pre-renders the React page into `dist/index.html`; React hydrates it in the browser. The paired page-background videos are optimized local variants in `public/media` of the Cloudinary originals in `src/data/content.js`. No production Node server or SPA rewrite rules are needed for the existing hash-based navigation. `public/robots.txt` and `public/sitemap.xml` are copied into the build.

Keep the canonical URL and sitemap in sync if the production domain changes. Update the sitemap's `lastmod` when publishing a content change.

## Project structure

```text
index.html             Metadata, fonts, early theme preference, React entry
src/App.jsx            Page composition
src/components/        Page sections, carousel and modal
src/components/ui/     Adapted components from the supplied collection
src/hooks/             Theme, motion, visibility and analytics lifecycle
src/data/content.js    Client stories, projects, logos and contact details
src/data/packages.js   Marketing package copy and graphics
src/lib/contact.js     Enquiry validation and encoded contact URLs
src/styles/site.css    Editorial design, themes and responsive layouts
src/styles/react.css   Shared button, shimmer and number styles
public/                Crawl files copied to the production build
scripts/build.mjs      Vite build and static HTML generation
tests/                 Contact logic and browser interaction checks
legacy/                Untouched copy of the original five website files
```

Change page content in the relevant component or data file. There is no router because the website is a single page. Animation uses Motion, NumberFlow, CSS and the Web Animations API, with effect cleanup for React Strict Mode and hot reload. Motion's animation features and the project player are separate lazy-loaded chunks.

The main carousel has four category slides: Presentation, Preparation, Story Skits, and Fast Cuts. Each opens its own video collection. Manage the `videoIds` in `videoCategories` in `src/data/content.js`; the first video is the collection's cover. Covers use blurred, muted looping video behind clear text, with blurred stills when inactive, unavailable, or motion/data saving is enabled. Both covers and collection previews play only the active video while visible. Cloudinary delivery URLs request resized, compressed videos (560px previews and 1080px modal playback) using [Cloudinary's video optimization options](https://cloudinary.com/documentation/video_optimization). Original asset URLs are preserved in the data file. Media remains on the original Cloudinary account, and fonts remain on Google Fonts.

The hero and footer use the supplied light/dark Cloudinary videos through `VideoBackground.jsx`; the URLs live in `backgrounds` in `src/data/content.js`. Services and Contact reuse these videos with a soft blur and faded edges, while their foreground content remains sharp. Backgrounds are muted and looping, switch with the theme, load when their section enters the viewport, and pause offscreen or in hidden tabs. The hero is loaded first. Reduced motion, data saving, blocked autoplay, or failed video requests leave a matching still image visible, with a CSS gradient underneath. Video delivery is resized and compressed to 1440px. The previous WebGL background components are no longer mounted. Marquees pause offscreen and in hidden tabs; duplicate tracks are hidden from assistive technology and inert. The legacy `#faq` anchor has a correctly labeled Results navigation link.

## Supplied component integration

The supplied TypeScript/Tailwind components were adapted into JSX and scoped plain CSS, matching this application's existing setup. Source files are in `src/components/ui/`. The `@/` alias resolves to `src/` in Vite and the editor for registry component imports.

| Supplied component | Where it is used |
| --- | --- |
| `shimmer-text` | Hero headline and closing invitation, using lazy Motion features |
| `liquid-glass-button` | Hero and navigation contact links, with per-instance SVG filters |
| `animated-number` | Hero statistics and client metrics that roll when the selected client changes |
| `button` | Package toggles, carousel controls, contact and secondary links |
| `marquee` + `marquee.css` | Seamless client-logo track and horizontal poster rows |
| `marquee-3d` | Selected projects poster wall, with two rows moving in opposite horizontal directions |
| `metal-button` | Email enquiry submission and the footer project link |
| `voxel-horizon`, `velaris`, `halftone-flow-hero` | Retained source components; replaced on the page by video backgrounds |

The shared buttons preserve Radix Slot composition and native button/link behavior. Variants use class-variance-authority; styles live in `src/styles/react.css`. Metal-button interaction uses CSS states so it does not replace consumer event handlers.

The contact form opens a WhatsApp message or an email draft for the visitor to send. It does not submit to a backend or store enquiries. The existing Google Analytics measurement ID is retained and loaded only in production, after the initial render.

## Optional React Bits Pro registry

The current video backgrounds need no React Bits license or additional packages. The retained `VoxelHorizon` source is an independently implemented approximation, not the licensed React Bits Pro component.

For future licensed installs, both `@reactbits-starter` and `@reactbits-pro` are configured in `components.json` using an Authorization header that references `REACTBITS_LICENSE_KEY`. Follow the [React Bits installation guide](https://pro.reactbits.dev/docs/installation) to get your license key, then copy `.env.example` to `.env.local` and fill in the value. `.env.local` is ignored by version control. Keep the key unprefixed so Vite does not expose it to the browser.

If you later choose the official [Voxel Arc component](https://pro.reactbits.dev/docs/components/voxel-arc), install it from the project root:

```sh
npx shadcn@latest add @reactbits-starter/voxel-arc-tw
```

On Windows PowerShell, use `npx.cmd` if script execution is disabled. This project currently uses plain CSS, so a future licensed Tailwind component would need styling support or adaptation before use.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome on desktop and an emulated mobile viewport. Set `PLAYWRIGHT_CHANNEL=msedge` to use Microsoft Edge, or install Chrome with `npx playwright install chrome` if needed. Tests cover hydration, themes, packages, testimonials, carousel/modal keyboard controls, form validation, reduced motion and static content without JavaScript. They block analytics and large video downloads; they do not send enquiries. To exercise Vite development mode and Strict Mode, set `E2E_DEV=1` before running browser tests.

The original backup is excluded from production output because Vite builds only the application entry and `public/` assets.
