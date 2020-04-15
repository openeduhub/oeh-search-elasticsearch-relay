import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';

dotenv.config();

export const client = new Client({ node: process.env.ELASTICSEARCH_URL });
export const index = process.env.INDEX;
