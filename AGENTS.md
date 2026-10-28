<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All reads/writes go through `src/lib/data/api.ts` (query options in `queries.ts`); components never import mock data — so the backend can replace mock data in one place.
- Write actions return `MutationResult`; until the backend exists they return `backend_not_connected` and the UI says so — never fake persistence with localStorage.
- Bids always pass through `BidConfirmDialog` (including from the AI assistant) so every bid has an explicit confirmation step.
- App chrome (nav, demo banner) lives in `AppShell`, wrapped around `<Outlet />` in `__root.tsx`.
