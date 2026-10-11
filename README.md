# watered

Frontend for tracking when plants and trees were last watered.

## Frontend

The React and TypeScript application is in [`frontend/`](./frontend/), built with Vite, Tailwind CSS, and DaisyUI.

```sh
cd frontend
npm install
npm run dev
```

Verify the production build and lint:

```sh
npm run build
npm run lint
```

The current plant inventory and theme preference are stored in this browser's local storage. Plant records are not synchronized or backed up, and no backend or database is used yet.
