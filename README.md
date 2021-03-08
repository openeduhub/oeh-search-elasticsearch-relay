# ElasticSearch Relay

A server to relay queries of the Open Edu Hub frontend to ElasticSearch.

The relay provides a custom API that is tailored to the needs of the frontend. It converts requests
to ElasticSearch queries, sends the queries to ElasticSearch and processes the results to a form
useful to the frontend.

## Build

Install dependencies: `npm install`

### Dev Environment

Start a dev server and listen for code changes: `npm start`

### Docker Image

Docker images are built via Github Actions and uploaded to https://hub.docker.com/r/openeduhub/oeh-search-elasticsearch-relay.

To build a docker image locally, run

```bash
npm run build
npm run docker-build
```

### Vocabs

Metadata vocabularies that are maintained here: https://github.com/openeduhub/oeh-metadata-vocabs,
are served as assets with this relay. To update, run `npm run update-vocabs`.

## API

The Relay provides a GraphQL API that is served on `/graphql` (e.g., http://localhost:3000/graphql
on a dev environment). When accessed with a web browser, this endpoint offers an interactive query
editor and documentation.

Use the _DOCS_ panel on the right side of the interactive `/graphql` playground or start by typing
`{}` and work your way through building a query using <kbd>Ctrl</kbd>+<kbd>Space</kbd>.

A search query could look like this:

```
{
  search(
    searchString: "digital"
    size: 10
    language: de
    filters: [
      { facet: discipline, terms: ["Physik"] }
      { facet: educationalContext, terms: ["Sekundarstufe II"] }
    ]
  ) {
    hits {
      id
      lom {
        general {
          title

        }
      }
    }
  }
}
```

### Endpoints

| Path       | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `/graphql` | The preferred API endpoint, described above.                    |
| `/rest`    | An alternative REST API that emulates the Edu-Sharing REST API. |
| `/swagger` | Interactive documentation of the API.                           |

## Environment Variables

| Variable              | Description                                                                                 | Default value                |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| PORT                  | HTTP Port on which to expose this service                                                   | 3000 (80 in Docker)          |
| URL                   | Root URL where this service will be accessible from the Internet                            | http://localhost:3000        |
| FRONTEND_URL          | Root URL where the OEH frontend will be accessible from the Internet                        | http://localhost:4200        |
| ELASTICSEARCH_URL     | Root URL where this service can reach the ElasticSearch server                              | http://localhost:9200        |
| ELASTICSEARCH_INDEX   | ElasticSearch index to query                                                                | workspace                    |
| ELASTICSEARCH_MAPPING | Structure of the given ElasticSearch index. Supported values are 'edu-sharing' and 'legacy' | edu-sharing                  |
| EDUSHARING_URL        | Root URL where the corresponding Edu-Sharing instance can be reached from the Internet      | http://localhost/edu-sharing |
| DEBUG_LOG_REQUESTS    | Log every GraphQL request                                                                   | false                        |

### Overriding Variables in Dev Environment

Depending on your setup, the default values might be enough to run the service.

To override variables, create a file `.env` in the project root and add a line for each variable you want to override, e.g.

```
PORT=2342
```

### Overriding Variables in Docker Container

Set variables via Docker, e.g. in `docker-compose.yml`:

```yml
environment:
    - URL=https://my.domain/relay
```

## Project Structure

-   `dist/`: Build directory.
-   `scripts/`: Build-time scripts.
-   `src/`
    -   `assets/`: Static source files.
        -   `vocabs/`: Skos vocabs definitions, updated with `npm run update-vocabs`.
    -   `common/`: Stuff used by various application parts.
    -   `generated/`: Generated code not tracked by Git. Will be updated automatically or with `npm run generate`.
    -   `graphql/`
        -   `resolvers/`: GraphQL resolvers, implementing business logic.
        -   `schema.graphql`: GraphQL API schema from which types are generated. (The types used by GraphQL are different from the ones of the REST API.)
    -   `mapping/`: Mappings of different ElasticSearch index formats.
    -   `rest/`:
        -   `controllers/`: Controllers for REST endpoints.
        -   `types/`: Types of the REST API from which data models are generated.
    -   `server/`: Express-server-related files.
        -   `middleware/`: Express middleware controlling the overall behavior of the server.
    -   `index.ts`: Entry point.
-   `.env`: Override environment variables for development.
