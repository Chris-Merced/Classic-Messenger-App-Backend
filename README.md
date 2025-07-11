# Classic Messenger App - Backend

The backend for the Classic Messenger App is a secure, scalable Node.js server built using Express and PostgreSQL. It manages user authentication, message handling, session management, and data storage for all chat interactions and social features. This server works hand-in-hand with the frontend to power a real-time messaging experience.

## Features

* **User Authentication:** Secure signup and login with hashed passwords using Argon2, and OAuth2 integration.
* **Session Management:** SSessions managed via Redis and PostgreSQL, providing persistent and performant login sessions.
* **Real-Time Messaging Support:** Integrated with WebSocket server to deliver messages instantly.
* **Friend System:** Support for friend requests, approvals, and friend list management.
* **Group and Private Chats:** Backend architecture supports group creation, participant tracking, and private DMs.
* **Blocking:** Users can block others, preventing unwanted interactions.
* **Profile Management:** Manages user data such as public/private visibility, profile pictures (AWS S3 integration), and "About Me" text.
* **Database Relationships:** Robust relational structure using foreign keys, constraints, and join tables.
* **Security:** Password hashing with Argon2, session validation, OAuth integration, and input sanitation.

## Technology Stack

* **Node.js** with **Express**
* **PostgreSQL** with schema defined via `schema.sql`
* **Redis** for session caching and management
* **Argon2** for password hashing
* **OAuth2** for third-party authentication
* **WebSocket (ws)** for real-time communication
* **AWS S3** for profile picture storage
* **Multer** for handling multipart/form-data (file uploads)
* **dotenv** for environment configuration
* **pg** for PostgreSQL interactions
* **cookie-parser** for managing cookies in session validation
* **cors** for handling cross-origin requests

## Installation & Setup

### Prerequisites

* Node.js v16+
* PostgreSQL (local instance or remote)
* Redis (local instance or remote)

### Steps

1. **Clone the Repository:**

```bash
git clone [repository-url]
cd Classic-Messenger-App-Backend
```

2. **Install Dependencies:**

```bash
npm install
```

3. **Configure Environment Variables:** Create a `.env` file in the root with the following structure:

```env
DATABASE_URL='postgresql://<your_username>:<your_password>@localhost:5432/<your_database_name'
LOCAL_DATABASE_URL='postgresql://<your_username>:<your_password>@localhost:5432/<your_database_name>'
FRONTEND_OAUTH_URL='http://localhost:9000/oauth'
OAUTH_SECRET=your_oauth_secret
OAUTH_CLIENTID=your_oauth_client_id
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-2
AWS_S3_BUCKET=classic-messenger-profile-pics
NODE_ENV=development
```

4. **Set Up the Database:** Import `schema.sql` into PostgreSQL:

```bash
psql -U your_username -d your_database_name -f schema.sql
```

5. **Start the Server:**

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Overview

* `POST /signup` – Register a new user
* `POST /login` – Log in with credentials
* `POST /logout` – End the current session
* `GET /userProfile/` – Search for users or get user public profile
* `GET /conversations/` - Check status of user relationships to determine conversation authorization
* `POST /conversations/` – Create new conversations or add message to conversation
* `PATCH /conversations/` - Update conversation read status or online status
* `GET /messages/:conversationId` – Fetch messages for a conversation
* `POST /oauth/` - New account creation through OAuth process
* `PATCH /oauth` - Handle user sign in through OAuth Process

## Testing

The backend includes a robust test suite written using **Jest**. Test files are organized by domain in the `/tests` directory and cover key areas such as:

- `conversationController.test.js` - Unit testing to ensure that data relating to individual conversation is stored and depicted accurately (online status, relationship status, read status, users, message storage) 
- `loginController.test.js` - Unit testing to ensure that the process of logging in a user and retrieving data is accurate, safe and secure
- `logoutController.test.js` - Unit testing to ensure that the process of logging out a user and clearing sessions is safe and secure
- `messagesController.test.js` - Unit testing to ensure the retrieval of both singular chat messages and user chat list is functional and accurate
- `oauthController.test.js` - Unit testing to ensure the alternative form of user validation is functional
- `signupController.test.js` - Unit testing to ensure the process of validating and storing new user data is accurate and functional
- `userProfileController.test.js` - Unit testing to ensure all aspects of user profile retrieval (mutual friends, blocked status, friend status, about me, etc..) operate in an expected and accurate manner

### Running Tests

To run the full test suite:

```bash
npm test
```
  
## Future Improvements

* Rate limiting and account lockout after repeated failed logins
* JWT support as an alternative to sessions
* Admin-level tooling for moderation

## Author

Chris Merced

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
