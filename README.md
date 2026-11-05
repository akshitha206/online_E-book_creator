# 📚 BookCraft — Create. Curate. Experience.

### Your ideas deserve more than an empty page.

**BookCraft** is a modern AI-powered digital book creation and reading management platform designed to transform the way people create, organize, and experience digital books.

From designing personalized book covers to managing your digital library, tracking reading goals, and exploring AI-powered assistance, BookCraft brings the complete reading and creation experience into one place.

<p align="center">
  <strong>✦ Imagine it. Create it. Publish your story. ✦</strong>
</p>

---

## 🌌 Project Overview

BookCraft is a full-stack MERN application that combines an intuitive React interface with a powerful Node.js and Express backend.

It provides readers and creators with a unified workspace to create digital books, organize collections, track reading activities, and explore intelligent AI-assisted features.

The platform focuses on making digital publishing and personal library management more accessible, interactive, and enjoyable.

## ✨ Key Features

| Feature | Description |
|---|---|
| 📖 Digital Library | Organize and manage your personal book collection. |
| ✍️ AI Assistant | Explore AI-powered assistance for your creative workflow. |
| 🎨 Cover Designer | Design personalized covers for digital books. |
| 📊 Reading Analytics | Visualize reading activity and progress. |
| 🔖 Bookmark Manager | Save and organize important reading points. |
| 🎯 Reading Goals | Set reading targets and monitor progress. |
| 📝 Reading Journal | Maintain notes and track reading experiences. |
| 👁️ Book Preview | Preview your created digital books. |
| 👤 User Profiles | Manage your personal account and preferences. |
| 🔐 Authentication | Secure account registration and login. |
| 🌐 GitHub Login | Support GitHub-based authentication integration. |

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript (ES6+)
- CSS3
- React Router
- Lucide React

### Backend
- Node.js
- Express.js
- REST API Architecture
- JWT Authentication
- bcryptjs

### Database
- MongoDB
- Mongoose ODM

### AI & Integrations
- Google Gemini API
- GitHub OAuth integration

### Development Tools
- Visual Studio Code
- Git & GitHub
- npm

## 🏗️ System Architecture

```text
                  BOOKCRAFT
                      |
          +-----------+-----------+
          |                       |
      FRONTEND                 BACKEND
          |                       |
       React.js               Node.js
          |                       |
        Vite                  Express.js
          |                       |
          +------ REST API -------+
                      |
                 MongoDB
                      |
             Mongoose ODM
                      |
           AI & Authentication
                Integrations
```

## 📂 Project Structure

```text
Online_E_Book_Creator/
│
├── Online_E_Book_Creator/
│   │
│   ├── client/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── server/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── server.js
│   │   └── package.json
│   │
│   └── .gitattributes
│
└── .gitignore
```

## 🚀 Getting Started

Follow these instructions to run BookCraft locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Rishitha24318/Online_E-Book_Creator.git
```

### 2. Navigate to the Project

```bash
cd Online_E-Book_Creator/Online_E_Book_Creator
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
```

### 4. Start the Frontend

```bash
npm run dev
```

The frontend will typically be available at:

`http://localhost:5173`

### 5. Install Backend Dependencies

Open a second terminal:

```bash
cd Online_E-Book_Creator/Online_E_Book_Creator/server
npm install
```

### 6. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Add the configuration required by your backend:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Configure any additional GitHub OAuth variables required by your authentication implementation.

**Security note:** Never upload your `.env` file, API keys, database credentials, or authentication secrets to GitHub.

### 7. Start the Backend

```bash
node server.js
```

The backend should run on the configured server port.

## 🔒 Security

BookCraft follows essential application security practices:

- Password hashing with bcryptjs.
- Token-based authentication using JWT.
- Environment-based configuration for sensitive credentials.
- Separation of frontend and backend responsibilities.
- Git ignore rules to prevent accidental uploads of secrets and dependencies.

## 🎯 Project Goals

BookCraft aims to:

- Simplify digital book creation and organization.
- Make reading progress easier to track.
- Provide an interactive and personalized reading experience.
- Integrate AI assistance into creative workflows.
- Build a unified digital space for readers and creators.

## 🔮 Future Enhancements

Potential areas for future development include:

- 📱 Responsive mobile-first reading experience.
- ☁️ Cloud-based book storage and synchronization.
- 📚 Advanced book discovery and recommendations.
- 🤝 Collaborative book creation.
- 📈 More detailed reading insights.
- 📤 Additional digital publishing and export options.

## 🖼️ Screenshots

Screenshots of the BookCraft interface will be added here.

| Dashboard | Digital Library |
|---|---|
| Add dashboard screenshot | Add library screenshot |

| AI Assistant | Cover Designer |
|---|---|
| Add AI screenshot | Add cover designer screenshot |

## 👩‍💻 Developer

**Rishitha Bommischetty**

GitHub: [@Rishitha24318](https://github.com/Rishitha24318)

Project Repository: [Online_E_Book_Creator](https://github.com/Rishitha24318/Online_E-Book_Creator)

## ❤️ Acknowledgements

Built with creativity, curiosity, and a passion for combining technology with the world of books.

---

<p align="center">
  <strong>BOOKCRAFT</strong>
  <br/>
  <em>Where Every Page Begins a New Possibility.</em>
  <br/><br/>
  ⭐ If you like this project, consider giving it a star!
</p>
