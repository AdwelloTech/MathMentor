// Stub supabase client - Supabase has been removed from frontend
// All database operations should use backend API endpoints instead

const createQueryBuilder = () => {
  const qb = {
    select: (..._args: any[]) => qb,
    eq: (..._args: any[]) => qb,
    single: () => ({
      data: null,
      error: new Error('Supabase removed - use backend API endpoints instead')
    }),
    order: (..._args: any[]) => qb,
    in: (..._args: any[]) => qb,
    gte: (..._args: any[]) => qb,
    limit: (..._args: any[]) => qb,
    update: (..._args: any[]) => qb,
    insert: (..._args: any[]) => ({
      data: null,
      error: new Error('Supabase removed - use backend API endpoints instead')
    }),
    delete: (..._args: any[]) => qb,
    data: [],
    error: new Error('Supabase removed - use backend API endpoints instead'),
    count: 0
  };
  return qb;
};

export const supabase = {
  from: (..._args: any[]) => createQueryBuilder(),
  rpc: (..._args: any[]) => ({
    data: null,
    error: new Error('Supabase RPC removed - use backend API endpoints instead')
  }),
  storage: {
    from: (..._args: any[]) => ({
      upload: (..._args: any[]) => ({
        data: null,
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      }),
      getPublicUrl: (..._args: any[]) => ({
        data: { publicUrl: '' },
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      }),
      download: (..._args: any[]) => ({
        data: null,
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      }),
      remove: (..._args: any[]) => ({
        data: null,
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      })
    })
  },
  auth: {
    getUser: (..._args: any[]) => ({
      data: { user: null },
      error: new Error('Supabase auth removed - use backend API endpoints instead')
    }),
    getSession: (..._args: any[]) => ({
      data: { session: null },
      error: new Error('Supabase auth removed - use backend API endpoints instead')
    }),
    updatePassword: (..._args: any[]) => ({
      data: { user: null },
      error: new Error('Supabase auth removed - use backend API endpoints instead')
    })
  }
};

export const auth = supabase.auth;

export default supabase;
