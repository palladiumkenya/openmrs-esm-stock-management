import { StockItem } from "./StockItem";

export interface StockBatchDTO {
  uuid: string;
  batchNo: string;
  expiration: Date;
  stockItemUuid: string;
  quantity: string;
  quantityFactor: string;
  quantityUoM: string;
  packagingUomFactor?: string;
  packagingUomName?: string;
  voided: boolean;
}
