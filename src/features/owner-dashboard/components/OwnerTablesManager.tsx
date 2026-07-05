import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { zodResolver } from '../../../utils/zodResolver';

// UI Kit components
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Table from '../../../components/ui/Table/Table';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import Dialog from '../../../components/ui/Dialog/Dialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, QrCode, Sliders } from 'lucide-react';

const tableSchema = z.object({
  number: z.string().min(1, 'Table number is required'),
  seatingCapacity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Seating capacity must be at least 1 person')
  )
});

type TTableForm = z.infer<typeof tableSchema>;

interface ITableItem {
  id: string;
  number: string;
  seatingCapacity: number;
  qrCodeUrl: string;
}

export const OwnerTablesManager: React.FC = () => {
  const { user } = useAuth();
  
  const [tables, setTables] = useState<ITableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and Dialog Trigger states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<ITableItem | null>(null);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Modal display states
  const [qrCodeData, setQrCodeData] = useState<{ url: string; number: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TTableForm>({
    resolver: zodResolver(tableSchema)
  });

  // Fetch from restaurants/{restaurantId}/tables
  const fetchTables = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const colRef = collection(db, 'restaurants', user.tenantId, 'tables');
      const querySnap = await getDocs(query(colRef));
      const list: ITableItem[] = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ITableItem);
      });

      // Sort sorting
      list.sort((a, b) => Number(a.number) - Number(b.number));

      setTables(list);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load branch tables config.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [user]);

  const openAddModal = () => {
    setEditingTable(null);
    reset({
      number: '',
      seatingCapacity: 4
    });
    setIsFormOpen(true);
  };

  const openEditModal = (tbl: ITableItem) => {
    setEditingTable(tbl);
    reset({
      number: tbl.number,
      seatingCapacity: tbl.seatingCapacity
    });
    setIsFormOpen(true);
  };

  // Submit Operations
  const onSubmitForm = async (data: TTableForm) => {
    if (!user?.tenantId) return;
    setIsSubmitting(true);
    try {
      const tblId = editingTable ? editingTable.id : `TBL-${data.number}`;
      const docRef = doc(db, 'restaurants', user.tenantId, 'tables', tblId);

      // Generate dynamic QR Code Link matching router specs
      const customerPortalUrl = `${window.location.origin}/r/${user.tenantId}/table/${data.number}`;

      await setDoc(docRef, {
        number: data.number,
        seatingCapacity: data.seatingCapacity,
        qrCodeUrl: customerPortalUrl,
        updatedAt: new Date().toISOString()
      });

      toast.success(editingTable ? 'Table updated successfully!' : 'Table added successfully!');
      setIsFormOpen(false);
      fetchTables();
    } catch (e: any) {
      console.error(e);
      toast.error('Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDeleteConfirm = (id: string) => {
    setDeletingTableId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.tenantId || !deletingTableId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'tables', deletingTableId);
      await deleteDoc(docRef);
      toast.success('Table layout document deleted.');
      fetchTables();
    } catch (e) {
      console.error(e);
      toast.error('Delete failed.');
    } finally {
      setIsDeleteOpen(false);
      setDeletingTableId(null);
    }
  };

  const showQrCode = (tbl: ITableItem) => {
    setQrCodeData({
      url: tbl.qrCodeUrl,
      number: tbl.number
    });
  };

  // Table Columns
  const columns = [
    {
      header: 'Table Number',
      accessor: (row: ITableItem) => <span className="font-bold text-textPearl text-sm">Table #{row.number}</span>
    },
    {
      header: 'Seating Capacity',
      accessor: (row: ITableItem) => <span className="text-slate-400 font-semibold">{row.seatingCapacity} seats</span>
    },
    {
      header: 'QR Scanning URL',
      accessor: (row: ITableItem) => (
        <span className="text-[10px] text-slate-500 font-semibold select-all break-all">{row.qrCodeUrl}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: ITableItem) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => showQrCode(row)}
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-800/50"
            title="Display QR code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-800/50"
            title="Edit Table"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerDeleteConfirm(row.id)}
            className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10"
            title="Delete Table"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Layout header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl text-left">Dining layout</h1>
          <p className="text-xs text-mutedAsh text-left">Configure physical seating tables and generate QR ordering cards.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center space-x-1.5 self-start">
          <Plus className="w-4 h-4" />
          <span>Add Seating Table</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Querying tables list..." />
        </div>
      ) : tables.length === 0 ? (
        <Card className="p-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
          <Sliders className="w-10 h-10 text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-450">No tables configured. Add tables to start scanning.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-slate-850">
          <Table 
            columns={columns} 
            data={tables} 
            keyExtractor={(row) => row.id} 
          />
        </Card>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTable ? 'Edit Table Settings' : 'Add Dining Table'}
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 text-left">
          <Input
            label="Table Code / Number"
            type="text"
            placeholder="E.g. 5, Bar-2"
            error={errors.number?.message}
            disabled={isSubmitting}
            {...register('number')}
          />

          <Input
            label="Seating Capacity"
            type="number"
            placeholder="4"
            error={errors.seatingCapacity?.message}
            disabled={isSubmitting}
            {...register('seatingCapacity')}
          />

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/40 mt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
            >
              {editingTable ? 'Save Changes' : 'Confirm Table'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Dining Table"
        message="Are you sure you want to delete this table? Diners scanning this table's QR code will get route errors."
        confirmLabel="Remove"
        isDangerous={true}
      />

      {/* QR Code display Modal */}
      <Modal
        isOpen={qrCodeData !== null}
        onClose={() => setQrCodeData(null)}
        title={`Table #${qrCodeData?.number} QR Code`}
      >
        {qrCodeData && (
          <div className="space-y-4 text-center">
            {/* Visual placeholder representation of dynamic QR code */}
            <div className="w-48 h-48 bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center mx-auto shadow-xl">
              <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white">
                <QrCode className="w-14 h-14 text-primary animate-pulse" />
                <span className="text-[10px] font-bold mt-2 uppercase tracking-wide">Scan Table {qrCodeData.number}</span>
              </div>
            </div>
            
            <p className="text-xs text-mutedAsh select-all bg-slate-950/40 p-2.5 rounded-lg border border-slate-855 break-all max-w-xs mx-auto">
              {qrCodeData.url}
            </p>
            
            <Button
              type="button"
              className="w-full mt-4"
              onClick={() => window.open(qrCodeData.url, '_blank')}
            >
              Open Scan Link
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OwnerTablesManager;
