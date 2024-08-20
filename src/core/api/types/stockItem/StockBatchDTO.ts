export interface StockBatchDTO {
  uuid: string;
  batchNo: string;
  expiration: Date;
  stockItemUuid: string;
  quantity: string;
  quantityFactor: string;
  quantityUoM: string;
  voided: boolean;
}
