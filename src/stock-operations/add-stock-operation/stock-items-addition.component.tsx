import React, { useEffect, useState } from 'react';
import { StockOperationDTO } from '../../core/api/types/stockOperation/StockOperationDTO';
import { SaveStockOperation } from '../../stock-items/types';
import { StockOperationType } from '../../core/api/types/stockOperation/StockOperationType';
import { InitializeResult } from './types';
import {
  Button,
  DataTable,
  InlineLoading,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { isDesktop } from '@openmrs/esm-framework';
import { StockOperationItemDTO } from '../../core/api/types/stockOperation/StockOperationItemDTO';
import { getStockOperationUniqueId } from '../stock-operation.utils';
import { useTranslation } from 'react-i18next';
import { FieldArrayWithId, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useValidationSchema } from './validationSchema';
import StockItemsAdditionRow from './stock-items-addition-row.component';
import { ArrowRight } from '@carbon/react/icons';
import { errorAlert } from '../../core/utils/alert';

import styles from './stock-items-addition.component.scss';
import StockItemSearch from './stock-item-search/stock-item-search.component';

interface StockItemsAdditionProps {
  isEditing?: boolean;
  canEdit?: boolean;
  model?: StockOperationDTO;
  onSave?: SaveStockOperation;
  operation: StockOperationType;
  setup: InitializeResult;
}

const StockItemsAddition: React.FC<StockItemsAdditionProps> = ({
  setup: {
    hasQtyRequested: showQuantityRequested,
    requiresBatchUuid,
    requiresActualBatchInfo: requiresActualBatchInformation,
    canCaptureQuantityPrice,
    batchBalance,
    batchNos,
    canUpdateItemsBatchInformation: canUpdateBatchInformation,
    itemUoM,
  },
  canEdit = true,
  model,
  onSave,
  operation,
}) => {
  const { t } = useTranslation();
  const { operationType } = operation ?? {};
  const validationSchema = useValidationSchema(operationType);
  const handleSave = async (item: { stockItems: StockOperationItemDTO[] }) => {
    if (item.stockItems.length == 0) {
      errorAlert('No stock items', "You haven't added any stock items, tap the add button to add some.");
      return;
    }

    model.stockOperationItems = item?.stockItems;
    // If the operation is a negative adjustment, we need to ensure that the quantity is negative.
    if (
      model.operationTypeUuid === '11111111-1111-1111-1111-111111111111' &&
      operation.name === 'Negative Adjustment'
    ) {
      model.stockOperationItems = model.stockOperationItems.map((item) => ({
        ...item,
        quantity: item.quantity > 0 ? -item.quantity : item.quantity,
      }));
    }

    await onSave?.(model);
  };

  const formMethods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      stockItems: model?.stockOperationItems ?? [{ uuid: `new-item-1`, id: `new-item-1` }],
    },
    mode: 'onSubmit',
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = formMethods;

  const [isSaving] = useState(false);

  const formFieldMethods = useFieldArray({
    name: 'stockItems',
    control,
  });
  const { fields, append, remove } = formFieldMethods;
  const [selectedItems, setSelectedItems] = useState<
    | FieldArrayWithId<{ stockItems: StockOperationItemDTO[] }, 'stockItems', 'id'>
    | (() => FieldArrayWithId<{ stockItems: StockOperationItemDTO[] }, 'stockItems', 'id'>)
  >();

  useEffect(() => {
    if (fields.length > 0) {
      const lastItemIndex = fields.length - 1;
      const item = fields[lastItemIndex];
      setSelectedItems(item);
    }
  }, [fields]);

  const headers = [
    {
      key: 'item',
      header: t('item', 'Item'),
      styles: { width: '40% !important' },
    },
    {
      key: 'itemDetails',
      header: t('itemDetails', 'Item Details'),
      styles: { width: '20% !important' },
    },
    ...(showQuantityRequested
      ? [
          {
            key: 'quantityrequested',
            header: t('quantityRequested', 'Quantity Requested'),
          },
        ]
      : []),
    ...(requiresBatchUuid || requiresActualBatchInformation
      ? [
          {
            key: 'batch',
            header: t('batchNo', 'Batch No'),
            styles: { width: '15% !important' },
          },
        ]
      : []),
    ...(requiresActualBatchInformation
      ? [
          {
            key: 'expiry',
            header: t('expiry', 'Expiry'),
          },
        ]
      : []),
    ...(requiresBatchUuid
      ? [
          {
            key: 'expiry',
            header: t('expiry', 'Expiry'),
          },
        ]
      : []),

    {
      key: 'quantity',
      header: showQuantityRequested ? t('qtyIssued', 'Qty Issued') : t('qty', 'Qty'),
    },
    {
      key: 'quantityuom',
      header: t('quantityUom', 'Qty UoM'),
    },
    ...(canCaptureQuantityPrice
      ? [
          {
            key: 'purchaseprice',
            header: t('purchasePrice', 'Purchase Price'),
          },
        ]
      : []),
  ];

  const addNewItem = () => {
    const itemId = `new-item-${getStockOperationUniqueId()}`;
    append({
      uuid: itemId,
      id: itemId,
      stockItemUuid: null,
      stockItemName: '',
    });
  };

  return (
    <FormProvider {...formMethods}>
      <div style={{ margin: '10px' }}>
        <div className={styles.tableContainer}>
          <StockItemSearch {...formFieldMethods} />
          <DataTable
            rows={model?.stockOperationItems ?? [{ uuid: `new-item-1`, id: `new-item-1` }]}
            headers={headers}
            isSortable={false}
            useZebraStyles={true}
            className={styles.dataTable}
            render={({ headers, getHeaderProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header: any) => (
                        <TableHeader
                          {...getHeaderProps({
                            header,
                            isSortable: false,
                          })}
                          className={isDesktop ? styles.desktopHeader : styles.tabletHeader}
                          style={header?.styles}
                          key={`${header.key}`}
                        >
                          {header.header?.content ?? header?.header}
                        </TableHeader>
                      ))}
                      {canEdit && (
                        <TableHeader className={styles.tableHeader}>
                          <div className={styles.TableBody}>
                            <Button
                              name="save"
                              type="button"
                              className="submitButton"
                              onClick={() => handleSubmit(handleSave)()}
                              kind="primary"
                              renderIcon={ArrowRight}
                            >
                              {isSaving ? <InlineLoading /> : t('next', 'Next')}
                            </Button>
                          </div>
                        </TableHeader>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <StockItemsAdditionRow
                      rows={model?.stockOperationItems ?? [{ uuid: `new-item-1`, id: `new-item-1` }]}
                      batchBalance={batchBalance}
                      batchNos={batchNos}
                      control={control}
                      setValue={setValue}
                      errors={errors}
                      remove={remove}
                      append={append}
                      canEdit={canEdit}
                      showQuantityRequested={showQuantityRequested}
                      requiresActualBatchInformation={requiresActualBatchInformation}
                      requiresBatchUuid={requiresBatchUuid}
                      canUpdateBatchInformation={canUpdateBatchInformation}
                      canCapturePurchasePrice={canCaptureQuantityPrice}
                      itemUoM={itemUoM}
                      fields={fields}
                    />{' '}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          ></DataTable>
        </div>
      </div>
    </FormProvider>
  );
};

export default StockItemsAddition;
