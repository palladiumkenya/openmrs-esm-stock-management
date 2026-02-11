import React, { useCallback } from 'react';

import { Button } from '@carbon/react';
import { showModal } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { CheckmarkOutline } from '@carbon/react/icons';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { OperationType, type StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';
import useOperationTypePermisions from '../stock-operations-forms/hooks/useOperationTypePermisions';

interface StockOperationApprovalButtonProps {
  operation: StockOperationDTO;
  operationType: OperationType;
}

const StockOperationApprovalButton: React.FC<StockOperationApprovalButtonProps> = ({ operation, operationType }) => {
  const { t } = useTranslation();

  const launchApprovalModal = useCallback(() => {
    const dispose = showModal('stock-operations-modal', {
      title: operationType === OperationType.EXTERNAL_REQUISITION_OPERATION_TYPE ? 'Authorize' : 'Approve',
      operation: operation,
      requireReason: false,
      operationType: OperationType.EXTERNAL_REQUISITION_OPERATION_TYPE,
      closeModal: () => dispose(),
    });
  }, [operation, operationType]);

  return (
    <Button onClick={launchApprovalModal} renderIcon={(props) => <CheckmarkOutline size={16} {...props} />}>
      {operationType === OperationType.EXTERNAL_REQUISITION_OPERATION_TYPE
        ? t('authorize', 'Authorize')
        : t('approve', 'Approve')}
    </Button>
  );
};

export default StockOperationApprovalButton;
