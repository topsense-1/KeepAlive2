// README.md

# Smart Home Management System

A comprehensive management system for smart homes built with Vue 3 + Quasar 2, featuring multi-language support, responsive design, and Supabase integration.

## Features

- **Dashboard**: Overview of all houses with status indicators and recent events
- **House Management**: Interactive floorplan view with sensor placement and status
- **Houses Administration**: CRUD operations for managing houses and sensors
- **User Management**: Role-based access control with detailed permissions
- **Multi-language Support**: English and Hebrew (RTL) languages
- **Authentication**: Secure login with role-based access control
- **Support Interface**: FAQ, video tutorials, and contact information

## Technology Stack

- **Frontend**: Vue 3 + Quasar 2 (using Composition API with `<script setup>`)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Internationalization**: Vue I18n
- **Backend**: Supabase (Database, Authentication, Storage)
- **Build Tool**: Vite

## Requirements

- Node.js 16.x or later
- NPM 7.x or later
- A Supabase project (for backend functionality)

## Project Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/smart-home-management.git
cd smart-home-management
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Run the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Building for Production

```bash
npm run build
```

The build artifacts will be in the `dist` directory.

## Supabase Setup

This application requires a Supabase project with the following tables:

### Houses

```sql
CREATE TABLE houses (
  id SERIAL PRIMARY KEY,
  number VARCHAR(100) NOT NULL,
  resident VARCHAR(255) NOT NULL,
  client_id VARCHAR(100) NOT NULL,
  installation_date DATE NOT NULL,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_sensors INTEGER DEFAULT 0,
  total_sensors INTEGER DEFAULT 0
);
```

### Sensors

```sql
CREATE TABLE sensors (
  id SERIAL PRIMARY KEY,
  house_id INTEGER REFERENCES houses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  signal_strength INTEGER NOT NULL DEFAULT 100,
  battery INTEGER NOT NULL DEFAULT 100,
  position_x INTEGER,
  position_y INTEGER,
  light_level VARCHAR(20),
  temperature NUMERIC(5,2),
  humidity NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Events

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  house_id INTEGER REFERENCES houses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  sensor VARCHAR(100),
  priority VARCHAR(20) NOT NULL DEFAULT 'Informative',
  datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'Family Member',
  avatar VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Houses

```sql
CREATE TABLE user_houses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  house_id INTEGER REFERENCES houses(id) ON DELETE CASCADE,
  UNIQUE(user_id, house_id)
);
```

### User Permissions

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, permission_id)
);
```

## Authentication

For the demo, use these credentials:

- **Username**: admin
- **Password**: admin
- **Client ID**: (any value)

## Multi-language Support

The application supports both English and Hebrew languages. The language can be changed from the top bar dropdown. Hebrew is fully supported with RTL (Right-to-Left) layout.

## License

MIT// src/quasar-variables.sass
$primary   : #1976D2
$secondary : #26A69A
$accent : #9C27B0

$dark : #1D1D1D

$positive  : #21BA45
$negative : #C10015
$info      : #31CCEC
$warning : #F2C037// .env.development
VITE_SUPABASE_URL=https://your-dev-supabase-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-supabase-anon-key// .env
VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
plugins: [
vue({
template: { transformAssetUrls }
}),
quasar({
sassVariables: 'src/quasar-variables.sass'
})
],
resolve: {
alias: {
'@': fileURLToPath(new URL('./src', import.meta.url))
}
}
})
