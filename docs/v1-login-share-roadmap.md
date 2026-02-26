# EggHunt V1 Roadmap (Post V0 Launch)

V1 is intentionally deferred until V0 mobile gameplay quality is validated.

## Scope

1. Account auth:
   - Email/password
   - Google sign-in
2. Cloud save:
   - Save hunt scenes to backend
   - Load own hunt scenes
3. Share and inbox:
   - Share hunt to friend account
   - Friend receives inbox item and can open/play
4. Access control:
   - Private/public visibility
   - Recipient-only access for private share

## Planned data interfaces

- `AuthUser { id, email, provider, displayName }`
- `HuntScene { id, ownerId, theme, eggs[], props[], createdAt, visibility }`
- `ShareMessage { id, fromUserId, toUserId, huntId, status, sentAt }`

## Planned API endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`
- `POST /hunts`
- `GET /hunts/:id`
- `GET /hunts?owner=me`
- `POST /shares`
- `GET /inbox`
- `POST /inbox/:id/accept`

## Entry criteria to begin V1

1. V0 crash-free rate >= 99%.
2. Stable first-session completion and replay metrics.
3. No major mobile interaction bugs in drag/transform/find loops.
