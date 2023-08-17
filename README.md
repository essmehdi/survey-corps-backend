# ENSIAS Bridge Survey API

This repository hosts the ENSIAS Bridge Survey API: A survey management API for the Bridge Club at ENSIAS. For now, it is used mainly for the Survey initiative started by the club to gather information about ENSIAS alumnis and their experience at the school and in the professional world.

## Launching the API

If you want to contribute or just try the API, follow the setup below to launch the server.

This API is built using:

- [**Nest.js**](https://nestjs.com/) for the application
- [**Prisma**](https://wwww.prisma.io/) as an ORM
- [**PostgreSQL**](https://www.postgresql.org/) for the database

Thus, you will need Node.js installed and a PostgreSQL database. We use [`yarn`](https://yarnpkg.com) as the package manager so you will need it also to continue.

Clone the repository:

```shell
git clone https://github.com/essmehdi/survey-corps-backend
```

Copy the `.env.example` file, rename it to `.env` and fill it with the same properties as the example file:

- `API_URL`: URL where the API is hosted
- `FRONTEND_URL`: URL of the frontend
- `PORT`: Port used by the server
- `DATABASE_URL`: Connect string to the PostgreSQL database
- `SESSION_SECRET`: Express session secret
- `RESEND_API_KEY`: Resend API key
- `MAIL_ADDRESS`: Sender mail
- `THROTTLE_TTL`: Request throttling TTL
- `THROTTLE_LIMIT`: Number of requests in the TTL

Install the necessary packages:

```shell
yarn install
```

Now synchronize your database with the Prisma schema.

```shell
npx prisma migrate dev
```

For emails, you will need to setup [Resend]("https://resend.com/") in the `.env` file as mentioned below.

Finally, launch the dev server:

```shell
yarn start:dev
```

And you are good to go!
