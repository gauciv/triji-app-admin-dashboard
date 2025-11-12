# Triji App Admin Dashboard

A mobile-first responsive web admin dashboard for the Triji mobile app. Built with Vite, React, Tailwind CSS, and Firebase.

## 🚀 Features

- **Authentication**: Firebase Authentication with persistent sessions
- **Dashboard**: Overview with statistics and recent activity
- **Tasks Management**: Create, edit, delete, and filter tasks
- **Announcements Management**: Manage announcements with type categorization
- **Reports Management**: View and manage user reports
- **Users Management**: View and filter registered users
- **Subjects Management**: CRUD operations for subjects
- **Real-time Updates**: Live data synchronization with Firestore
- **Mobile-First Design**: Responsive layout from 320px to 1920px
- **Dark Theme**: Modern dark gradient theme with green accent

## 🛠️ Tech Stack

- **Framework**: Vite + React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Firebase (Firestore + Authentication)
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Firebase project with Firestore and Authentication enabled

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gauciv/triji-app-admin-dashboard.git
   cd triji-app-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

   You can find these values in your Firebase project settings.

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 📦 Build

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚀 Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Add environment variables in Netlify dashboard

## 📁 Project Structure

```
src/
├── components/         # Reusable components
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── ProtectedRoute.jsx
├── contexts/          # React contexts
│   └── AuthContext.jsx
├── pages/             # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Tasks.jsx
│   ├── Announcements.jsx
│   ├── Reports.jsx
│   ├── Users.jsx
│   └── Subjects.jsx
├── config/            # Configuration files
│   └── firebase.js
├── lib/               # Library initialization
│   └── firebase.js
├── App.jsx            # Main app component with routing
├── main.jsx           # App entry point
└── index.css          # Global styles
```

## 🔐 Firebase Collections

The dashboard interacts with these Firestore collections:

- **tasks**: Task management with subject references
- **announcements**: Announcements with types and expiry dates
- **reports**: User-submitted reports
- **users**: Registered users
- **subjects**: Subject/course information

## 🎨 Color Scheme

- Primary: `#22e584` (green accent)
- Background: Dark gradient (`#0f1c2e`, `#162447`, `#121212`)
- Cards: `rgba(28, 34, 47, 0.85)` with green border
- Text: White for headings, `rgba(255, 255, 255, 0.7)` for body

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
