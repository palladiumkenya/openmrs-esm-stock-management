import React, { useCallback, useEffect, useMemo } from 'react';
import { ButtonSkeleton, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { OverflowMenuVertical } from '@carbon/react/icons';
import { showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { OperationType, type StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';
import { launchStockoperationAddOrEditWorkSpace } from '../stock-operation.utils';
import useFilteredOperationTypesByRoles from '../stock-operations-forms/hooks/useFilteredOperationTypesByRoles';

interface ExtendedStockOperationType extends StockOperationType {
  adjustmentType?: 'positive' | 'negative';
}

const StockOperationTypesSelector = () => {
  const { t } = useTranslation();
  const { error, isLoading, operationTypes } = useFilteredOperationTypesByRoles();
  /** We need to duplicate the adjustment operation type to have two separate operation types i.e Negative Adjustment and Positive Adjustment
    This is because the backend expects the quantity to be negative for negative adjustments and positive for positive adjustments
    The hack is to make the UI work with the backend and assist the user in selecting the correct operation type  without necessarily having
    to remember to key in a negative quantity for negative adjustments
 **/

  const transformedOperationTypes = useMemo(() => {
    return operationTypes
      .filter((operation) => operation.operationType !== OperationType.STOCK_ISSUE_OPERATION_TYPE)
      .flatMap((operation): ExtendedStockOperationType[] => {
        if (operation.operationType === 'adjustment') {
          return [
            { ...operation, name: 'Negative Adjustment', adjustmentType: 'negative' },
            { ...operation, name: 'Positive Adjustment', adjustmentType: 'positive' },
          ];
        }
        return [operation];
      });
  }, [operationTypes]);

  const handleSelect = useCallback(
    (stockOperationType: ExtendedStockOperationType) => {
      launchStockoperationAddOrEditWorkSpace(t, stockOperationType, undefined);
    },
    [t],
  );

  useEffect(() => {
    if (error) {
      showSnackbar({
        kind: 'error',
        title: t('stockOperationError', 'Error loading stock operation types'),
        subtitle: error?.message,
      });
    }
  }, [error, t]);

  if (isLoading) return <ButtonSkeleton />;

  if (error) return null;

  return transformedOperationTypes && transformedOperationTypes.length ? (
    <OverflowMenu
      renderIcon={() => (
        <>
          Start New&nbsp;&nbsp;
          <OverflowMenuVertical size={16} />
        </>
      )}
      menuOffset={{ right: '-100px' }}
      style={{
        backgroundColor: '#007d79',
        backgroundImage: 'none',
        color: '#fff',
        minHeight: '1rem',
        padding: '.95rem !important',
        width: '8rem',
        marginRight: '0.5rem',
        whiteSpace: 'nowrap',
      }}
    >
      {transformedOperationTypes
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((operation) => (
          <OverflowMenuItem
            key={`${operation.uuid}-${operation.adjustmentType || 'default'}`}
            itemText={operation.name}
            onClick={() => {
              handleSelect(operation);
            }}
          />
        ))}
    </OverflowMenu>
  ) : null;
};

export default StockOperationTypesSelector;
