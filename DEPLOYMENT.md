// docs/DEPLOYMENT.md

# Deployment Guide

This document provides instructions for deploying the Smart Home Management System to different environments.

## Prerequisites

Before deployment, ensure you have the following:

1. Node.js 16.x or later
2. NPM 7.x or later
3. A Supabase project with the required tables (see README.md)
4. Access to your deployment platform (Vercel, Netlify, AWS, etc.)

## Deployment Options

### 1. Vercel Deployment

Vercel is a cloud platform for frontend frameworks and static sites that's perfect for Vue applications.

1. **Sign up and install the Vercel CLI**

```bash
npm install -g vercel
```

2. **Login to Vercel**

```bash
vercel login
```

3. **Prepare your environment variables**

Create a `.env.production` file with your production Supabase credentials.

4. **Deploy to Vercel**

```bash
vercel
```

Follow the prompts to configure your project. Make sure to:

- Set the framework preset to "Vue.js"
- Configure your environment variables

5. **For subsequent deployments**

```bash
vercel --prod
```

### 2. Netlify Deployment

Netlify is another great option for deploying Vue applications.

1. **Install the Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **Login to Netlify**

```bash
netlify login
```

3. **Create a netlify.toml file**

Create a `netlify.toml` file in the root directory with the following content:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

4. **Deploy to Netlify**

```bash
netlify deploy
```

For production deployment:

```bash
netlify deploy --prod
```

### 3. Docker Deployment

For containerized deployment, you can use Docker.

1. **Create a Dockerfile**

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:16-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Create an nginx.conf file**

Create an `nginx.conf` file in the root directory:

```
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. **Build and run the Docker container**

```bash
docker build -t smart-home-app .
docker run -p 8080:80 smart-home-app
```

### 4. Traditional Web Server Deployment

You can also deploy to a traditional web server like Apache or Nginx.

1. **Build the project**

```bash
npm run build
```

2. **Copy the dist folder to your web server**

```bash
scp -r dist/* user@your-server:/path/to/webroot/
```

3. **Configure the web server**

For Nginx, add a configuration like:

```
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/webroot;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

For Apache, ensure you have an `.htaccess` file in your web root with:

```
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## Environment Variables

Ensure your deployment environment has the following environment variables configured:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Post-Deployment Checklist

After deployment, verify:

1. The application loads correctly
2. Authentication works
3. Language switching functions properly
4. RTL layout renders correctly for Hebrew
5. All API calls to Supabase are successful
6. Responsive design works on various device sizes

## Troubleshooting

If you encounter issues after deployment:

1. **Blank page or 404 errors**: Check your routing configuration. Make sure your server is configured to redirect to index.html for client-side routing.

2. **API errors**: Verify your environment variables are correctly set.

3. **CSS or JavaScript not loading**: Check for path issues in your build. Ensure base paths are correctly configured.

4. **Authentication issues**: Check your Supabase authentication settings and ensure CORS is configured correctly.

5. **Console errors**: Open the browser console to check for any JavaScript errors that might be occurring.

## Monitoring and Analytics

Consider implementing:

1. **Error tracking** with Sentry or LogRocket
2. **Performance monitoring** with Google Analytics or similar tool
3. **User behavior analytics** to understand how users interact with your application
