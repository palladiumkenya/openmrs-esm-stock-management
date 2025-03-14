import React, { useEffect, useMemo } from 'react';
import { ButtonSkeleton, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { OverflowMenuVertical } from '@carbon/react/icons';
import { useStockOperationTypes, useUserRoles } from '../../stock-lookups/stock-lookups.resource';
import { StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';

interface StockOperationTypesSelectorProps {
  onOperationTypeSelected?: (operation: StockOperationType) => void;
  onOperationLoaded?: (operation: StockOperationType[]) => void;
}

const StockOperationTypesSelector: React.FC<StockOperationTypesSelectorProps> = ({
  onOperationTypeSelected,
  onOperationLoaded,
}) => {
  const {
    types: { results: createOperationTypes },
    isLoading,
    error,
  } = useStockOperationTypes();
  const { userRoles } = useUserRoles();

  const filterOperationTypes = useMemo(() => {
    const applicablePrivilegeScopes = userRoles?.operationTypes?.map((p) => p.operationTypeUuid) || [];
    const uniqueApplicablePrivilegeScopes = [...new Set(applicablePrivilegeScopes)];

    return createOperationTypes?.filter((p) => uniqueApplicablePrivilegeScopes.includes(p.uuid)) || [];
  }, [createOperationTypes, userRoles]);

  /** We need to duplicate the adjustment operation type to have two separate operation types i.e Negative Adjustment and Positive Adjustment
    This is because the backend expects the quantity to be negative for negative adjustments and positive for positive adjustments
    The hack is to make the UI work with the backend and assist the user in selecting the correct operation type  without necessarily having
    to remember to key in a negative quantity for negative adjustments
 **/
  const transformedOperationTypes = useMemo(() => {
    return filterOperationTypes.flatMap((operation) => {
      if (operation.operationType === 'adjustment') {
        return [
          { ...operation, name: 'Negative Adjustment' },
          { ...operation, name: 'Positive Adjustment' },
        ];
      }
      return operation;
    });
  }, [filterOperationTypes]);

  useEffect(() => {
    onOperationLoaded?.(transformedOperationTypes);
  }, [transformedOperationTypes, onOperationLoaded]);

  if (isLoading || error) return <ButtonSkeleton />;

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
            key={operation.uuid}
            itemText={operation.name}
            onClick={() => {
              onOperationTypeSelected?.(operation);
            }}
          />
        ))}
    </OverflowMenu>
  ) : null;
};

export default StockOperationTypesSelector;
