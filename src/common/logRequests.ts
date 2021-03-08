import { Plugin } from '@nestjs/graphql';
import { ApolloServerPlugin, GraphQLRequestContext } from 'apollo-server-plugin-base';
import { config } from './config';
import { logInfo, SEPARATOR } from './log';

@Plugin()
export class LogRequestsPlugin implements ApolloServerPlugin {
    requestDidStart(requestContext: GraphQLRequestContext): void {
        if (config.debug.logRequests) {
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
        }
    }
}
