import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, InlineLoading, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { ErrorState, getCoreTranslation, restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { type StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import {
  type StopOperationAction,
  type StopOperationActionType,
} from '../../core/api/types/stockOperation/StockOperationAction';
import {
  executeStockOperationAction,
  submitExternalRequisition,
  useFacilityCode,
  useProgramCodeAndProcessingPeriod,
} from '../stock-operations.resource';
import { extractErrorMessagesFromResponse } from '../../constants';
import { handleMutate } from '../../utils';
import styles from './stock-operations.scss';
import { OperationType } from '../../core/api/types/stockOperation/StockOperationType';
import dayjs from 'dayjs';

interface StockOperationsModalProps {
  title: string;
  requireReason: boolean;
  operation: StockOperationDTO;
  operationType: OperationType;
  closeModal: () => void;
}

const StockOperationsModal: React.FC<StockOperationsModalProps> = ({
  title,
  requireReason,
  operation,
  closeModal,
  operationType,
}) => {
  const confirmType = title.toLocaleLowerCase().trim();
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { error, facilityCode, isLoading } = useFacilityCode();
  const {
    error: periodOrProgramError,
    isLoading: isLoadingProgramAndPeriod,
    processingPeriod,
    programCode,
  } = useProgramCodeAndProcessingPeriod();

  const handleClick = async (event) => {
    event.preventDefault();

    setIsApproving(true);

    let actionName: StopOperationActionType | null = null;

    switch (confirmType) {
      case 'submit':
        actionName = 'SUBMIT';
        break;
      case 'dispatch':
        actionName = 'DISPATCH';
        break;
      case 'complete':
        actionName = 'COMPLETE';
        break;
      case 'complete dispatch':
        actionName = 'COMPLETE';
        break;
      case 'cancel':
        actionName = 'CANCEL';
        break;
      case 'reject':
        actionName = 'REJECT';
        break;
      case 'return':
        actionName = 'RETURN';
        break;
      case 'authorize':
      case 'approve':
        actionName = 'APPROVE';
        break;
      case 'dispatchapproval':
        // messagePrefix = "dispatch";
        actionName = 'DISPATCH';
        break;
    }
    if (!actionName) {
      return;
    }

    const payload: StopOperationAction = {
      name: actionName,
      uuid: operation?.uuid,
      reason: notes,
    };

    try {
      if (operationType === OperationType.EXTERNAL_REQUISITION_OPERATION_TYPE) {
        await submitExternalRequisition({
          sourceOrderId: operation.operationNumber,
          rnrId: operation.uuid,
          facilityCode: facilityCode,
          programCode,
          periodId: processingPeriod,
          clientSubmitedTime: dayjs().toISOString(),
          sourceApplication: 'KenyaEMR',
          emergency: operation.requestType === 'EMERGENCY' ? true : false,
          status: 'AUTHORIZED',
          products: operation.stockOperationItems.map((item) => ({
            productCode: item.etcdProductId,
            quantityDispensed: 805,
            quantityReceived: 942,
            beginningBalance: 81,
            stockInHand: 216,
            stockOutDays: 0,
            lossesAndAdjustments: [
              {
                quantity: 2,
                typeCode: 'EXP',
                typeName: 'Expired',
              },
            ],

            quantityRequested: item.quantity,
            reasonForRequestedQuantity: item.reasonForRequestedQuantity,
          })),
        });
      }
      // submit action
      await executeStockOperationAction(payload);
      showSnackbar({
        title: t('operationSuccessTitle', '{{title}} Operation', { title }),
        subtitle: t('operationSuccessful', 'You have successfully {{title}} operation', {
          title,
        }),
        kind: 'success',
      }),
        closeModal();
      handleMutate(`${restBaseUrl}/stockmanagement/stockoperation`);
    } catch (err) {
      setIsApproving(false);
      const errorMessages = extractErrorMessagesFromResponse(err);
      const message = errorMessages[0].replace(/[[\]]/g, '');
      showSnackbar({
        title: t('stockOperationErrorTitle', 'Error on saving form'),
        subtitle: t('stockOperationErrorDescription', 'Details: {{message}}', {
          message,
        }),
        kind: 'error',
      });
      closeModal();
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading || isLoadingProgramAndPeriod)
    return (
      <div>
        <ModalHeader closeModal={closeModal} title={t('operationModalTitle', '{{title}} Operation', { title })} />
        <ModalBody>
          <InlineLoading />
        </ModalBody>
      </div>
    );

  if (error || periodOrProgramError)
    return (
      <ErrorState
        headerTitle={t('errorFetchingFacilityCode', 'Error retreiving facility code')}
        error={error ?? periodOrProgramError}
      />
    );

  return (
    <div>
      <Form onSubmit={handleClick}>
        <ModalHeader closeModal={closeModal} title={t('operationModalTitle', '{{title}} Operation', { title })} />
        <ModalBody>
          <div className={styles.modalBody}>
            <section className={styles.section}>
              <h5 className={styles.section}>
                {t('confirmationMessage', 'Would you really like to {{title}} the operation ?', { title })}
              </h5>
            </section>
            <br />
            {requireReason && (
              <section className={styles.section}>
                <TextArea
                  labelText={t('notes', 'Please explain the reason:')}
                  id="nextNotes"
                  name="nextNotes"
                  invalidText="Required"
                  maxCount={500}
                  enableCounter
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>
            {getCoreTranslation('cancel')}
          </Button>
          {isApproving ? <InlineLoading /> : <Button type="submit">{t('submit', 'Submit')}</Button>}
        </ModalFooter>
      </Form>
    </div>
  );
};

export default StockOperationsModal;
