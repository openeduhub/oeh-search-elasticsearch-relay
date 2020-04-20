import {
    handleCors,
    handleCompression,
} from './common';

import { handleGraphQl } from './graphql';

export default [
    handleCors,
    handleCompression,
    handleGraphQl,
];
