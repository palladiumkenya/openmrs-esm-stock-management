import { InlineLoading } from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type StockOperationType } from '../../../core/api/types/stockOperation/StockOperationType';
import useOperationTypePermisions from '../hooks/useOperationTypePermisions';
import { useStockItemBatchNumbers } from '../hooks/useStockItemBatchNumbers';

type StockOperationItemBrandNameCellProps = {
  operation: StockOperationType;
  stockBatchUuid?: string;
  stockItemUuid: string;
  brandName?: string;
};

const StockOperationItemBrandNameCell: React.FC<StockOperationItemBrandNameCellProps> = ({
  operation,
  stockBatchUuid,
  stockItemUuid,
  brandName,
}) => {
  const operationTypePermission = useOperationTypePermisions(operation);
  const { isLoading, stockItemBatchNos } = useStockItemBatchNumbers(stockItemUuid);
  const { t } = useTranslation();

  const _brandName = useMemo(
    () => stockItemBatchNos?.find((item) => item.uuid === stockBatchUuid)?.brandName,
    [stockItemBatchNos, stockBatchUuid],
  );

  if (isLoading) <InlineLoading description={t('loading', 'Loading')} iconDescription={t('loading', 'Loading')} />;

  if (operationTypePermission.requiresActualBatchInfo || operationTypePermission.requiresBatchUuid)
    return <p>{brandName ?? '--'}</p>;

  return <p>--</p>;
};

export default StockOperationItemBrandNameCell;
