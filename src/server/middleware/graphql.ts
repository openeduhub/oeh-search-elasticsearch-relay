import { ApolloServer } from 'apollo-server-express';
import { Express, Router } from 'express';
import { importSchema } from 'graphql-import';
import * as path from 'path';
import resolvers from '../../graphql/resolvers';
import { GraphQLError } from 'graphql';
import { logGraphQlError } from './errorHandlers';

const typeDefs = importSchema(path.join(__dirname, '..', '..', 'graphql', 'schema.graphql'));

function formatError(error: GraphQLError): GraphQLError {
    logGraphQlError(error);
    return error;
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    // Enable interactive playground in production
    playground: true,
    introspection: true,
});

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
