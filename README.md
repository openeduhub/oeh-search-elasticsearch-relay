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
npm run build
npm run docker-build
```

## API

The Relay provides a GraphQL API that is served on `/graphql` (e.g., http://localhost:3000/graphql
on a dev environment). When accessed with a web browser, this endpoint offers an interactive query
editor and documentation.

## Environment Variables

Variable | Description | Default value (Docker) | Default value (dev)
-------- | ----------- | ---------------------- | -------------------
PORT | Port for accessing the relay via HTTP | 80 | 3000
ELASTICSEARCH_URL | Where to reach the ElasticSearch server | http://elasticsearch | http://localhost:9200
INDEX | ElasticSearch index to query | search_idx | search_idx