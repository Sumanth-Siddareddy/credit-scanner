# Day 1-2 : Project setup
<<<<<<< HEAD
1. Install NodeJs and SQLite and setup
2. Create a project folder & intialize with - npm init -y
3. Install required packages npm install express sqlite3 bcryptjs jsonwebtoken multer cors dotenv
4. Setup tables in database ( users, documents, credits )
5. Setup a server, connect database.
6. Create routes, middleware, models, config/database directories inside backend directory
7. Create a frontend directory

# Day 3-4 : Authentication and Role Management - user & admin

1. Implement JWT based authentication, password hasing.
2. Roles -
    Regular user ( can upload docs & view matches )
    Admin ( can approve crdit request & view analytics)
3. Create routes -
    POST /auth/register 
    POST /auth/login
    GET /user/profile ( view profile and credits )
