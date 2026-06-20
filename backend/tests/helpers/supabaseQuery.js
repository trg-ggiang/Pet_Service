function createSupabaseQuery(result = { data: null, error: null }, options = {}) {
  const query = {};
  const chainMethods = [
    "delete",
    "eq",
    "gt",
    "ilike",
    "in",
    "insert",
    "is",
    "limit",
    "lt",
    "maybeSingle",
    "neq",
    "not",
    "or",
    "order",
    "select",
    "single",
    "update",
    "upsert",
  ];

  chainMethods.forEach((methodName) => {
    query[methodName] = jest.fn(() => query);
  });

  query.maybeSingle.mockResolvedValue(result);
  query.single.mockResolvedValue(result);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.upsert.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  query.catch = (reject) => Promise.resolve(result).catch(reject);
  query.finally = (callback) => Promise.resolve(result).finally(callback);

  (options.resolveMethods ?? []).forEach((methodName) => {
    query[methodName].mockResolvedValue(result);
  });

  return query;
}

module.exports = {
  createSupabaseQuery,
};
