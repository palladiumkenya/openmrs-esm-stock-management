import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { ComboBox, InlineLoading } from "@carbon/react";
import { useStockItemBatchNos } from "./batch-no-selector.resource";
import { StockBatchDTO } from "../../core/api/types/stockItem/StockBatchDTO";
import { useStockItemBatchInformationHook } from "../../stock-items/add-stock-item/batch-information/batch-information.resource";
import { ResourceRepresentation } from "../../core/api/api";
import { formatDisplayDate } from "../../core/utils/datetimeUtils";
import { StockItemInventoryFilter } from "../../stock-items/stock-items.resource";
import { useStockItemsTransactions } from "../../stock-items/add-stock-item/transactions/transactions.resource";

interface BatchNoSelectorProps<T> {
  placeholder?: string;
  stockItemUuid: string;
  batchUuid?: string;
  onBatchNoChanged?: (item: StockBatchDTO) => void;
  title?: string;
  invalid?: boolean;
  invalidText?: ReactNode;

  // Control
  controllerName: string;
  name: string;
  control: Control<FieldValues, T>;
}

const BatchNoSelector = <T,>(props: BatchNoSelectorProps<T>) => {
  const { isLoading, stockItemBatchNos } = useStockItemBatchNos(
    props.stockItemUuid
  );
  const initialSelectedItem = useMemo(
    () =>
      stockItemBatchNos?.find(
        (stockItem) => stockItem.uuid === props.batchUuid
      ) ?? "",
    [stockItemBatchNos, props.batchUuid]
  );

  const { items, setStockItemUuid } = useStockItemBatchInformationHook();
  const [stockItemFilter, setStockItemFilter] =
    useState<StockItemInventoryFilter>({
      startIndex: 0,
      v: ResourceRepresentation.Default,
      q: null,
      totalCount: true,
    });

  const { items: packSize } = useStockItemsTransactions(stockItemFilter);
  useEffect(() => {
    setStockItemUuid(props.stockItemUuid);
    setStockItemFilter({
      startIndex: 0,
      v: ResourceRepresentation.Default,
      totalCount: true,
      stockItemUuid: props.stockItemUuid,
    });
  }, [props.stockItemUuid, setStockItemUuid]);
  const stockItemPackSize = stockItemBatchNos?.flatMap((item) => {
    const matchingBatch = packSize?.find(
      (batch) => batch.stockBatchNo === item.batchNo
    );
    return matchingBatch
      ? [
          {
            packagingUomName: matchingBatch.packagingUomName ?? "",
            packagingUomFactor: matchingBatch.packagingUomFactor ?? "",
            batchNumber: matchingBatch.stockBatchNo,
          },
        ]
      : [];
  });

  const stockItemBatchesInfo = stockItemBatchNos?.map((item) => {
    const matchingBatch = items?.find(
      (batch) => batch.batchNumber === item.batchNo
    );
    const matchingPackSize = stockItemPackSize?.find(
      (pack) => pack.batchNumber === item.batchNo
    );

    return {
      ...item,
      ...(matchingBatch && { quantity: matchingBatch.quantity ?? "" }),
      ...(matchingPackSize && {
        packagingUomName: matchingPackSize.packagingUomName,
        packagingUomFactor: matchingPackSize.packagingUomFactor,
      }),
    };
  });
  if (isLoading) return <InlineLoading status="active" />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Controller
        name={props.controllerName}
        control={props.control}
        render={({ field: { onChange, ref } }) => (
          <ComboBox
            style={{
              flexGrow: "1",
            }}
            titleText={props.title}
            name={props.name}
            control={props.control}
            controllerName={props.controllerName}
            id={props.name}
            size={"sm"}
            items={stockItemBatchesInfo || []}
            onChange={(data: { selectedItem?: StockBatchDTO }) => {
              props.onBatchNoChanged?.(data.selectedItem);
              onChange(data.selectedItem?.uuid);
            }}
            initialSelectedItem={initialSelectedItem}
            itemToString={(s: StockBatchDTO) =>
              s?.batchNo
                ? `${s?.batchNo} (${s?.packagingUomName ?? ""} - ${
                    s?.packagingUomFactor ?? ""
                  }) | Qty: ${s?.quantity ?? ""} | Exp: ${
                    formatDisplayDate(s?.expiration) ?? ""
                  }`
                : ""
            }
            placeholder={props.placeholder}
            invalid={props.invalid}
            invalidText={props.invalidText}
            ref={ref}
          />
        )}
      />
      {isLoading && <InlineLoading status="active" />}
    </div>
  );
};

export default BatchNoSelector;
