# Credit-Based Document Scanning System

This project is a full-stack document scanning and matching system with a built-in credit system. Each user receives 20 free scans per day, and additional scans require a credit request. 
The project includes an admin dashboard with credit management, and a smart analytics dashboard. User dashboard - user can view their details, upload and scan documents, view scan history.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
  - [Completed Features](#completed-features)
  - [Future work](#Future work)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Testing & Documentation](#testing--documentation)
- [License](#license)

## Overview

This repository contains the source code for a credit-based document scanning system. The backend is built using [Node.js/Express](#) and uses SQLite (or JSON files for small-scale storage). The frontend is developed using HTML, CSS, and vanilla JavaScript (no frameworks). The system features user registration, authentication, a credit system, document scanning & matching, duplicate checking, and a smart admin analytics dashboard.

## Features

### Completed Features

#### User Management & Authentication
- **User Registration & Login**  
  - Endpoints: `POST /auth/register`, `POST /auth/login`
  - Token-based authentication is implemented.
  - Handles duplicate usernames and invalid login credentials.

#### Credit System
- **Daily Free Credits**  
  - Each user starts with 20 free credits per day.
  - Admins have unlimited credits.
- **Credit Balance & Deduction**  
  - Endpoints: `GET /credits/balance`, `POST /credits/deduct`
- **Credit Request Handling**  
  - Endpoint: `POST /credits/request`
  - Prevents duplicate pending credit requests.

#### Document Scanning & Matching
- **Document Scanning**  
  - Endpoint: `POST /api/scan`
  - Accepts files in PDF, JPG, PNG, or DOCX formats.
  - Returns extracted text, topic, match status, and similarity score.
- **Duplicate Check**  
  - Endpoint: `POST /api/documents/check-duplicate`
- **Document Matching**  
  - Matching results are provided in the scan response.
  - Fallback to TF-IDF is used when the AI service is down.

#### User Activity & Scan History
- **Scan History Retrieval**  
  - Endpoint: `GET /api/scans?user_id={id}` (used by both admin and regular users)
  - Displays scan date, filename, extracted text (truncated for display), topic, and match status.

#### Admin Features
- **Admin Dashboard & Details**  
  - Endpoints: `GET /protected/admin`, `GET /api/admin/dashboard`
- **Credit Request Management**  
  - Endpoints: `GET /api/admin/credit-requests`, `POST /api/admin/approve/:userId`, `POST /api/admin/reject/:userId`, `POST /api/admin/set-credits/:userId`
  - Admins can view pending credit requests with approve/reject options.
- **Admin Document Scanning**  
  - Admins use the same scan endpoint (`POST /api/scan`), with no credit deductions.

#### Frontend Integration
- **Admin Panel (`admin.js`):**  
  - Fetches admin details, dashboard analytics, credit requests, and scan history.
  - Implements functions to approve/reject credit requests and set user credits.
- **User Profile (`profile.js`):**  
  - Fetches user profile details and scan history.
  - Implements document scanning with duplicate checks and credit requests.
- **UI/UX:**  
  - Responsive interfaces for both admin and regular users.
  - Message pop-ups for notifications and error handling.

### Future work

- **AI-Powered Document Matching (Bonus)**  
  - Integrate a primary AI service (e.g., OpenAI, Gemini, or DeepSeek) to enhance document matching accuracy.
  - Improve fallback logic and error handling for the matching process.
 
- **Export Reports**  
  - Implement functionality to export scan history and analytics reports (optional bonus).

## API Endpoints

### User Endpoints
- **POST /auth/register**  
  - Registers a new user.
- **POST /auth/login**  
  - Logs in a user and returns an authentication token.
- **GET /protected/user/profile**  
  - Retrieves the user profile, including credits and user ID.
- **GET /credits/balance**  
  - Retrieves the current credit balance.
- **POST /credits/deduct**  
  - Deducts 1 credit per document scan.
- **POST /credits/request**  
  - Requests additional 1 credit when the daily free credits are exhausted.
- **POST /api/scan**  
  - Scans a new document.
- **POST /api/documents/check-duplicate**  
  - Checks if the document has already been scanned.
- **GET /api/scans?user_id={id}**  
  - Retrieves scan history for the user.

### Admin Endpoints
- **GET /protected/admin**  
  - Retrieves admin details.
- **GET /api/admin/dashboard**  
  - Retrieves analytics data (top topics, users, credit usage, total credits used).
- **GET /api/admin/credit-requests**  
  - Retrieves a list of pending and historical credit requests.
- **POST /api/admin/approve/:userId**  
  - Approves a credit request for a user.
- **POST /api/admin/reject/:userId**  
  - Rejects a credit request for a user.
- **POST /api/admin/set-credits/:userId**  
  - Manually sets or adjusts a user’s credit balance.
- **POST /api/scan**  
  - (Admin can also use the scanning endpoint; credits are not deducted for admin.)

## Frontend Integration

The frontend is divided into two primary modules:

### Admin Panel (admin.js)
- Fetches and displays admin details and dashboard analytics.
- Manages credit requests with options to approve, reject, or set credits.
- Provides document scanning functionality and displays scan history.

### User Profile (profile.js)
- Displays the user’s profile details (username, role, credits).
- Allows users to upload documents for scanning.
- Implements duplicate checking before scanning.
- Enables users to request additional credits.
- Displays scan history in a table format.


## User Interface Screenshots

### Register
![Register](/frontend/assests/UI_Images/Register.jpg)

### Login
![Login](/frontend/assests/UI_Images/Login.jpg)

### Admin Dashboard
![Admin Dashboard](/frontend/assests/UI_Images/Admin_DashBoard.jpg)

### Admin Document Scanning and scan history
![Document Scanning for admin](/frontend/assests/UI_Images/document_scan_and_scan_history_for_admin.jpg)

### Admin credit request - approval, reject and credit requests history
![credit requests approval or reject, request history](/frontend/assests/UI_Images/credit_request_approval.jpg)

### User Profile - user details, scan document, credit request, scan history
![User Profile](/frontend/assests/UI_Images/User_profile.jpg)
