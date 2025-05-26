import { type StockOperationFilter, useStockOperations } from './stock-operations.resource';
import { useMemo, useState } from 'react';
import { usePagination } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type StockOperationDTO } from '../core/api/types/stockOperation/StockOperationDTO';

export function useStockOperationPages(filter: StockOperationFilter) {
  const { items, isLoading, error } = useStockOperations(filter);

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedItems,
    currentPage,
  } = usePagination<StockOperationDTO>(transformOperations(items?.results), currentPageSize);

  const { t } = useTranslation();
  /**
   * Updates operationTypeName for adjustment operations based on item quantities and operationTypeUuid.
   * - Negative Adjustment if quantity < 0
   * - Positive Adjustment if quantity > 0
   */
  function transformOperations(data) {
    return data?.map((operation) => {
      if (operation.operationTypeUuid?.trim() === '11111111-1111-1111-1111-111111111111') {
        const hasNegative = operation.stockOperationItems.some((item) => item.quantity < 0);
        const hasPositive = operation.stockOperationItems.some((item) => item.quantity > 0);
        if (hasNegative && !hasPositive) {
          return { ...operation, operationTypeName: 'Negative Adjustment' };
        } else if (hasPositive && !hasNegative) {
          return { ...operation, operationTypeName: 'Positive Adjustment' };
        }
      }
      return operation;
    });
  }

  const tableHeaders = useMemo(
    () => [
      {
        id: 0,
        header: t('type', 'Type'),
        key: 'operationTypeName',
      },
      {
        id: 1,
        header: t('number', 'Number'),
        key: 'operationNumber',
      },
      {
        id: 2,
        header: t('stockOperationItems', 'Items'),
        key: 'stockOperationItems',
      },
      {
        id: 3,
        header: t('status', 'Status'),
        key: 'status',
      },
      {
        id: 4,
        header: t('location', 'Location'),
        key: 'location',
      },
      {
        id: 5,
        header: t('responsiblePerson', 'Responsible Person'),
        key: 'responsiblePerson',
      },
      {
        id: 6,
        header: t('date', 'Date'),
        key: 'operationDate',
      },
      {
        id: 7,
        key: 'details',
      },
      { key: 'actions', header: '' },
    ],
    [t],
  );

  return {
    items: paginatedItems,
    totalItems: items?.totalCount,
    currentPage,
    currentPageSize,
    paginatedItems,
    goTo,
    pageSizes,
    isLoading,
    error,
    setPageSize,
    tableHeaders,
  };
}
