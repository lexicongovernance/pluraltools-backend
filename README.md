# Forum backend

## Project structure

1. [db](./src/db/) contains all the db models. A global overview can be found [here](./DATABASE.md)
2. [routers](./src/routers/) contains all the api routers which map urls to the service.
3. [services](./src/services/) contains all business logic for the routes.
4. [handlers](./src/handlers/) contains all request and response management.
5. [middleware](./src/middleware/) contains all the middleware that is used in the routers before the code reaches the service.
6. [modules](./src/modules/) contains all voting models implemented in the forum backend.
7. [types](./src/types/) contains all the zod types that are needed for validation.

## For developers

1. install [nodejs v20.14.0](https://nodejs.org/en/download)
   - On WSL (Windows Subsystems for Linux) install `node.js v20` as follows:
   ```
   1. curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   2. sudo apt install -y nodejs
   ```
2. install [pnpm](https://pnpm.io/installation#using-npm)
3. update .env with custom values
4. start services needed to run backend `make docker-run`
5. `pnpm install`
6. `pnpm build` only required on the first run
7. `pnpm dev`

### unit testing

- you can test you have set everything up correctly by running `pnpm test`

### database list of commands

- It is possible to visualize the database. Run: `pnpm db:studio`
- It is possible to fill the database with random data. Run:
  `pnpm db:seed`
- It is possible to delete all entries from the database. Run:
  `pnpm db:seed:cleanup`

### db migrations

1. create a file in the [db](./src/db/) with the new table schema
2. run `pnpm db:generate`
3. restart server and migrations should auto run
