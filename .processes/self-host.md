# Self-Hosting an Event

To self-host the app, you will need to follow these steps:

1. Clone the frontend repository from [GitHub](https://github.com/lexicongovernance/pluraltools-frontend).
2. Install Docker and Docker Compose on your machine.
3. Clone the backend repository from [GitHub](https://github.com/lexicongovernance/pluraltools-backend).
4. Navigate to the backend repository's root directory.

## Setting up the Backend

1. install [nodejs v20.14.0](https://nodejs.org/en/download)
   - On WSL (Windows Subsystems for Linux) install `node.js v20` as follows:
   ```
   1. curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   2. sudo apt install -y nodejs
   ```
2. install [pnpm](https://pnpm.io/installation#using-npm)
3. create a `.env` file in the backend repository's root directory.
4. populate the `.env` file with the necessary environment variables. Refer to the `.env.example` file for guidance.
6. `pnpm install` to install the required packages and depencies
5. `make docker-run` will start db and cycle-manager service
7. `pnpm build && pnpm start` will start the server
8. The backend services should now be running and accessible at `http://localhost:8000`. Run `pnpm test` to verify that the backend is running correctly.

## Setting up the Frontend

1. Navigate to the frontend repository's root directory.
2. Create a `.env` file in the frontend repository's root directory.
3. Populate the `.env` file with the necessary environment variables. Refer to the `.env.example` file for guidance.
4. Run `pnpm install` to install the required packages and depencies.
5. Run `pnpm berlin:dev` to start the frontend development server:
6. The frontend should now be running and accessible at `http://localhost:3000`.

You have successfully self-hosted the app! You can now access the frontend and interact with the backend services.
