import { useMemo } from 'react';
import {
  useIsSessionLocationMainStore,
  useStockOperationTypes,
  useUserRoles,
} from '../../../stock-lookups/stock-lookups.resource';
import { EXTERNAL_REQUISITION_UUID, REQUISITION_UUID } from '../../../constants';

const useFilteredOperationTypesByRoles = () => {
  const {
    types: { results },
    isLoading: isStockOperationTypesLoading,
    error: stockOperationTypesError,
  } = useStockOperationTypes();
  const {
    error: sessionLocationError,
    isLoading: isLoadingSessionLoacation,
    isMainstore,
  } = useIsSessionLocationMainStore();

  const { userRoles, isLoading: isUserRolesLoading, error: userRolesError } = useUserRoles();

  const operationTypes = useMemo(() => {
    const applicablePrivilegeScopes = userRoles?.operationTypes?.map((p) => p.operationTypeUuid) || [];
    const uniqueApplicablePrivilegeScopes = [...new Set(applicablePrivilegeScopes)];

    const operations = results?.filter((p) => uniqueApplicablePrivilegeScopes.includes(p.uuid)) || [];
    if (isMainstore) {
      return operations.filter((op) => op.uuid !== REQUISITION_UUID);
    } else {
      return operations.filter((op) => op.uuid !== EXTERNAL_REQUISITION_UUID);
    }
  }, [results, userRoles, isMainstore]);

  const isLoading = isStockOperationTypesLoading || isUserRolesLoading;
  const error = stockOperationTypesError || userRolesError;

  return {
    operationTypes,
    isLoading: isLoading || isLoadingSessionLoacation,
    error: error ?? sessionLocationError,
  };
};

export default useFilteredOperationTypesByRoles;
