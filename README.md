# Elevate Experiences Chef Dashboard

A React-based web app for browsing, filtering, and quoting celebrity chefs for private dining events. Built to streamline client-facing proposals and internal team workflows.

## ✨ Features

- 🔎 **Search & Filters**
  - Search by name, gender, location, or bio keywords
  - Filters for gender, city, party size, and price range

- 🧑‍🍳 **Chef Profiles**
  - Displays headshots, bios, restaurant affiliations, and venue capabilities

- 🧾 **Quote Builder**
  - Add chefs to a personalized quote
  - Sticky “View Quote” button with modal preview
  - Remove chefs or clear all
  - Option to “Email Quote” (opens clean preview in new tab)

- 💡 **Custom Design**
  - Styled with Elevate's brand fonts and colors
  - Responsive and user-friendly UI

## 🛠 Tech Stack

- **React** (Create React App)
- **Google Sheets API** (Data source)
- **Cloudinary** (Image hosting)
- **CSS**
- **Vercel** (Deployment)

## 📦 Installation

```bash
git clone https://github.com/your-username/elevate-chef-dashboard.git
cd elevate-chef-dashboard
npm install
```

Create a `.env` file in the root directory with your credentials:

```env
REACT_APP_SHEET_ID=your_google_sheet_id
REACT_APP_API_KEY=your_google_api_key
```

Start the app locally:

```bash
npm start
```

## 🚀 Deployment

To deploy with **GitHub Pages**:

1. Set `homepage` in `package.json` to your repo URL  
   Example:
   ```json
   "homepage": "https://your-username.github.io/elevate-chef-dashboard"
   ```

2. Then run:

```bash
npm run build
npm run deploy
```

## 📂 Project Structure

```
src/
├── App.js
├── App.css
├── images/
│   └── Logo.png
public/
├── index.html
.env
```

## 📸 Preview

![Chef Dashboard Preview](./public/dashboard-preview.png)

## 📄 License

MIT License — © 2025 Elevate Experiences Leighton Van Ness
