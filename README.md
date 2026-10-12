# HealthVault

HealthVault keeps your medical records in one place on your phone: prescriptions, lab reports, scans, discharge summaries, and insurance papers. The app encrypts each document on the phone before it sends anything. The server stores your data but cannot read it.

Encrypted files go to the public IPFS network through Pinata. Accounts and a small encrypted index go to Neon (Neon Auth and Postgres). Your keys stay on your phone. If you get a new phone, your recovery key opens the vault again.

```
Phone ──encrypt (XChaCha20-Poly1305)──▶ /api/documents ──pin──▶ IPFS (Pinata, public network)
  │                                          │
  │  master key in Keychain/Keystore         └──▶ Neon Postgres: CID + wrapped key + encrypted metadata
  └── recovery key (kept by the user) unlocks the vault on a new device
```

## What you need

- Node.js 22 or later
- A [Neon](https://neon.com) project with Auth turned on
- A [Pinata](https://pinata.cloud) account
- A phone with a development build, or Expo Go. The app uses native modules (SecureStore and the file system), so the web build does not work for real use.

## Set up

1. In the Neon Console, open your project and turn on **Auth**. Go to Settings → Better Auth. Turn on **Sign-up and Sign-in with Email** and **Email OTP**. If you want email verification, also turn on *Verify at sign-up → Verification code*.
2. In Pinata, make an API key with the `org:files:write` scope. Copy its JWT.
3. Copy the example environment file and fill in `DATABASE_URL`, `NEON_AUTH_URL`, and `PINATA_JWT`:

   ```sh
   cp .env.example .env
   ```

4. Install the packages and create the tables. You can run the migration again at any time; it does not change tables that exist.

   ```sh
   npm install
   npm run db:migrate
   ```

5. Start the app. The same dev server also serves the API routes.

   ```sh
   npx expo start
   ```

## Deploy

The API routes deploy to EAS Hosting:

```sh
npx expo export --platform web
eas deploy
```

After the first deploy:

1. Add the server environment variables in EAS Hosting. `NEON_AUTH_ORIGIN` is required in production.
2. Set `EXPO_PUBLIC_API_URL` to the deployed origin before you build the app.
3. In the Neon Console, add the same origin under Auth → Domains.
4. Set up your own SMTP provider in Neon Auth. The shared sender has a low rate limit, so sign-up emails will stop under real traffic.

## How your data is protected

The app makes a random 32-byte master key the first time you sign in. It also shows you a recovery key, one time only. Write it down. HealthVault cannot reset it, and nobody can open your vault without it if you lose your phone.

| Secret | Where it is stored | Who can read it |
|---|---|---|
| Master key (32 bytes) | SecureStore on the device (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) | This device only |
| Recovery key (160 bits) | Written down by you | You only |
| Wrapped master key | Neon `vault_keys` | Nobody without the recovery key |
| Document key (one per document) | Neon `vault_documents.wrapped_key`, wrapped by the master key | Nobody without the master key |
| File contents | IPFS (public) | Anyone can download them; nobody can decrypt them |
| Title, category, notes, date | Neon, encrypted with the document key | You only |
| Profile | Neon `vault_profiles`, encrypted with the master key | You only |

Every sealed value has the form `nonce(24) ‖ ciphertext ‖ tag`, with an associated-data label for its purpose. Because of the label, a value of one kind cannot replace a value of another kind. The details are in `src/lib/crypto.ts`.

When you delete a document, the server deletes its wrapped key and unpins the file. Other IPFS nodes can keep a cached copy for some time, but without the key that copy is useless.

The app also locks itself. You set a 4-digit PIN during set-up, and the app asks for it every time it comes back from the background. When the vault locks, the app deletes all decrypted files from its cache.

## API

All routes are in `src/app/api`. Server-only code is in `src/server`, and the app screens never import it.

Routes marked 🔒 need the header `Authorization: Bearer <accessToken>`. The access token is an EdDSA JWT from Neon Auth that expires after 15 minutes. The server checks it against the Neon Auth JWKS. The app gets a new one before the old one expires.

| Method and path | Body | Returns |
|---|---|---|
| `POST /api/auth/sign-up` | `{email, password, name}` | `200 {status:"signed_in", sessionToken, accessToken, user}`, or `202 {status:"verification_required"}` |
| `POST /api/auth/sign-in` | `{email, password}` | Same as sign-up |
| `POST /api/auth/otp/send` | `{email, type: "sign-in" \| "email-verification" \| "forget-password"}` | `{sent:true}` |
| `POST /api/auth/otp/sign-in` | `{email, otp}` | Session |
| `POST /api/auth/verify-email` | `{email, otp}` | Session, or `202` |
| `POST /api/auth/reset-password` | `{email, otp, password}` | `{reset:true}` |
| `POST /api/auth/token` | `{sessionToken}` | `{accessToken, user}` |
| `POST /api/auth/sign-out` | `{sessionToken}` | `{signedOut:true}` |
| `GET /api/vault/key` 🔒 | | `{wrappedMasterKey \| null, keyVersion}` |
| `PUT /api/vault/key` 🔒 | `{wrappedMasterKey, replace?}` | `{keyVersion}`, or `409 KEY_EXISTS` if a key exists and `replace` is not set |
| `GET/PUT /api/vault/profile` 🔒 | `{encryptedProfile}` | |
| `GET /api/documents` 🔒 | | `{documents: [...]}`, newest first |
| `POST /api/documents` 🔒 | multipart: `file` (ciphertext), `wrappedKey`, `encryptedMetadata` | `201 {document}` (25 MB maximum) |
| `GET /api/documents/:id` 🔒 | | `{document}` |
| `PATCH /api/documents/:id` 🔒 | `{encryptedMetadata}` | `{document}` |
| `DELETE /api/documents/:id` 🔒 | | `{deleted:true}`, and the file is unpinned from IPFS |

Errors always have the form `{error: {code, message}}`. The server writes every key change and every document create, read, update, and delete to `vault_audit_log`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Starts the Expo dev server and the API routes |
| `npm run android` / `npm run ios` | Starts the dev server and opens the app on a device or emulator |
| `npm run lint` | Runs ESLint with the Expo config |
| `npm run db:migrate` | Applies `db/schema.sql` to the database in `DATABASE_URL` |
