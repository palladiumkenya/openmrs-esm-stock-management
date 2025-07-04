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

export interface StockBatchWithUoM extends StockBatchDTO {
  quantityUoM?: string;
  quantityFactor?: string;
  quantityUoMUuid?: string;
  partyName?: string;
  locationUuid?: string;
  partyUuid?: string;
}
