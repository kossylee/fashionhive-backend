# FashionHive Backend 🧵✨

Welcome to the FashionHive Backend repository — a modern backend built with [NestJS](https://nestjs.com/) and [PostgreSQL](https://www.postgresql.org/).

FashionHive is designed to power fashion marketplaces, communities, or ecommerce platforms.

---

## 🚀 Tech Stack

- **Backend:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Environment Management:** dotenv
- **API Testing:** Postman / Thunder Client

---

## 📦 Getting Started

Follow these steps to run the backend locally (without Docker):

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fashionhive-backend.git
cd fashionhive-backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up PostgreSQL

- Download PostgreSQL from postgresql.org/download.

- Install it locally (Username: postgres, Password: your preferred password).

- Create a new database manually via pgAdmin or CLI:

- Database Name: fashionhive_db

## 4. Configure Environment Variables

Create a .env file in the root folder:

````bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=fashionhive_db```

````

## 5. Run the Application

```bash
npm run start:dev
```

## NestJS will start at:

```arduino
http://localhost:3000
```

✅ You are ready to develop!

## 🛠 Project Scripts

Command Description

- npm run start:dev Start backend in development mode (with hot reload)
- npm run build Build the project for production
- npm run start:prod Run the project in production

## 📄 API Documentation

Coming soon with Swagger!

## 🤝 Contributing

We love contributors!
Please check CONTRIBUTING.md for guidelines.

## 📄 License

This project is licensed under the MIT License.
