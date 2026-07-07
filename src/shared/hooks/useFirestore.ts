import { useState, useEffect } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { FirestoreService } from '../firebase/firestore';

export function useFirestore<T extends Record<string, any>>(
  service: FirestoreService<T>,
  tenantId?: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = constraints.length > 0 
          ? await service.query(constraints, tenantId)
          : await service.getAll(tenantId);
        if (active) {
          setData(res);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDocs();
    return () => { active = false; };
  }, [tenantId]);

  return { data, loading, error };
}
export default useFirestore;
