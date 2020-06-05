# ElasticSearch Relay

A server to relay queries of the frontend to ElasticSearch.

The relay provides a custom API that is tailored to the needs of the frontend. It converts requests
to ElasticSearch queries, sends the queries to ElasticSearch and processes the results to a form
useful to the frontend.

## Build

Install dependencies: `npm install`

Start a dev server and listen for code changes: `npm start`

Build a docker image:

```bash
npm run clean
npm run build
npm run docker-build
```

## API

The Relay provides a GraphQL API that is served on `/graphql` (e.g., http://localhost:3000/graphql
on a dev environment). When accessed with a web browser, this endpoint offers an interactive query
editor and documentation.

### Endpoints

Path | Description
---- | -----------
`/graphql` | The preferred API endpoint, described above.
`/rest` | An alternative REST API that emulates the Edu-Sharing REST API.
`/swagger` | Interactive documentation of the API.

## Environment Variables

Variable | Description | Default value
-------- | ----------- | -------------------
PORT | HTTP Port on which to expose this service | 3000 (80 in Docker)
URL | Root URL where this service will be accessible from the Internet | http://localhost:3000
FRONTEND_URL | Root URL where the OEH frontend will be accessible from the Internet | http://localhost:4200
ELASTICSEARCH_URL | Root URL where this service can reach the ElasticSearch server | http://localhost:9200
ELASTICSEARCH_INDEX | ElasticSearch index to query | search_idx
EDUSHARING_URL | Root URL where the corresponding Edu-Sharing instance can be reached from the Internet | http://localhost/edu-sharing

### Overriding Variables in Dev Environment

Depending on your setup, the default values might be enough to run the service.

To override variables, create a file `.env` in the project root and add a line for each variable you want to override, e.g.

```
PORT=2342
```

### Overriding Variables in Docker Container

Typically you have to set the correct values for at least the variables

- `URL`
- `ELASTICSEARCH_URL`

Set variables via Docker, e.g. in `docker-compose.yml`:
```yml
    environment:
      - URL=https://my.domain/relay
```



## Project Structure

- `dist/`: Build directory.
- `src/`
    - `controllers/`: Controllers for REST endpoints.
    - `generated/`: Generated code not tracked by Git. Will be updated automatically or with `npm run generate`.
    - `middleware/`: Express middleware controlling the overall behavior of the server.
    - `resolvers/`: GraphQL resolvers, implementing business logic.
    - `types/`: Types of the REST API from which data models are generated.
    - `schema.graphql`: GraphQL API schema from which types are generated. (The types used by GraphQL are different from the ones of the REST API.)
    - `server.ts`: Entry point.
- `.env`: Override environment variables for development.