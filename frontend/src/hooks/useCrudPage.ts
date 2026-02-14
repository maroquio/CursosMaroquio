import { useEffect, useState, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useNotification } from './useNotification';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CrudApi<T, CreateReq, UpdateReq> {
  list: () => Promise<ApiResponse<T[]>>;
  create: (data: CreateReq) => Promise<ApiResponse<T>>;
  update: (id: string, data: UpdateReq) => Promise<ApiResponse<T>>;
  delete: (id: string) => Promise<ApiResponse<unknown>>;
}

interface CrudMessages {
  fetchError: string;
  fetchErrorMessage: string;
  createSuccess: string;
  createSuccessMessage: string;
  createError: string;
  createErrorMessage: string;
  updateSuccess: string;
  updateSuccessMessage: string;
  updateError: string;
  updateErrorMessage: string;
  deleteSuccess: string;
  deleteSuccessMessage: string;
  deleteError: string;
  deleteErrorMessage: string;
}

export interface UseCrudPageOptions<T, CreateReq, UpdateReq> {
  api: CrudApi<T, CreateReq, UpdateReq>;
  messages: CrudMessages;
  getId: (item: T) => string;
  sortItems?: (items: T[]) => T[];
}

export interface UseCrudPageReturn<T, CreateReq, UpdateReq> {
  items: T[];
  isLoading: boolean;
  formModalOpened: boolean;
  deleteModalOpened: boolean;
  itemToEdit: T | null;
  itemToDelete: T | null;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleCreate: () => void;
  handleEdit: (item: T) => void;
  handleDelete: (item: T) => void;
  handleFormSubmit: (values: CreateReq | UpdateReq) => Promise<void>;
  confirmDelete: () => Promise<void>;
  openFormModal: () => void;
  closeFormModal: () => void;
  closeDeleteModal: () => void;
  refetch: () => Promise<void>;
}

export function useCrudPage<T, CreateReq = Partial<T>, UpdateReq = Partial<T>>(
  options: UseCrudPageOptions<T, CreateReq, UpdateReq>
): UseCrudPageReturn<T, CreateReq, UpdateReq> {
  const { api, messages, getId, sortItems } = options;
  const { t } = useTranslation();
  const notification = useNotification();

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.list();
      if (response.success && response.data) {
        setItems(sortItems ? sortItems(response.data) : response.data);
      }
    } catch {
      notification.error({
        title: t(messages.fetchError),
        message: t(messages.fetchErrorMessage),
      });
    } finally {
      setIsLoading(false);
    }
  }, [api, messages.fetchError, messages.fetchErrorMessage, notification, t, sortItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = useCallback(() => {
    setItemToEdit(null);
    openFormModal();
  }, [openFormModal]);

  const handleEdit = useCallback((item: T) => {
    setItemToEdit(item);
    openFormModal();
  }, [openFormModal]);

  const handleDelete = useCallback((item: T) => {
    setItemToDelete(item);
    openDeleteModal();
  }, [openDeleteModal]);

  const handleFormSubmit = useCallback(async (values: CreateReq | UpdateReq) => {
    setIsSubmitting(true);
    try {
      if (itemToEdit) {
        const response = await api.update(getId(itemToEdit), values as UpdateReq);
        if (response.success) {
          notification.success({
            title: t(messages.updateSuccess),
            message: t(messages.updateSuccessMessage),
          });
          closeFormModal();
          fetchItems();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await api.create(values as CreateReq);
        if (response.success) {
          notification.success({
            title: t(messages.createSuccess),
            message: t(messages.createSuccessMessage),
          });
          closeFormModal();
          fetchItems();
        } else {
          throw new Error(response.error);
        }
      }
    } catch {
      notification.error({
        title: t(itemToEdit ? messages.updateError : messages.createError),
        message: t(itemToEdit ? messages.updateErrorMessage : messages.createErrorMessage),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [itemToEdit, api, getId, notification, t, messages, closeFormModal, fetchItems]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(getId(itemToDelete));
      if (response.success) {
        notification.success({
          title: t(messages.deleteSuccess),
          message: t(messages.deleteSuccessMessage),
        });
        fetchItems();
      } else {
        throw new Error(response.error);
      }
    } catch {
      notification.error({
        title: t(messages.deleteError),
        message: t(messages.deleteErrorMessage),
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
      setItemToDelete(null);
    }
  }, [itemToDelete, api, getId, notification, t, messages, closeDeleteModal, fetchItems]);

  return {
    items,
    isLoading,
    formModalOpened,
    deleteModalOpened,
    itemToEdit,
    itemToDelete,
    isSubmitting,
    isDeleting,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit,
    confirmDelete,
    openFormModal,
    closeFormModal,
    closeDeleteModal,
    refetch: fetchItems,
  };
}
