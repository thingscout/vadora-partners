# Vadora Partners — Detailed Setup Guide

## What You're Building

A mobile-friendly web app (PWA) where your Vadora Beauty Partners can:
- Log in with email OTP or password
- See their dashboard, orders, earnings, customers
- Share their referral/discount code via WhatsApp
- Track commission payouts

The app runs on three free services:
- **Supabase** — your database + user login system (free tier: 50,000 users, 500MB)
- **Vercel** — hosts your website (free tier: unlimited)
- **GitHub** — stores your code with version history (free: private repos)

**Total cost: ₹0/month** (until you add a custom domain, which is ~₹800-1500/year)

---

## PART 1: Prerequisites (One-Time Setup)

### 1.1 Create Accounts

You need accounts on these 3 services. All are free.

**GitHub (code storage)**
1. Go to https://github.com
2. Click "Sign up" → use your email → create username and password
3. Verify your email

**Supabase (database)**
1. Go to https://supabase.com
2. Click "Start your project" → Sign in with GitHub (use the account you just created)
3. You'll land on the Supabase dashboard

**Vercel (hosting)**
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### 1.2 Install Node.js on Your Computer

Node.js is needed to run the app on your computer during development.

**Windows:**
1. Go to https://nodejs.org
2. Download the **LTS** version (the big green button)
3. Run the installer → click Next through everything → Install
4. Open Command Prompt (search "cmd" in Start menu)
5. Type `node --version` and press Enter — you should see something like `v20.x.x`
6. Type `npm --version` — you should see a number like `10.x.x`

**Mac:**
1. Go to https://nodejs.org → download LTS
2. Open the .pkg file → install
3. Open Terminal (search "Terminal" in Spotlight)
4. Type `node --version` → should show `v20.x.x`

### 1.3 Install a Code Editor

You'll need this to edit code files.

1. Download VS Code from https://code.visualstudio.com
2. Install it
3. Open it — this is where you'll edit your app files

### 1.4 Install Git

Git tracks your code changes and connects to GitHub.

**Windows:**
1. Download from https://git-scm.com/download/win
2. Run installer → keep all defaults → Install
3. Open Command Prompt → type `git --version` → should show a version number

**Mac:**
1. Open Terminal → type `git --version`
2. If not installed, it will prompt you to install Xcode Command Line Tools → click Install

---

## PART 2: Create TWO Supabase Projects

You need **two separate** Supabase projects — one for development (testing) and one for production (live app). This is what keeps your live app safe while you make changes.

### 2.1 Development Project

