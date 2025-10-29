# StrawberShare Frontend

A simple, flat, dark-mode file sharing interface that displays uploaded files in a YouTube-like grid layout.

## Features

- YouTube-like grid layout for browsing files
- Upload files with public or link-only visibility
- View files with Discord embed support
- Dark mode theme
- Responsive design
- Static HTML/CSS/JS (no build step required)

## Setup

### Local Development

1. Update the backend URL in `config.js`:
```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000'
};
```

2. Open `index.html` in a browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

### GitHub Pages Deployment

1. Create a new repository on GitHub
2. Push the `frontend` folder contents to the repository
3. Go to repository Settings > Pages
4. Set Source to "Deploy from a branch"
5. Select the main/master branch and root folder
6. Save and wait for deployment

**Important:** Update `config.js` with your backend server URL:
```javascript
const CONFIG = {
  API_BASE_URL: 'http://your-laptop-ip:3000'  // Use your laptop's public IP or domain
};
```

### Exposing Your Backend

For the frontend (hosted on GitHub Pages) to communicate with your backend (running on your laptop), you need to:

1. **Port Forward** your router to allow external access to port 3000
2. **Use your public IP** or set up a dynamic DNS service
3. **Alternative:** Use a tunneling service like ngrok:
   ```bash
   ngrok http 3000
   ```
   Then use the ngrok URL in your config.js

## File Visibility

- **Public:** Files appear in the main feed and are accessible to everyone
- **Link Only:** Files don't appear in the feed; only accessible via direct link

## Direct Links

All files get shareable links:
- View page (with embeds): `http://your-backend/view/{file-id}`
- Direct download: `http://your-backend/api/download/{file-id}`

The view pages include OpenGraph and Twitter Card metadata for rich embeds in Discord and other platforms.

## Browser Compatibility

Works in all modern browsers. No build step or transpilation required.
