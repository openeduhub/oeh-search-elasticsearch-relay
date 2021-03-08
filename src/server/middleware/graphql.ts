import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { addResolversToSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base/src';
import { Express, Router } from 'express';
import { GraphQLError } from 'graphql';
import * as path from 'path';
import { config } from '../../common/config';
import { logInfo, SEPARATOR } from '../../common/log';
import resolvers from '../../graphql/resolvers';
import { logGraphQlError } from './errorHandlers';

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

const logRequests: ApolloServerPlugin = {
    requestDidStart(requestContext) {
        logInfo(
            'GraphQL request\n' +
                'Query:\n' +
                SEPARATOR +
                requestContext.request.query +
                '\n' +
                SEPARATOR +
                'Variables:\n' +
                JSON.stringify(requestContext.request.variables, null, 2) +
                '\n' +
                SEPARATOR,
        );
    },
};

const server = new ApolloServer({
    schema: schemaWithResolvers,
    formatError,
    // Enable interactive playground in production
    playground: true,
    introspection: true,
    plugins: [...(config.debug.logRequests ? [logRequests] : [])],
});

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
