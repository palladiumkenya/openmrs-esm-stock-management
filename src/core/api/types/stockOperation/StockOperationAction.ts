export interface StopOperationAction {
  name: StopOperationActionType;
  reason?: string | null;
  uuid: string;
  lineItems?: StockOperationActionLineItem[];
}

export interface StockOperationActionLineItem {
  uuid: string;
  amount: number;
  packagingUoMUuId: string;
}

export const StopOperationActionTypes = [
  'SUBMIT',
  'DISPATCH',
  'APPROVE',
  'RETURN',
  'REJECT',
  'COMPLETE',
  'CANCEL',
  'QUANTITY_RECEIVED',
] as const;
export type StopOperationActionType = (typeof StopOperationActionTypes)[number];

export interface ExternalRequisitionPayload {
  sourceOrderId: string;
  rnrId: string;
  facilityCode: string;
  programCode: string;
  periodId: string;
  clientSubmitedTime: string;
  sourceApplication: string;
  emergency: boolean;
  status: string;
  products: Product[];
}

export interface Product {
  productCode: string;
  quantityDispensed: number;
  quantityReceived: number;
  beginningBalance: number;
  stockInHand: number;
  stockOutDays: number;
  lossesAndAdjustments: LossesAndAdjustment[];
  quantityRequested: number;
  reasonForRequestedQuantity: string;
}

export interface LossesAndAdjustment {
  quantity: number;
  typeCode: string;
  typeName: string;
}
