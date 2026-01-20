import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComboBox, SelectSkeleton } from '@carbon/react';
import { type StockBatchWithUoM } from '../../../core/api/types/stockItem/StockBatchDTO';
import { formatForDatePicker } from '../../../constants';
import { useStockItemBatchInformationHook } from '../../../stock-items/add-stock-item/batch-information/batch-information.resource';
import { useStockItemBatchNumbers } from '../hooks/useStockItemBatchNumbers';
import { type StockOperationType } from '../../../core/api/types/stockOperation/StockOperationType';
import { OperationType } from '../../../core/api/types/stockOperation/StockOperationType';
import { useLocationsTaggedMainStoreAndSubstore, useUserRoles } from '../../../stock-lookups/stock-lookups.resource';

interface BatchNoSelectorProps {
  stockItemUuid: string;
  initialValue?: string | null;
  onValueChange?: (value: string | null) => void;
  onStockStatusChange?: (isOutOfStock: boolean) => void;
  error?: string;
  stockOperationType?: StockOperationType;
}

const BatchNoSelector: React.FC<BatchNoSelectorProps> = ({
  stockItemUuid,
  error,
  initialValue,
  onValueChange,
  onStockStatusChange,
  stockOperationType,
}) => {
  const { isLoading, stockItemBatchNos } = useStockItemBatchNumbers(stockItemUuid);
  const { t } = useTranslation();
  const { items, setStockItemUuid, isLoading: isLoadingBatchinfo } = useStockItemBatchInformationHook();
  const currentUserRoles = useUserRoles();
  const { locationsTaggedMainStoreAndSubstore } = useLocationsTaggedMainStoreAndSubstore();
  const stockIssueLocationsForCurrentUser = getMatchingUserLocations(
    currentUserRoles,
    locationsTaggedMainStoreAndSubstore,
  );

  const totalQuantity = useMemo(() => {
    if (!items?.length) return 0;
    return items.reduce((total, batch) => {
      return total + (Number(batch.quantity) || 0);
    }, 0);
  }, [items]);

  const isStockIssueOperation = stockOperationType?.operationType === OperationType.STOCK_ISSUE_OPERATION_TYPE;
  const isOutOfStock = totalQuantity === 0;

  useEffect(() => {
    setStockItemUuid(stockItemUuid);
  }, [stockItemUuid, setStockItemUuid]);

  // Notify parent component about stock status for stock issue operations
  useEffect(() => {
    if (isStockIssueOperation && onStockStatusChange) {
      onStockStatusChange(isOutOfStock);
    }
  }, [isStockIssueOperation, isOutOfStock, onStockStatusChange]);

  // Auto-clear batch selection only when going out of stock (not when coming back in stock)
  useEffect(() => {
    if (isStockIssueOperation && isOutOfStock && initialValue) {
      onValueChange?.(null);
    }
  }, [isStockIssueOperation, isOutOfStock, initialValue, onValueChange]);

  const stockItemBatchesInfo = useMemo(() => {
    if (!stockItemBatchNos) return [];

    return stockItemBatchNos.flatMap((item) => {
      const matchingBatches = items?.filter((batch) => batch.batchNumber === item.batchNo) || [];

      if (matchingBatches.length > 0) {
        return matchingBatches.map((batch) => ({
          ...item,
          ...batch,
          quantity: String(batch.quantity),
        })) as StockBatchWithUoM[];
      }
      return [item as StockBatchWithUoM];
    });
  }, [stockItemBatchNos, items]);
  const allowedStockIssueLocationNames = useMemo(() => {
    return new Set(stockIssueLocationsForCurrentUser.map((loc) => loc.locationName?.trim()).filter(Boolean));
  }, [stockIssueLocationsForCurrentUser]);

  const filteredBatches = useMemo(() => {
    if (!stockItemBatchesInfo) return [];

    return stockItemBatchesInfo.filter((batch) => {
      const quantity = typeof batch.quantity === 'string' ? parseFloat(batch.quantity) : batch.quantity;

      if (isNaN(quantity) || quantity <= 0) return false;

      // Apply location restriction ONLY for stock issue operations
      if (!isStockIssueOperation) {
        return true;
      }

      // For stock issue: must be in allowed locations
      if (allowedStockIssueLocationNames.size === 0) return true; // fallback: no restriction

      const locationName = (batch.partyName || '').trim();
      return allowedStockIssueLocationNames.has(locationName);
    });
  }, [stockItemBatchesInfo, allowedStockIssueLocationNames, isStockIssueOperation]);

  const initialSelectedItem = useMemo(
    () => filteredBatches.find((batch) => batch.uuid === initialValue) ?? null,
    [filteredBatches, initialValue],
  );

  const formatQuantityDisplay = useCallback(
    (batch: StockBatchWithUoM): string => {
      if (batch.quantity === undefined) return t('unknown', 'Unknown');

      const quantity = typeof batch.quantity === 'string' ? parseFloat(batch.quantity) : batch.quantity;

      if (isNaN(quantity)) return t('unknown', 'Unknown');

      const baseQuantity = quantity.toString();

      if (!batch.quantityUoM) return baseQuantity;

      const withUnit = `${baseQuantity} ${batch.quantityUoM}`;

      if (!batch.quantityFactor) return withUnit;

      const factor = parseFloat(batch.quantityFactor);
      return !isNaN(factor) && factor > 1 ? `${withUnit} (${factor} units each)` : withUnit;
    },
    [t],
  );

  const itemToString = useCallback(
    (batch: StockBatchWithUoM | null): string => {
      if (!batch?.batchNo) return '';

      const quantityDisplay = formatQuantityDisplay(batch);
      const expiryDate = batch.expiration ? formatForDatePicker(batch.expiration) : t('noExpiry', 'No expiry');
      const location = batch?.partyName ? batch?.partyName : '';

      return `${batch.batchNo} | Qty: ${quantityDisplay} | Expiry: ${expiryDate} | ${location}`;
    },
    [formatQuantityDisplay, t],
  );

  const handleChange = useCallback(
    (data: { selectedItem?: StockBatchWithUoM | null }) => {
      onValueChange?.(data.selectedItem?.uuid ?? null);
    },
    [onValueChange],
  );

  if (isLoading || isLoadingBatchinfo) {
    return <SelectSkeleton role="progressbar" />;
  }

  // For stock issue operations when out of stock, disable the batch selector
  if (isStockIssueOperation && isOutOfStock) {
    return (
      <ComboBox
        id="stockBatchUuid"
        invalid={false}
        items={[]}
        itemToString={() => ''}
        name="stockBatchUuid"
        disabled={true}
        placeholder={t('outOfStock', 'Out of stock - no batches available')}
        selectedItem={null}
        style={{ flexGrow: 1 }}
        titleText={t('batchNo', 'Batch no.')}
        helperText={t('outOfStockHelper', 'This item is out of stock. Quantity will be set to 0.')}
      />
    );
  }

  // For stock issue operations with stock, batch selection is required
  const isRequired = isStockIssueOperation && !isOutOfStock;

  return (
    <ComboBox
      id="stockBatchUuid"
      invalid={!!error}
      invalidText={error}
      items={filteredBatches}
      itemToString={itemToString}
      name="stockBatchUuid"
      onChange={handleChange}
      placeholder={`${t('filter', 'Filter')}...`}
      selectedItem={initialSelectedItem}
      style={{ flexGrow: 1 }}
      titleText={isRequired ? `${t('batchNo', 'Batch no.')} *` : t('batchNo', 'Batch no.')}
    />
  );
};

function getMatchingUserLocations(userRoles, fhirLocations) {
  if (!userRoles?.userRoles?.locations || !Array.isArray(userRoles.userRoles.locations)) {
    return [];
  }
  // Get the list of location UUIDs from the FHIR locations array
  const fhirLocationIds = fhirLocations
    .map((location) => (typeof location === 'string' ? location : location?.id || location?.resource?.id))
    .filter(Boolean); // remove any undefined/null

  if (fhirLocationIds.length === 0) {
    return [];
  }
  // Filter user's locations to only those whose locationUuid is in the FHIR list
  const matchingLocations = userRoles?.userRoles?.locations.filter((userLoc) =>
    fhirLocationIds.includes(userLoc.locationUuid),
  );

  return matchingLocations;
}

export default BatchNoSelector;
