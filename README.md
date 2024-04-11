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

1. install [bun](https://bun.sh/)
2. install [pnpm](https://pnpm.io/installation#using-npm)
3. start a postgres `docker run --name postgres  -e POSTGRES_PASSWORD=secretpassword -e POSTGRES_USER=postgres -p 5432:5432 -d postgres`
4. update .env with connection string `postgresql://postgres:secretpassword@localhost:5432` & cookie password.
5. pnpm i
6. pnpm dev

### database list of commands

1. It is possible to visualize the database. Run: `pnpm db:studio`

2. It is possible to fill the database with random data. Run:
   `pnpm db:seed`

3. It is possible to delete all entries from the database. Run:
   `pnpm db:seed:cleanup`

### unit testing

- expects a database to be available at `postgresql://postgres:secretpassword@localhost:5432`

### db migrations

1. create a file in the [db](./src/db/) with the new table schema
2. run `pnpm generate`
3. restart server and migrations should auto run