1. Go to https://supabase.com/dashboard
2. Click the green **"New Project"** button
3. Fill in:
   - **Organization**: Select your default org (or create one called "Vadora")
   - **Name**: `vadora-partners-dev`
   - **Database Password**: Create a strong password → **SAVE THIS PASSWORD** somewhere safe (you'll need it later if you want direct database access)
   - **Region**: Select **South Asia (Mumbai)** — closest to your users
   - **Pricing Plan**: Free
4. Click **"Create new project"**
5. Wait 1-2 minutes for it to set up

### 2.2 Production Project

1. Click the Supabase logo (top-left) to go back to dashboard
2. Click **"New Project"** again
3. Fill in:
   - **Name**: `vadora-partners-prod`
   - **Database Password**: A DIFFERENT strong password → **SAVE THIS TOO**
   - **Region**: South Asia (Mumbai)
   - **Pricing Plan**: Free
4. Click **"Create new project"**
5. Wait for setup

You should now see TWO projects in your Supabase dashboard.

### 2.3 Run Database Schema (for EACH project)

You need to create all the tables in both projects. Do this for **dev first**, then **prod**.

1. Click on your **`vadora-partners-dev`** project
2. In the left sidebar, click **"SQL Editor"** (it has a terminal/code icon)
3. Click **"New query"** (top-right)
4. Open the file `schema.sql` from the project folder in your code editor
5. **Select ALL** the text (Ctrl+A / Cmd+A) and **Copy** (Ctrl+C / Cmd+C)
6. Go back to Supabase → **Paste** into the SQL editor
7. Click the green **"Run"** button (or Ctrl+Enter)
8. You should see "Success. No rows returned" — this is correct!

**Verify the tables were created:**
1. In the left sidebar, click **"Table Editor"**
2. You should see these tables listed:
   - `commission_tiers` (with 3 rows: Bronze, Silver, Gold)
   - `partners` (empty)
   - `referral_orders` (empty)
   - `payouts` (empty)
   - `notifications` (empty)

3. Click on `commission_tiers` → verify you see Bronze (8%), Silver (10%), Gold (12%)

**Now repeat steps 1-7 for your `vadora-partners-prod` project.**

### 2.4 Enable Email Authentication (for EACH project)

1. Select your **dev** project
2. In the left sidebar, click **"Authentication"**
3. Click **"Providers"** tab at the top
4. Find **"Email"** in the list → click to expand
5. Make sure these are enabled:
   - **Enable Email Signup**: ON ✓
   - **Enable Email OTP / Magic Link**: ON ✓
   - **Confirm email**: For development, you can turn this **OFF** (makes testing easier). For production, keep it **ON**
6. Click **"Save"**

**Repeat for your prod project.** (For prod, keep "Confirm email" ON.)

### 2.5 Copy Your API Keys

You need two values from each project: the URL and the anon key.

**For your DEV project:**
1. Select `vadora-partners-dev`
2. Click **"Project Settings"** (gear icon at bottom of left sidebar)
3. Click **"API"** in the settings sidebar
4. You'll see:
   - **Project URL**: Something like `https://abcdef123456.supabase.co` — **copy this**
   - **Project API keys → anon public**: A long string starting with `eyJ...` — **copy this**
5. Save these somewhere labeled as "DEV URL" and "DEV ANON KEY"

**For your PROD project:**
1. Switch to `vadora-partners-prod`
2. Same steps → copy URL and anon key
3. Save labeled as "PROD URL" and "PROD ANON KEY"

**You should now have 4 values saved:**
```
DEV URL:       https://xxxxxx.supabase.co
DEV ANON KEY:  eyJhbG...
PROD URL:      https://yyyyyy.supabase.co
PROD ANON KEY: eyJhbG...
```

---

## PART 3: Set Up the App on Your Computer

### 3.1 Unzip the Project

1. Download the `vadora-partners-v2.zip` file
2. Unzip it to a folder you can find easily:
   - **Windows**: Right-click → "Extract All" → Choose Desktop or Documents
   - **Mac**: Double-click the zip file
3. You should see a folder called `vadora-partners` with all the code files inside

### 3.2 Open in VS Code

1. Open VS Code
2. File → Open Folder → Navigate to `vadora-partners` → Select Folder
3. You'll see all the files in the left sidebar

### 3.3 Configure Your Development Environment

1. In VS Code, find the file `.env.local.example`
2. Right-click it → Rename → change to `.env.local`
3. Open it and replace the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-DEV-anon-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

**Use your DEV credentials here, NOT production.**

### 3.4 Install Dependencies and Run

1. Open Terminal in VS Code: View → Terminal (or Ctrl+`)
2. Type these commands one by one:

```bash
npm install
```
Wait for it to finish (might take 1-2 minutes, you'll see a progress bar).

```bash
npm run dev
```

3. You'll see output like:
```
  ▲ Next.js 14.2.x
  - Local: http://localhost:3000
  ✓ Ready
```

4. Open your browser → go to `http://localhost:3000`
5. You should see the Vadora Partners landing page! 🎉

### 3.5 Test the Registration Flow

1. Click "Create Account"
2. Fill in Step 1 with test data (any name, valid email you own, password with 6+ chars)
3. Go through all 4 steps
4. You'll land on the "Under Review" page — this is correct!

**Now approve yourself manually:**
1. Go to Supabase dashboard → your DEV project
2. SQL Editor → New Query → paste and run:
```sql
UPDATE partners
SET status = 'approved', is_active = true
WHERE email = 'the-email-you-used@example.com';
```
3. Go back to the app → Sign Out → Log In again
4. You should see the Dashboard! 🎉

### 3.6 Add Test Data

To see sample orders and data on the dashboard:

1. In Supabase SQL Editor, run:
```sql
-- Find your partner ID
SELECT id, name FROM partners;

-- Copy the UUID from the result, then use it below:
-- Replace 'YOUR-PARTNER-ID-HERE' with the actual UUID

INSERT INTO referral_orders
  (partner_id, order_ref, customer_name, order_amount, commission_rate, commission_amount, status, order_date)
VALUES
  ('YOUR-PARTNER-ID-HERE', 'ORD-1001', 'Neha Patel',   2800, 10, 280, 'shipped', now() - interval '1 day'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1002', 'Priya Sharma',  1500, 10, 150, 'delivered', now() - interval '5 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1003', 'Anita Gupta',   3200, 10, 320, 'commission_eligible', now() - interval '9 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1004', 'Ritu Singh',    1800, 10, 180, 'confirmed', now() - interval '15 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1005', 'Kavya Reddy',    950, 10,  95, 'delivered', now() - interval '20 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1006', 'Neha Patel',    2200, 10, 220, 'commission_eligible', now() - interval '30 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1007', 'Priya Sharma',  1700, 10, 170, 'commission_eligible', now() - interval '45 days'),
  ('YOUR-PARTNER-ID-HERE', 'ORD-1008', 'Neha Patel',    1400, 10, 140, 'commission_eligible', now() - interval '60 days');

-- Add some notifications
INSERT INTO notifications (partner_id, type, title, message)
VALUES
  ('YOUR-PARTNER-ID-HERE', 'order', 'New order from Neha Patel', 'Order #ORD-1001 for ₹2,800'),
  ('YOUR-PARTNER-ID-HERE', 'commission', 'Commission credited: ₹320', 'From order #ORD-1003'),
  ('YOUR-PARTNER-ID-HERE', 'payout', 'Payout processed: ₹500', 'Transferred to your bank account');
```

2. Refresh the app in your browser → you should see data on all tabs!

---

## PART 4: Push Code to GitHub

### 4.1 Create a GitHub Repository

1. Go to https://github.com → click **"+"** (top-right) → **"New repository"**
2. Fill in:
   - **Repository name**: `vadora-partners`
   - **Description**: Vadora Beauty Partner App
   - **Visibility**: **Private** (important — your code has no secrets, but keep it private anyway)
   - Do NOT check "Add a README" or ".gitignore" (our project already has these)
3. Click **"Create repository"**
4. You'll see a page with setup instructions — keep this open

### 4.2 Push Your Code

Open Terminal in VS Code (inside the `vadora-partners` folder):

```bash
# Initialize git in your project
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial VBP app v2"

# Connect to GitHub (use the URL from step 4.1)
git remote add origin https://github.com/YOUR-USERNAME/vadora-partners.git

# Push code
git branch -M main
git push -u origin main
```

It may ask for your GitHub username and password. If it asks for a password, you need a **Personal Access Token** instead:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate New Token → give it "repo" access → Generate
3. Copy the token and use it as your password

After push, refresh your GitHub repository page — you should see all your files!

---

## PART 5: Deploy to Vercel (Live App)

### 5.1 Import Your Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. You'll see your GitHub repositories → find **`vadora-partners`** → click **"Import"**
4. **Framework Preset**: Should auto-detect "Next.js" — if not, select it
5. **Root Directory**: Leave as `./ ` (default)

### 5.2 Add Production Environment Variables

Before deploying, you need to add your PRODUCTION Supabase credentials.

1. Expand **"Environment Variables"** section
2. Add these one by one (click "Add" after each):

| Name (Key)                     | Value                           |
|-------------------------------|---------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Your **PROD** Supabase URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Your **PROD** Supabase anon key |
| `NEXT_PUBLIC_APP_URL`          | `https://vadora-partners.vercel.app` (will update after deploy) |
| `NEXT_PUBLIC_ENV`              | `production`                    |

3. Click **"Deploy"**
4. Wait 1-3 minutes for the build

### 5.3 Your App is Live!

After deployment, Vercel gives you a URL like:
`https://vadora-partners.vercel.app`

Open it in your browser — your app is live on the internet! 🎉

### 5.4 Add Custom Domain (Optional)

If you want `partners.vadorabeauty.com`:
1. In Vercel → your project → **Settings** → **Domains**
2. Type `partners.vadorabeauty.com` → click **Add**
3. Vercel shows you DNS records to add
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Add the DNS records Vercel tells you (usually a CNAME record)
6. Wait 5-30 minutes for DNS to propagate
7. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your custom domain

---

## PART 6: The Dev → Production Workflow

**This is the most important part.** This is how you make changes without breaking the live app.

### The Golden Rule

```
┌─────────────────────────┐
│  .env.local (your PC)   │ → DEV Supabase (test data)
│  localhost:3000          │
└─────────┬───────────────┘
          │ git push
          ▼
┌─────────────────────────┐
│  GitHub                  │ → stores your code
└─────────┬───────────────┘
          │ auto-deploy on merge to main
          ▼
┌─────────────────────────┐
│  Vercel                  │ → PROD Supabase (real data)
│  vadora-partners.vercel  │
└─────────────────────────┘
```

- Your computer ALWAYS connects to the DEV database
- Vercel ALWAYS connects to the PROD database
- You never put PROD credentials in `.env.local`

### Making a Change: Step by Step

**Example: You want to add a new feature or fix something.**

```bash
# Step 1: Make sure you have the latest code
git checkout main
git pull origin main

# Step 2: Create a new branch for your change
git checkout -b fix/update-whatsapp-number
# (Branch names: feature/xxx for new features, fix/xxx for fixes)

# Step 3: Make your changes in VS Code
# Edit the files you need to change

# Step 4: Test locally
npm run dev
# Open localhost:3000 and test your changes
# This uses your DEV database — no real partner data is affected

# Step 5: When happy with the changes, save to git
git add .
git commit -m "Update WhatsApp support number"

# Step 6: Push to GitHub
git push origin fix/update-whatsapp-number

# Step 7: Create a Pull Request on GitHub
# Go to github.com/your-repo → you'll see a yellow banner
# "fix/update-whatsapp-number had recent pushes"
# Click "Compare & pull request"
# Add a title describing the change → Click "Create pull request"

# Step 8: Merge to main
# Review the changes → Click "Merge pull request" → "Confirm merge"

# Step 9: Vercel auto-deploys!
# Within 1-2 minutes, your live app has the update
```

### Quick Change (Small Fix)

For tiny changes (typo fix, number change), you can skip the branch:

```bash
# Edit the file
# Then:
git add .
git commit -m "Fix typo in ShareTab"
git push origin main
# Vercel auto-deploys in 1-2 minutes
```

### Database Changes

If you need to add a new table or column:

1. Write the SQL change
2. Test it in your **DEV** Supabase SQL Editor first
3. Once it works, run the same SQL in your **PROD** Supabase SQL Editor
4. Update your code to use the new column/table
5. Push to GitHub → Vercel deploys

---

## PART 7: Before Going Live Checklist

Before real partners use the app, update these:

### 7.1 Update Contact Information

Open `components/tabs/ProfileTab.tsx` and update:
```
Line with "wa.me/919999999999" → your real WhatsApp number
Line with "support@vadorabeauty.com" → your real email
Line with "tel:+919999999999" → your real phone number
```

### 7.2 Update Shop Link

Open `components/tabs/ShareTab.tsx` and update:
```
const shopLink = "https://vadorabeauty.com";
→ Change to your actual Shopify store URL
```

### 7.3 Supabase Auth Settings (Production)

1. Go to your PROD Supabase project
2. Authentication → Email Templates
3. Customize the OTP email template with your brand:
   - Subject: "Your Vadora Partners Login Code"
   - Body: Include your brand name and the OTP code
4. Authentication → URL Configuration
   - Site URL: your Vercel URL or custom domain

### 7.4 Add PWA Icons

Create two PNG images of the Vadora "V" logo:
- `icon-192.png` (192×192 pixels)
- `icon-512.png` (512×512 pixels)
- Place them in the `public/` folder

---

## PART 8: Understanding the Code Structure

If you need to make changes, here's where to find things:

### "I want to change the app colors"
→ Open `tailwind.config.js` → edit the `colors.brand` section

### "I want to change what's shown on the dashboard"
→ Open `components/tabs/HomeTab.tsx`

### "I want to change order statuses"
→ Open `lib/utils.ts` → edit `ORDER_STATUS_CONFIG`
→ Open `types/index.ts` → edit `OrderStatus` type

### "I want to add a new tab"
1. Create `components/tabs/NewTab.tsx`
2. Add it to `components/layout/DashboardLayout.tsx` (import + render)
3. Add a nav item in `components/ui/BottomNav.tsx`
4. Add the tab ID to `types/index.ts` → `TabId` type

### "I want to change the registration form"
→ Open `components/layout/RegisterPage.tsx`

### "I want to change commission tiers"
→ Run SQL in Supabase: `UPDATE commission_tiers SET rate_percent = 15 WHERE name = 'Gold';`

### "I want to change the legal text"
→ Open `components/tabs/ProfileTab.tsx` → find `LEGAL_PAGES` array

---

## PART 9: Troubleshooting

### "npm install gives errors"
→ Make sure Node.js is v18+: `node --version`
→ Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### "I see a blank page on localhost:3000"
→ Check the Terminal for error messages
→ Make sure `.env.local` exists and has the correct Supabase URL/key
→ Make sure you're in the right folder when running `npm run dev`

### "I can register but can't see the dashboard"
→ The partner needs to be approved. Run this SQL in your DEV Supabase:
```sql
UPDATE partners SET status = 'approved', is_active = true
WHERE email = 'the-email@example.com';
```

### "RLS policy error / permission denied"
→ The `auth_user_id` in the partners table needs to match the logged-in user's ID
→ Check: Go to Supabase → Authentication → Users → find the user → copy their UUID
→ Then: `UPDATE partners SET auth_user_id = 'that-uuid' WHERE email = '...';`

### "Changes not showing on live app"
→ Check: Did you push to the `main` branch?
→ Check Vercel dashboard → Deployments → is there a recent deployment?
→ Clear browser cache (Ctrl+Shift+R)

### "Login OTP not arriving"
→ Check Supabase → Authentication → check if the email is in the users list
→ Check spam folder
→ For dev: disable email confirmation in Auth settings so you don't need to verify

### "Can't push to GitHub"
→ Make sure you set up your GitHub credentials:
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```
→ If password is rejected, use a Personal Access Token (see Part 4.2)

---

## PART 10: What's Coming Next

These features will be added as future updates (each as a new branch → test → merge):

1. **Admin Portal** — Web dashboard for you to approve/reject partners, view all orders, manage tiers
2. **Shopify Integration** — When a customer uses a partner's code on your Shopify store, the order automatically appears in the partner's app
3. **Phone OTP** — SMS-based login (adds cost via Twilio/MSG91)
4. **Push Notifications** — Notify partners of new orders instantly
5. **Product Catalogue** — Show your products in the Share tab so partners can share specific products
6. **Create Order** — Manually create orders for offline/WhatsApp sales

---

**Need help?** Open an issue on your GitHub repository or contact your developer.
