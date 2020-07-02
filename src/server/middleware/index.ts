import { handleCors, handleBodyRequestParsing, handleCompression } from './common';
import { handleSwagger } from './swagger';
import { handleGraphQl } from './graphql';

export default [
    handleCors,
    handleBodyRequestParsing,
    handleCompression,
    handleSwagger,
    handleGraphQl,
];
