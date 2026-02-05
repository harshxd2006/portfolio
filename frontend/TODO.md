# TODO: Fix All Errors in Frontend

## 1. Install Missing Dependencies
- [ ] Install react-router-dom
- [ ] Install axios

## 2. Update Type Definitions
- [ ] Add 'isEdited' property to Post type
- [ ] Add 'karma' property to UserStats type
- [ ] Fix implicit any types in api.ts

## 3. Fix Linting Errors
- [x] Remove unused 'error' variables in catch blocks (CommentItem.tsx, CommentSection.tsx)
- [x] Replace explicit 'any' types with proper types (CommentItem.tsx, CommentSection.tsx)
- [x] Add missing useEffect dependencies (CommentSection.tsx)
- [x] Remove useless try/catch wrappers (CommentSection.tsx)
- [x] Remove unused 'error' variables in catch blocks (PostCard.tsx)
- [ ] Remove unused 'error' variables in catch blocks (AuthContext.tsx, Home.tsx, PostDetail.tsx, Profile.tsx)
- [ ] Replace explicit 'any' types with proper types (CreatePost.tsx, Profile.tsx)
- [ ] Fix fast refresh export issues (badge.tsx, button-group.tsx, button.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, toggle.tsx, AuthContext.tsx)
- [ ] Add missing useEffect dependencies (Home.tsx)
- [ ] Remove useless try/catch wrappers (AuthContext.tsx)
- [ ] Fix impure function call in sidebar.tsx (Math.random in render)
- [ ] Remove unused 'postId' parameter in PostDetail.tsx
- [ ] Remove unused 'Flag' import in Profile.tsx

## 4. Test Build and Lint
- [ ] Run npm run build to ensure no TypeScript errors
- [ ] Run npm run lint to ensure no linting errors
- [ ] Run npm run dev to start development server
