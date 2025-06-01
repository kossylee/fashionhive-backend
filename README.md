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

🤝 Contributing  
We love contributors! Please check [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

To ensure smooth and real-time communication, **joining our [Telegram group](https://t.me/+1JUUa-h0MH8yM2Vk)** is a required step before contributing.  
This helps us coordinate efficiently, share updates, and support contributors directly.

Join here 👉 [FashionHive Contributors Group](https://t.me/+1JUUa-h0MH8yM2Vk)

Let’s build FashionHive together! 

## 📄 License

This project is licensed under the MIT License.

```
fashionhive-backend
├─ CONTRIBUTING.md
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ app.module.ts
│  ├─ database
│  │  └─ database.module.ts
│  ├─ main.ts
│  └─ modules
│     ├─ inventory
│     │  ├─ dtos
│     │  │  └─ create-inventory.dto.ts
│     │  ├─ entities
│     │  │  └─ inventory.entity.ts
│     │  ├─ inventory.module.ts
│     │  └─ inventory.service.ts
│     ├─ order
│     │  ├─ dtos
│     │  │  └─ create-order.dto.ts
│     │  ├─ entities
│     │  │  ├─ order-item.entity.ts
│     │  │  └─ order.entity.ts
│     │  ├─ order.controller.ts
│     │  ├─ order.module.ts
│     │  └─ order.service.ts
│     ├─ tailor
│     │  ├─ entities
│     │  │  └─ tailor.entity.ts
│     │  ├─ tailor.module.ts
│     │  └─ tailor.service.ts
│     └─ user
│        ├─ dtos
│        │  └─ create-user.dto.ts
│        ├─ entities
│        │  └─ user.entity.ts
│        ├─ user.controller.ts
│        ├─ user.module.ts
│        └─ user.service.ts
└─ tsconfig.json

```