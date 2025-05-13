# DADA Board

<!-- Trigger clean build for Vercel -->

A real-time collaborative message board inspired by Dadaist art and poetry. Built with React, Vite, and Supabase.

## Features

- Real-time message updates
- Dadaist-inspired typography with Merzh effect
- Image upload support
- Responsive design
- Dark mode

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase (Database & Real-time)
- Vercel (Deployment)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Hiplooff/dada_board.git
cd dada_board
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

This project is configured for deployment on Vercel. The deployment process is automated through GitHub integration.

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## License

MIT
