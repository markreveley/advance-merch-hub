# Advance Merch Hub

A comprehensive tour management application for music acts, handling merchandise management and event advancing.

## Overview

This application provides two primary functions for music acts:

1. **Merch Management**: Track inventory from your merch management company and tour reports from AtVenu.com
2. **Event Advancing**: Integrate with Master Tour for event advancing, with AI-powered draft generation and status tracking

## Features

### Event Advancing
- View event status from Master Tour (Eventric)
- Track advancing progress by category (Technical, Hospitality, Production)
- Display detailed event information (venue, date, time, type)
- Monitor completion status of advancing items
- Visual progress tracking with real-time updates

### Upcoming Features
- AI-generated advancing drafts
- Two-way sync with Master Tour API
- Guest list management
- Set list integration
- Automated status updates

## Project info

**URL**: https://lovable.dev/projects/db7ec534-e2db-4b1a-bca2-8539080e1670

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/db7ec534-e2db-4b1a-bca2-8539080e1670) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Copy the example environment file and configure your API keys
cp .env.example .env
# Edit .env with your Supabase and Master Tour credentials

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

- **Supabase**: Database and authentication
- **Master Tour API**: Tour management and advancing (see [Master Tour Integration](docs/MASTER_TOUR_INTEGRATION.md))

### Master Tour Setup

See [docs/MASTER_TOUR_INTEGRATION.md](docs/MASTER_TOUR_INTEGRATION.md) for detailed setup instructions.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/db7ec534-e2db-4b1a-bca2-8539080e1670) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
