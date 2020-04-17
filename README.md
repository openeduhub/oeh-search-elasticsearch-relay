# ElasticSearch Relay

A server to relay queries of the frontend to ElasticSearch.

The relay provides a custom API that is tailored to the needs of the frontend. It converts requests
to ElasticSearch queries, sends the queries to ElasticSearch and processes the results to a form
useful to the frontend.

## Structure

### `src`

Code specific to the relay.

### `shared`

Code that is shared with the frontend. This is a separate Typescript module which is built
automatically with the relay.

Build this module before compiling the frontend:

```bash
tsc --project shared # --watch
```

## Build

Install dependencies: `npm install`

Start a dev server and listen for code changes: `npm run dev`

Build a docker image:

```bash
npm run build
npm run docker-build
```

## Environment Variables

Variable | Description | Default value (Docker) | Default value (dev)
-------- | ----------- | ---------------------- | -------------------
PORT | Port for accessing the relay via HTTP | 80 | 3000
ELASTICSEARCH_URL | Where to reach the ElasticSearch server | http://elasticsearch | http://localhost:9200
INDEX | ElasticSearch index to query | search_idx | search_idx