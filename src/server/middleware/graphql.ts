import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { Express, Router } from 'express';
import { importSchema } from 'graphql-import';
import * as path from 'path';
import resolvers from '../../graphql/resolvers';
import { GraphQLError } from 'graphql';
import { logGraphQlError } from './errorHandlers';
import { ApolloServerPlugin } from 'apollo-server-plugin-base/src';
import { config } from '../../common/config';
import { logInfo } from '../../common/log';

const typeDefs = importSchema(path.join(__dirname, '..', '..', 'graphql', 'schema.graphql'));

function formatError(error: GraphQLError): GraphQLError {
    logGraphQlError(error);
    return error;
}

const logRequests: ApolloServerPlugin = {
    requestDidStart(requestContext) {
        logInfo(
            'GraphQL request\n' +
                'Query:\n' +
                '__________________________________________________\n' +
                requestContext.request.query +
                '__________________________________________________\n' +
                'Variables:\n' +
                JSON.stringify(requestContext.request.variables, null, 2) +
                '\n' +
                '__________________________________________________\n',
        );
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    // Enable interactive playground in production
    playground: true,
    introspection: true,
    plugins: [...(config.debug.logRequests ? [logRequests] : [])],
});

export const handleGraphQl = (router: Router) =>
    server.applyMiddleware({ app: router as Express, path: '/graphql' });
