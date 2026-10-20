# SETUP COMMANDS — QR Attendance App

> **Target:** First-year students | **Expo SDK:** 54 | **Expo Go:** 54.0.8

---

## PREREQUISITES

| Tool | Download | Verify |
|---|---|---|
| Node.js (LTS) | https://nodejs.org/en | `node --version` |
| VS Code | https://code.visualstudio.com | (open it) |
| Expo Go 54.0.8 | Play Store → "Expo Go" | (version in app settings) |

---

## STEP 1 — Create the App

```powershell
cd D:\QR-ATT
npx create-expo-app@latest qr-att

# When prompted, select "SDK 54"
# Wait for npm install (~2 min)
```

---

## STEP 2 — Install Matching Versions

The default install may need these fixed versions that match Expo Go 54.0.8:

```powershell
npm install expo@~54.0.35 react@19.1.0 react-native@0.81.5 expo-router@~6.0.24 @expo/vector-icons@^15.0.3 expo-linking@~8.0.12 expo-constants@~18.0.13 expo-font@~14.0.12 expo-status-bar@~3.0.9 expo-splash-screen@~31.0.13 react-native-screens@~4.16.0 react-native-safe-area-context@~5.6.0 react-native-gesture-handler@~2.28.0 react-native-reanimated@~4.1.1 react-dom@19.1.0 react-native-web@~0.21.0 @types/react@~19.1.0 typescript@~5.9.2 --legacy-peer-deps
```

---

## STEP 3 — Start

```powershell
npx expo start
```

Scan QR code with Expo Go. Or press `W` for web.

---

## TROUBLESHOOTING

| Problem | Solution |
|---|---|
| npm install fails | Use `npm install --legacy-peer-deps` |
| App crashes in Expo Go | Make sure all versions match STEP 2 exactly |
| QR won't scan | Phone + computer on same WiFi |
| White screen | Wait 10s, or shake → Reload |
| TypeScript errors | Run `npx tsc --noEmit` |

---

## AUTHENTICATION AND ADMINISTRATOR

The app supports email/password registration, sign-in, sign-out, and persisted Supabase
sessions. New public registrations are student accounts. Teachers and administrators
must be assigned by an existing administrator or through the Supabase SQL editor.

To configure the first administrator:

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Register the account that should administer the app and confirm its email if required.
3. Run this query in the Supabase SQL editor, replacing the email:

   ```sql
   update public.profiles
   set role = 'admin', updated_at = now()
   where email = 'admin@school.edu';
   ```

4. Sign out and sign in again, then open the Admin tab.

Administrators can manage profile names and roles, create/edit/delete events, view
attendance totals and recent records, and correct or remove attendance records.
Database row-level security enforces administrator access; hiding the Admin tab is
only a navigation convenience, not the authorization boundary.
