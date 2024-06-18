# Self-Hosting

To self-host the app, you will need to follow these steps:

1. Clone the frontend repository from [GitHub](https://github.com/lexicongovernance/pluraltools-frontend).
2. Install Docker and Docker Compose on your machine.
3. Clone the backend repository from [GitHub](https://github.com/lexicongovernance/pluraltools-backend).
4. Navigate to the backend repository's root directory.

## Setting up the Backend

1. Create a `.env` file in the backend repository's root directory.
2. Populate the `.env` file with the necessary environment variables. Refer to the `.env.example` file for guidance.
3. `make docker-run` will start db and cycle-manager service
4. `pnpm build && pnpm start` will start the server

5. The backend services should now be running and accessible at `http://localhost:8000`.

## Setting up the Frontend

1. Navigate to the frontend repository's root directory.
2. Create a `.env` file in the frontend repository's root directory.
3. Populate the `.env` file with the necessary environment variables. Refer to the `.env.example` file for guidance.
4. Run the following command to install the dependencies:

```bash
pnpm install
```

5. Run the following command to start the frontend development server:

```bash
pnpm berlin:dev
```

6. The frontend should now be running and accessible at `http://localhost:3000`.

You have successfully self-hosted the app! You can now access the frontend and interact with the backend services.
