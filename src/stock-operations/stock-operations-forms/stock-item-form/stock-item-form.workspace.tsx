import {
  Button,
  ButtonSet,
  Column,
  DatePicker,
  DatePickerInput,
  Form,
  NumberInput,
  Stack,
  TextInput,
} from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConfig, useLayoutType } from '@openmrs/esm-framework';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type z } from 'zod';
import { type ConfigObject } from '../../../config-schema';
import { DATE_PICKER_CONTROL_FORMAT, DATE_PICKER_FORMAT, formatForDatePicker, today } from '../../../constants';
import {
  operationFromString,
  type StockOperationType,
  OperationType,
} from '../../../core/api/types/stockOperation/StockOperationType';
import { useStockItem } from '../../../stock-items/stock-items.resource';
import {
  type BaseStockOperationItemFormData,
  getStockOperationItemFormSchema,
  getStockOperationItemBaseSchema,
} from '../../validation-schema';
import useOperationTypePermisions from '../hooks/useOperationTypePermisions';
import BatchNoSelector from '../input-components/batch-no-selector.component';
import QtyUomSelector from '../input-components/quantity-uom-selector.component';
import styles from './stock-item-form.scss';

export interface StockItemFormProps {
  stockOperationType: StockOperationType;
  stockOperationItem: BaseStockOperationItemFormData;
  onSave?: (data: BaseStockOperationItemFormData) => void;
  onBack?: () => void;
}

