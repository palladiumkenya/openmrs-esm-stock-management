export interface StockBatchDTO {
  uuid: string;
  batchNo: string;
  expiration: Date;
  stockItemUuid: string;
  quantity: string;
  voided: boolean;
  brandName?: string;
  manufacturerName?: string;
}
