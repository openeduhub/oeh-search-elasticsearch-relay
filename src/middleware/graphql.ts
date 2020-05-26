import { ApolloServer } from 'apollo-server-express';
import { Express, Router } from 'express';
import { importSchema } from 'graphql-import';
import * as path from 'path';
import resolvers from '../resolvers';
import { GraphQLError } from 'graphql';
import { logGraphQlError } from './errorHandlers';

const typeDefs = importSchema(path.join(__dirname, '..', 'schema.graphql'));

function formatError(error: GraphQLError): GraphQLError {
    logGraphQlError(error);
    return error;
}

const server = new ApolloServer({ typeDefs, resolvers, formatError });

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
