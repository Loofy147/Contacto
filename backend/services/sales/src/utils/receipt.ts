export const generateReceiptNumber = async (merchantId: string, tx: any) => {
  return 'REC-' + Date.now();
};