const StockItemForm: React.FC<StockItemFormProps> = ({ stockOperationType, stockOperationItem, onSave, onBack }) => {
  const isTablet = useLayoutType() === 'tablet';
  const operationType = useMemo(() => {
    return operationFromString(stockOperationType.operationType);
  }, [stockOperationType]);
  const formSchema = useMemo(() => {
    return getStockOperationItemFormSchema(operationType);
  }, [operationType]);
  const baseSchema = useMemo(() => {
    return getStockOperationItemBaseSchema(operationType);
  }, [operationType]);
  const operationTypePermision = useOperationTypePermisions(stockOperationType);
  const { useItemCommonNameAsDisplay } = useConfig<ConfigObject>();

  const fields = baseSchema.keyof().options;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...stockOperationItem,
      isOutOfStock: stockOperationItem.isOutOfStock || false,
      quantity: stockOperationItem.quantity, // Preserve original quantity
    },
    mode: 'all',
  });
  const { t } = useTranslation();
  const { item } = useStockItem(form.getValues('stockItemUuid'));

  const [isOutOfStock, setIsOutOfStock] = useState(stockOperationItem.isOutOfStock || false);
  const [originalQuantity, setOriginalQuantity] = useState(stockOperationItem.quantity || 0);
  const isStockIssueOperation = operationType === OperationType.STOCK_ISSUE_OPERATION_TYPE;

  // Store the original quantity on mount
  useEffect(() => {
    if (stockOperationItem.quantity !== undefined && stockOperationItem.quantity !== null) {
      setOriginalQuantity(stockOperationItem.quantity);
    }
  }, [stockOperationItem.quantity]);

  const commonName = useMemo(() => {
    if (!useItemCommonNameAsDisplay) return;
    const drugName = item?.drugName ? `(Drug name: ${item.drugName})` : undefined;
    return `${item?.commonName || t('noCommonNameAvailable', 'No common name available') + (drugName ?? '')}`;
  }, [item, useItemCommonNameAsDisplay, t]);

  const drugName = useMemo(() => {
    if (useItemCommonNameAsDisplay) return;
    const commonName = item?.commonName ? `(Common name: ${item.commonName})` : undefined;
    return `${item?.drugName || t('noDrugNameAvailable', 'No drug name available') + (commonName ?? '')}`;
  }, [item, useItemCommonNameAsDisplay, t]);

  // Handle stock status changes from BatchNoSelector
  const handleStockStatusChange = (outOfStock: boolean) => {
    setIsOutOfStock(outOfStock);
    form.setValue('isOutOfStock', outOfStock);

    // If out of stock during stock issue, set quantity to 0 and clear batch
    if (isStockIssueOperation && outOfStock) {
      form.setValue('quantity', 0);
      form.setValue('stockBatchUuid' as any, null);
      // Trigger validation to clear any errors
      form.trigger(['quantity', 'stockBatchUuid']);
    } else if (isStockIssueOperation && !outOfStock) {
      // When stock becomes available, restore the original quantity if it was cleared
      const currentQuantity = form.getValues('quantity');
      if (currentQuantity === 0 && originalQuantity > 0) {
        form.setValue('quantity', originalQuantity);
      }
      // Ensure batch selection is validated
      form.trigger(['stockBatchUuid', 'quantity']);
    }
  };

  // Watch for quantity changes and enforce 0 if out of stock
  useEffect(() => {
    if (isStockIssueOperation && isOutOfStock) {
      const subscription = form.watch((value, { name }) => {
        if (name === 'quantity' && value.quantity !== 0) {
          form.setValue('quantity', 0);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isStockIssueOperation, isOutOfStock]);

  // Initialize isOutOfStock in form when component mounts or stock status changes
  useEffect(() => {
    form.setValue('isOutOfStock', isOutOfStock);
  }, [form, isOutOfStock]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Form submission data:', {
      ...data,
      isOutOfStock,
      isStockIssueOperation,
    });

    // Ensure isOutOfStock is included in the saved data
    const dataToSave = {
      ...data,
      isOutOfStock,
      // For out of stock items, ensure quantity is 0 and batch is null
      ...(isStockIssueOperation && isOutOfStock
        ? {
            quantity: 0,
            stockBatchUuid: null,
          }
        : {}),
    };

    console.log('Saving data:', dataToSave);
    onSave?.(dataToSave);
  };

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
      <Stack gap={4} className={styles.grid}>
        <p className={styles.title}>{useItemCommonNameAsDisplay ? commonName : drugName}</p>

        {(operationTypePermision.requiresActualBatchInfo || operationTypePermision.requiresBatchUuid) &&
          fields.includes('batchNo' as any) && (
            <Column>
              <Controller
                control={form.control}
                defaultValue={stockOperationItem?.batchNo}
                name={'batchNo' as any}
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    label={t('qty', 'Qty')}
                    maxLength={50}
                    {...field}
                    invalidText={error?.message}
                    invalid={error?.message}
                    placeholder={t('batchNumber', 'Batch Number')}
                    labelText={t('batchNumber', 'Batch Number')}
                    id="batchNumber"
                  />
                )}
              />
            </Column>
          )}

        {operationTypePermision.requiresBatchUuid && !operationTypePermision.requiresActualBatchInfo && (
          <Column>
            <Controller
              control={form.control}
              name={'stockBatchUuid' as any}
              render={({ field, fieldState: { error } }) => (
                <BatchNoSelector
                  initialValue={stockOperationItem?.stockBatchUuid}
                  onValueChange={field.onChange}
                  onStockStatusChange={handleStockStatusChange}
                  stockItemUuid={stockOperationItem.stockItemUuid}
                  error={error?.message}
                  stockOperationType={stockOperationType}
                />
              )}
            />
          </Column>
        )}
        {(operationTypePermision.requiresActualBatchInfo || operationTypePermision.requiresBatchUuid) &&
          fields.includes('expiration' as any) && (
            <Column>
              <Controller
                control={form.control}
                name={'expiration' as any}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    id={`expiration`}
                    datePickerType="single"
                    minDate={formatForDatePicker(today())}
                    locale="en"
                    className={styles.datePickerInput}
                    dateFormat={DATE_PICKER_CONTROL_FORMAT}
                    value={field.value}
                    name={field.name}
                    disabled={field.disabled}
                    onChange={([newDate]) => {
                      field.onChange(newDate);
                    }}
                  >
                    <DatePickerInput
                      autoComplete="off"
                      id={`expiration-input`}
                      name="operationDate"
                      placeholder={DATE_PICKER_FORMAT}
                      labelText={t('expiriation', 'Expiration Date')}
                      invalid={error?.message}
                      invalidText={error?.message}
                    />
                  </DatePicker>
                )}
              />
            </Column>
          )}

        <Column>
          <Controller
            control={form.control}
            name="quantity"
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                allowEmpty
                className="small-placeholder-text"
                disableWheel
                hideSteppers
                id={`qty`}
                {...field}
                label={t('qty', 'Qty')}
                invalidText={error?.message}
                invalid={error?.message}
                disabled={isStockIssueOperation && isOutOfStock}
                value={field.value}
                onChange={(e, { value }) => {
                  // For out of stock items, always enforce 0
                  if (isStockIssueOperation && isOutOfStock) {
                    field.onChange(0);
                  } else {
                    field.onChange(value);
                  }
                }}
              />
            )}
          />
        </Column>
        <Column>
          <Controller
            control={form.control}
            name={'stockItemPackagingUOMUuid'}
            render={({ field, fieldState: { error } }) => (
              <QtyUomSelector
                stockItemUuid={stockOperationItem?.stockItemUuid}
                intiallvalue={field.value}
                error={error?.message}
                onValueChange={field.onChange}
              />
            )}
          />
        </Column>

        {(operationTypePermision.requiresActualBatchInfo || operationTypePermision.requiresBatchUuid) &&
          fields.includes('brandName') && (
            <Column>
              <Controller
                control={form.control}
                defaultValue={stockOperationItem?.batchNo}
                name={'brandName'}
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    maxLength={50}
                    {...field}
                    invalidText={error?.message}
                    invalid={error?.message}
                    placeholder={t('brandName', 'Brand Name')}
                    labelText={t('brandName', 'Brand Name')}
                    id="brandName"
                  />
                )}
              />
            </Column>
          )}

        {(operationTypePermision.requiresActualBatchInfo || operationTypePermision.requiresBatchUuid) &&
          fields.includes('manufacturerName') && (
            <Column>
              <Controller
                control={form.control}
                defaultValue={stockOperationItem?.batchNo}
                name={'manufacturerName'}
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    maxLength={50}
                    {...field}
                    invalidText={error?.message}
                    invalid={error?.message}
                    placeholder={t('manufacturerName', 'Manufacturer Name')}
                    labelText={t('manufacturerName', 'Manufacturer Name')}
                    id="manufacturerName"
                  />
                )}
              />
            </Column>
          )}

        {operationTypePermision?.canCaptureQuantityPrice && fields.includes('purchasePrice' as any) && (
          <Column>
            <Controller
              control={form.control}
              name={'purchasePrice' as any}
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  labelText={t('purchasePrice', 'Purchase Price')}
                  invalid={error?.message}
                  invalidText={error?.message}
                  id={`purchaseprice`}
                  placeholder={t('purchasePrice', 'Purchase Price')}
                />
              )}
            />
          </Column>
        )}
      </Stack>

      <ButtonSet
        className={classNames(styles.buttonSet, {
          [styles.tablet]: isTablet,
          [styles.desktop]: !isTablet,
        })}
      >
        <Button className={styles.button} kind="secondary" onClick={onBack}>
          {t('discard', 'Discard')}
        </Button>
        <Button className={styles.button} kind="primary" type="submit" disabled={form.formState.isSubmitting}>
          {t('save', 'Save')}
        </Button>
      </ButtonSet>
    </Form>
  );
};

export default StockItemForm;
