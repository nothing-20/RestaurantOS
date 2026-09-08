export const emailService = {
  async sendStaffInvitation(data: {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    tenantId: string;
    createdBy: string;
  }): Promise<{ success: boolean; employeeId?: string; error?: string }> {
    const res = await fetch('/api/send-staff-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to send staff invitation email.');
    }
    return res.json();
  },

  async sendWelcomeEmail(data: {
    email: string;
    fullName: string;
    restaurantName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/send-welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to send welcome email.');
    }
    return res.json();
  },

  async sendOrderConfirmation(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    restaurantName: string;
    total: string;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/send-order-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to send order confirmation email.');
    }
    return res.json();
  },

  async sendReservationConfirmation(data: {
    email: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    partySize: number;
    tableNumber?: string | number;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/send-reservation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to send reservation confirmation email.');
    }
    return res.json();
  },

  async sendInvoiceEmail(data: {
    email: string;
    customerName: string;
    invoiceId: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    subtotal: string;
    tax: string;
    total: string;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to send invoice email.');
    }
    return res.json();
  },
};
