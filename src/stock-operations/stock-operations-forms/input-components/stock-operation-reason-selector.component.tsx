import { ComboBox, InlineNotification, SelectSkeleton } from '@carbon/react';
import { useConfig } from '@openmrs/esm-framework';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type ConfigObject } from '../../../config-schema';
import { type Concept } from '../../../core/api/types/concept/Concept';
import { useConcept } from '../../../stock-lookups/stock-lookups.resource';
import { OperationType } from '../../../core/api/types/stockOperation/StockOperationType';

type StockOperationReasonSelectorProps = {
  stockOperationType: string;
  adjustmentType?: 'positive' | 'negative';
};

const StockOperationReasonSelector: React.FC<StockOperationReasonSelectorProps> = ({
  stockOperationType,
  adjustmentType,
}) => {
  const { stockAdjustmentReasonUUID, stockNegativeReasonUuid, stockPositiveReasonUuid, stockTakeReasonUUID } =
    useConfig<ConfigObject>();

  const getOperationReasonUUID = () => {
    if (stockOperationType === OperationType.STOCK_TAKE_OPERATION_TYPE) {
      return stockTakeReasonUUID;
    }

    if (stockOperationType === 'adjustment' && adjustmentType) {
      return adjustmentType === 'positive' ? stockPositiveReasonUuid : stockNegativeReasonUuid;
    }

    return stockAdjustmentReasonUUID;
  };

  const operationReason = getOperationReasonUUID();

  const form = useFormContext<{ reasonUuid: string }>();
  const {
    isLoading,
    error,
    items: { answers: reasons },
  } = useConcept(operationReason);
  const { t } = useTranslation();

  if (isLoading) return <SelectSkeleton role="progressbar" />;

  if (error)
    return (
      <InlineNotification
        lowContrast
        kind="error"
        title={t('reasonError', 'Error loading reasons concepts')}
        subtitle={error?.message}
      />
    );

  const filteredReasons = reasons || [];

  const getTitleText = () => {
    if (stockOperationType === 'adjustment' && adjustmentType) {
      return adjustmentType === 'positive'
        ? t('positiveAdjustmentReason', 'Positive Adjustment Reason')
        : t('negativeAdjustmentReason', 'Negative Adjustment Reason');
    }
    if (stockOperationType === OperationType.STOCK_TAKE_OPERATION_TYPE) {
      return t('stockTakeReason', 'Stock Take Reason');
    }
    return t('reason', 'Reason');
  };

  const getPlaceholderText = () => {
    if (stockOperationType === 'adjustment' && adjustmentType) {
      return adjustmentType === 'positive'
        ? t('choosePositiveReason', 'Choose a positive adjustment reason')
        : t('chooseNegativeReason', 'Choose a negative adjustment reason');
    }
    return t('chooseAReason', 'Choose a reason');
  };

  return (
    <Controller
      control={form.control}
      name={'reasonUuid'}
      render={({ field, fieldState: { error } }) => (
        <ComboBox
          readOnly={field.disabled}
          titleText={getTitleText()}
          placeholder={getPlaceholderText()}
          name={'reasonUuid'}
          id={'reasonUuid'}
          size="lg"
          items={filteredReasons}
          initialSelectedItem={filteredReasons?.find((p) => p.uuid === field.value)}
          selectedItem={filteredReasons.find((p) => p.uuid === field.value)}
          itemToString={(item?: Concept) => (item && item?.display ? `${item?.display}` : '')}
          onChange={(data: { selectedItem?: Concept }) => {
            field.onChange(data?.selectedItem?.uuid);
          }}
          ref={field.ref}
          invalid={error?.message}
          invalidText={error?.message}
        />
      )}
    />
  );
};

export default StockOperationReasonSelector;
