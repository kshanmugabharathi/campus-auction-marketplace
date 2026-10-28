# CampusBid Marketplace

Build a responsive full-stack-ready web application called CampusBid, a student-only campus auction marketplace where graduating students auction their used items to juniors.

Tech stack: React, TypeScript, Vite, Tailwind CSS, and reusable components. Prepare the project for later Supabase integration.

Design:

Modern, polished college marketplace.

Clean white background with deep navy and indigo accents.

Clear typography, rounded cards, attractive item photos, responsive layouts.

Desktop and mobile support.

Use realistic Indian college marketplace data with prices in ₹.

Avoid generic landing-page-only designs.

Create these pages:

Home/marketplace: search bar, category filters, featured auctions, recently listed items, closing-soon items.

Browse auctions: keyword search and filters for category, condition, price range, and closing soon.

Auction details: item photos, description, seller information, condition, starting price, minimum bid increment, current leading bid, bid history, live countdown, bid form, questions and answers.

Create listing: title, category, description, condition, multiple photos, starting price, minimum increment, closing date and time.

Edit listing and seller dashboard: active auctions, edit/cancel controls, closed auctions, provisional winners, approve/reject winning prices, and sale outcomes.

Buyer dashboard: active bids, won auctions, saved searches, automatic bidding limits, and notifications.

AI assistant tab: conversational search for items and a clear confirmation step before any bid.

Login and signup pages.

Create reusable components for auction cards, price displays, countdowns, filters, forms, dialogs, and navigation.

Use mock data initially. Keep components and data-access logic separate so mock data can later be replaced by Supabase. Make the main navigation and page transitions work. Do not pretend mock interactions are real backend operations. Do not implement authentication or bidding with local storage as a substitute for the real backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c9008df-5b0a-501d-93ae-98a50feea8a3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
