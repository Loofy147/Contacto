export interface SaleCompletedEvent {
  eventType: 'SALE_COMPLETED';
  eventId: string;
  timestamp: Date;
  data: {
    saleId: string;
    merchantId: string;
    totalAmount: number;
    paymentMethod: string;
    itemCount: number;
  };
}

export interface SaleRefundedEvent {
  eventType: 'SALE_REFUNDED';
  eventId: string;
  timestamp: Date;
  data: {
    saleId: string;
    refundId: string;
    merchantId: string;
    refundAmount: number;
  };
}
