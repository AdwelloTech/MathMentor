import { Query } from 'mongoose';

export const optimizeQuery = <T>(query: Query<any, any>) => {
  return query.lean().exec();
};

export const paginateQuery = <T>(
  query: Query<any, any>,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit).lean();
};

export const selectFields = <T>(
  query: Query<any, any>,
  fields: string[]
) => {
  return query.select(fields.join(' ')).lean();
};

export const sortQuery = <T>(
  query: Query<any, any>,
  sortBy: string = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
) => {
  const sortOrder = order === 'asc' ? 1 : -1;
  return query.sort({ [sortBy]: sortOrder });
};

export const createIndexes = async (model: any, indexes: any[]) => {
  try {
    for (const index of indexes) {
      await model.collection.createIndex(index.fields, index.options || {});
    }
    console.log(`Created indexes for ${model.modelName}`);
  } catch (error) {
    console.error(`Error creating indexes for ${model.modelName}:`, error);
  }
};

export const optimizeFindOne = <T>(
  query: Query<any, any>,
  fields?: string[]
) => {
  let optimizedQuery = query.lean();
  if (fields && fields.length > 0) {
    optimizedQuery = optimizedQuery.select(fields.join(' '));
  }
  return optimizedQuery;
};

export const batchQuery = async <T>(
  model: any,
  ids: string[],
  fields?: string[]
): Promise<T[]> => {
  let query = model.find({ _id: { $in: ids } }).lean();
  
  if (fields && fields.length > 0) {
    query = query.select(fields.join(' '));
  }
  
  return await query.exec();
};

