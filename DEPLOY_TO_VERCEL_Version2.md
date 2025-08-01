# Deploy Your Fullstack App to Vercel

### 1. Prepare your repo

- Ensure your React app is in `/client`
- Move backend API endpoints into `/api` as serverless functions
- Add `vercel.json` to the repo root

### 2. Push to GitHub

- Commit and push all changes to your GitHub repository

### 3. Connect to Vercel

- Go to [vercel.com](https://vercel.com)
- Sign in and “Add New Project”
- Import your GitHub repo

### 4. Set ENV Variables

- In Vercel dashboard, open your project → Settings → Environment Variables
- Add `DATABASE_URL`, `SENDGRID_API_KEY`, etc.

### 5. Deploy!

- Vercel will auto-detect and build your frontend and API routes
- Your site will be live at `https://your-project.vercel.app`

### 6. Update API Calls

- In your React frontend, update API calls to `/api/your-endpoint`

### 7. Database

- Use Supabase, Neon, or Railway to host your Postgres DB
- Get your connection string, set as `DATABASE_URL` in Vercel

---

## Need help migrating specific endpoints or config?  
Just tell me which parts you want converted, and I’ll make the files!