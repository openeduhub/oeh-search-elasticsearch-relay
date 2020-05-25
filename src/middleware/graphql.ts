import { ApolloServer } from 'apollo-server-express';
import { Express, Router } from 'express';
import { importSchema } from 'graphql-import';
import * as path from 'path';
import resolvers from '../resolvers';

const typeDefs = importSchema(path.join(__dirname, '..', 'schema.graphql'));
const server = new ApolloServer({ typeDefs, resolvers });

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
