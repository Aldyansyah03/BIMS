// Mock data invoice sementara BE belum ready
// Nanti diganti dengan data real dari API

export const MOCK_MY_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-1793549933-1',
    amount: '150000.00',
    status: 'paid',
    due_date: '2026-11-01',
    paid_at: '2026-10-28',
    subscription: {
      package: { name: 'Paket Bulanan Starter' }
    }
  },
  {
    id: 2,
    invoice_number: 'INV-1793549933-2',
    amount: '150000.00',
    status: 'unpaid',
    due_date: '2026-12-01',
    paid_at: null,
    subscription: {
      package: { name: 'Paket Bulanan Starter' }
    }
  },
  {
    id: 3,
    invoice_number: 'INV-1793549933-3',
    amount: '150000.00',
    status: 'paid',
    due_date: '2026-10-01',
    paid_at: '2026-09-29',
    subscription: {
      package: { name: 'Paket Bulanan Starter' }
    }
  },
]

export const MOCK_ALL_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-1793549933-1',
    amount: '150000.00',
    status: 'paid',
    due_date: '2026-11-01',
    paid_at: '2026-10-28',
    tenant: { name: 'FachrulCode' },
    subscription: { package: { name: 'Paket Bulanan Starter' } }
  },
  {
    id: 2,
    invoice_number: 'INV-1793549933-2',
    amount: '150000.00',
    status: 'unpaid',
    due_date: '2026-12-01',
    paid_at: null,
    tenant: { name: 'FachrulCode' },
    subscription: { package: { name: 'Paket Bulanan Starter' } }
  },
  {
    id: 3,
    invoice_number: 'INV-2891234567-1',
    amount: '300000.00',
    status: 'paid',
    due_date: '2026-11-01',
    paid_at: '2026-10-25',
    tenant: { name: 'Bimbel Cahaya Ilmu' },
    subscription: { package: { name: 'Paket Bulanan Pro' } }
  },
  {
    id: 4,
    invoice_number: 'INV-3812345678-1',
    amount: '150000.00',
    status: 'unpaid',
    due_date: '2026-10-15',
    paid_at: null,
    tenant: { name: 'LBB Tunas Mandiri' },
    subscription: { package: { name: 'Paket Bulanan Starter' } }
  },
]
