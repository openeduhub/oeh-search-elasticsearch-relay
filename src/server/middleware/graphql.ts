import { ApolloServer } from 'apollo-server-express';
import { Express, Router } from 'express';
import * as path from 'path';
import resolvers from '../../graphql/resolvers';
import { GraphQLError } from 'graphql';
import { logGraphQlError } from './errorHandlers';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';

const schema = loadSchemaSync(path.join(__dirname, '..', '..', 'graphql', 'schema.graphql'), {
    loaders: [new GraphQLFileLoader()],
});

function formatError(error: GraphQLError): GraphQLError {
    logGraphQlError(error);
    return error;
}

const schemaWithResolvers = addResolversToSchema({
    schema,
    resolvers,
});

const server = new ApolloServer({
    schema: schemaWithResolvers,
    formatError,
    // Enable interactive playground in production
    playground: true,
    introspection: true,
});

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
