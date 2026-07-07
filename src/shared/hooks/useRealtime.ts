import { useState, useEffect } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { FirestoreService } from '../firebase/firestore';

export function useRealtime<T extends Record<string, any>>(
  service: FirestoreService<T>,
  tenantId?: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = service.listen(
        (items) => {
          setData(items);
          setLoading(false);
          setError(null);
        },
        tenantId,
        constraints
      );
      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [tenantId]);

  return { data, loading, error };
}
export default useRealtime;
