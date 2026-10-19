# 🍽️ CookZenix AI — Full Stack Food Recipes Website

A premium, full-stack food recipes web application built for a college full-stack development project.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| Backend | Node.js + Express.js |
| Database | SQLite (via `better-sqlite3`) — zero config |
| Auth | JWT + bcryptjs |
| Chatbot | FoodieBot — Rule-based + optional OpenAI GPT |
| Fonts | Playfair Display + Nunito (Google Fonts) |
| Icons | Font Awesome 6 |

---

## 📁 Project Structure

```
food-recipes/
├── backend/
│   ├── .env                  ← 🔑 Put your OpenAI API key here
│   ├── server.js             ← Express server entry point
│   ├── db.js                 ← SQLite setup + 15 pre-seeded recipes
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js           ← JWT middleware
│   └── routes/
│       ├── auth.js           ← Register / Login / Profile
│       ├── recipes.js        ← Recipe CRUD + Comments
│       ├── favorites.js      ← Save/remove favorites
│       └── chatbot.js        ← FoodieBot AI endpoint
│
└── frontend/
    ├── index.html            ← 🏠 Home page
    ├── signin.html           ← 🔐 Sign In
    ├── signup.html           ← 📝 Sign Up
    ├── recipes.html          ← 🍽️ Browse all recipes
    ├── recipe-detail.html    ← 📖 Single recipe view
    ├── add-recipe.html       ← ➕ Add / Edit recipe
    ├── profile.html          ← 👤 User profile & favorites
    ├── css/
    │   └── style.css         ← 3700+ lines design system
    └── js/
        ├── main.js           ← Shared: auth, API, navbar, toast
        ├── auth.js           ← Sign in / sign up logic
        ├── recipes.js        ← Recipe listing + filters
        ├── recipe-detail.js  ← Detail page logic
        ├── add-recipe.js     ← Multi-step add form
        ├── profile.js        ← Profile page logic
        └── chatbot.js        ← FoodieBot widget
```

---

## ⚙️ Setup & Run

### Step 1 — Start the Backend

```bash
cd backend
npm install      # first time only
node server.js
```

The backend runs at: **http://localhost:5000**

### Step 2 — Open the Frontend

Option A — **VS Code Live Server** (recommended):
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/index.html`
3. Click **"Open with Live Server"**
4. Opens at: http://127.0.0.1:5500

Option B — Direct file:
- Just open `frontend/index.html` in your browser
- ⚠️ Some API calls may be blocked by CORS if opened as `file://`

---

## 🔑 OpenAI API Key (Optional)

The FoodieBot chatbot works **completely free** without an API key using its built-in rule-based system.

To enable full AI responses:
1. Open `backend/.env`
2. Replace `YOUR_OPENAI_API_KEY` with your actual key:
   ```
   OPENAI_API_KEY=sk-proj-...your-key-here...
   ```
3. Restart the backend server

---

## 🌟 Features

### Pages
| Page | URL | Description |
|------|-----|-------------|
| Home | `index.html` | Hero, featured recipes, categories |
| Sign In | `signin.html` | Login with email/password |
| Sign Up | `signup.html` | Register with password strength meter |
| Browse Recipes | `recipes.html` | Filter by category, cuisine, difficulty, search |
| Recipe Detail | `recipe-detail.html?id=1` | Full recipe with tabs, comments, favorites |
| Add Recipe | `add-recipe.html` | 3-step form to add a recipe |
| Profile | `profile.html` | Your recipes + saved favorites |

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login → returns JWT |
| GET | `/api/auth/profile` | Yes | Get profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| GET | `/api/recipes` | No | List recipes (filterable) |
| GET | `/api/recipes/:id` | No | Single recipe |
| POST | `/api/recipes` | Yes | Create recipe |
| PUT | `/api/recipes/:id` | Yes | Update (owner only) |
| DELETE | `/api/recipes/:id` | Yes | Delete (owner only) |
| GET | `/api/recipes/:id/comments` | No | Get comments |
| POST | `/api/recipes/:id/comments` | Yes | Post review |
| GET | `/api/favorites` | Yes | My favorites |
| POST | `/api/favorites/:id` | Yes | Add to favorites |
| DELETE | `/api/favorites/:id` | Yes | Remove from favorites |
| GET | `/api/favorites/check/:id` | Yes | Check if favorited |
| POST | `/api/chatbot` | No | FoodieBot chat |

---

## 🎨 Design System

- **Primary**: #FF6B35 (Chili Orange)
- **Secondary**: #4ECDC4 (Herb Teal)
- **Accent**: #FFE66D (Honey Gold)
- **Background**: #0A0A0F (Near Black)
- **Headings**: Playfair Display (serif)
- **Body**: Nunito (sans-serif)

---

## 🤖 FoodieBot Topics

FoodieBot can answer questions about:
- 🍽️ Recipe suggestions by cuisine or ingredient
- 🔄 Ingredient substitutions
- 👨‍🍳 Cooking techniques
- 🌶️ Spice and seasoning advice
- 🥗 Dietary options (vegan, keto, gluten-free)
- ❄️ Food storage tips
- 🌡️ Cooking temperatures

---

## 👤 Demo Admin Account

A seed admin account is automatically created:
- **Email**: `admin@cookzenix.ai`
- **Password**: `Admin@123`

---

## 📌 Notes

- Database file `food_recipes.db` is auto-created on first backend start
- 15 recipes are pre-seeded with real Unsplash food images
- All recipe images are from Unsplash (free, no API key needed)
- JWT tokens expire in 7 days

---

*Built with ❤️ by CookZenix AI Team*
