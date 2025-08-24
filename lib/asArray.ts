export function asArray<T = any>(v: any): T[] {
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    if (Array.isArray(v?.items)) return v.items;
  
    // common keys we’re using
    if (Array.isArray(v?.collections)) return v.collections;
    if (Array.isArray(v?.data?.collections)) return v.data.collections;
    if (Array.isArray(v?.products)) return v.products;
    if (Array.isArray(v?.data?.products)) return v.data.products;
    if (Array.isArray(v?.orders)) return v.orders;
    if (Array.isArray(v?.data?.orders)) return v.data.orders;
  
    return [];
  }