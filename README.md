# nur-notes

A responsive card-based view for content from **nur-cms**. The application uses Vue 3,
Tailwind CSS, and DaisyUI, and supports full-text search, filters by category, tag, and author,
pagination, and light and dark themes. It is built as a PWA and can be installed on supported devices.

## CMS connection

By default, the application requests the API from the same origin. To use a separately running
nur-cms instance, create a `.env.local` file:

```sh
VITE_NUR_CMS_URL=http://localhost:3000
VITE_NUR_NOTE_TYPE=note
VITE_NUR_LOCALE=de
```

`VITE_NUR_NOTE_TYPE` must match the content type slug in the CMS (for example, `article` for
an article installation). The application uses the public endpoints
`/api/content/entries`, `/tags`, `/categories` und `/authors`.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
