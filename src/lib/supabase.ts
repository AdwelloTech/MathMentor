// Stub supabase client - Supabase has been removed from frontend
// All database operations should use backend API endpoints instead

export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => ({
          data: null,
          error: new Error('Supabase removed - use backend API endpoints instead')
        }),
        order: () => ({
          data: [],
          error: new Error('Supabase removed - use backend API endpoints instead')
        })
      }),
      eq: () => ({
        single: () => ({
          data: null,
          error: new Error('Supabase removed - use backend API endpoints instead')
        }),
        order: () => ({
          data: [],
          error: new Error('Supabase removed - use backend API endpoints instead')
        })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => ({
            data: null,
            error: new Error('Supabase removed - use backend API endpoints instead')
          })
        })
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => ({
          data: null,
          error: new Error('Supabase removed - use backend API endpoints instead')
        })
      })
    }),
    delete: () => ({
      eq: () => ({
        data: null,
        error: new Error('Supabase removed - use backend API endpoints instead')
      })
    })
  }),
  rpc: () => ({
    data: null,
    error: new Error('Supabase RPC removed - use backend API endpoints instead')
  }),
  storage: {
    from: () => ({
      upload: () => ({
        data: null,
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      }),
      getPublicUrl: () => ({
        data: { publicUrl: '' },
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      }),
      remove: () => ({
        data: null,
        error: new Error('Supabase storage removed - use backend API endpoints instead')
      })
    })
  },
  auth: {
    getUser: () => ({
      data: { user: null },
      error: new Error('Supabase auth removed - use backend API endpoints instead')
    })
  }
};

export const auth = supabase.auth;

export default supabase;
