// backend/services/milvusService.js

import { MilvusClient, DataType, ConsistencyLevelEnum } from '@zilliz/milvus2-sdk-node';
import config from '../config/env.js';

const client = new MilvusClient({
  address: config.milvusAddress,
  token: config.milvusToken,
});

/**
 * Searches Milvus for similar embeddings.
 * @param {Array<number>} queryEmbedding - 768-dimensional embedding array.
 * @returns {Array<string>} - Array of IDs from Milvus.
 */
const searchMilvus = async (queryEmbedding) => {
  try {
    // Ensure the embedding is valid
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
      throw new Error('Query embedding is invalid or does not have 768 dimensions.');
    }

    const searchParams = {
      collection_name: 'banking77_embeddings',
      consistency_level: ConsistencyLevelEnum.Bounded,
      output_fields: ['intent'],
      search_params: {
        anns_field: 'vector',
        metric_type: 'IP',
        params: JSON.stringify({ nprobe: 16 }),
        topk: 5,
      },
      vectors: [queryEmbedding],
    };

    const results = await client.search(searchParams);

    console.log('Search Results:', results);
    return results.results.map((result) => result.id);
  } catch (error) {
    console.error('Error searching Milvus:', error.message);
    throw error;
  }
};

export { searchMilvus };
