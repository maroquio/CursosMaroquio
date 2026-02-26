import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Text,
  Image,
  ActionIcon,
  Stack,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { IconPhoto, IconX, IconUpload } from '@tabler/icons-react';
import { PhotoCropModal } from '../feedback/PhotoCropModal';

export interface ImagePickerProps {
  value?: string;
  onChange: (file: File | null) => void;
  placeholder?: string;
  hint?: string;
  cropShape?: 'round' | 'rect';
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
  aspectRatio?: number;
  accept?: string;
  maxFileSize?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp';
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function ImagePicker({
  value,
  onChange,
  placeholder = 'Clique para selecionar uma imagem',
  hint,
  cropShape = 'rect',
  outputSize = 512,
  outputWidth,
  outputHeight,
  aspectRatio,
  accept = DEFAULT_ACCEPT,
  maxFileSize = DEFAULT_MAX_SIZE,
  disabled = false,
  error,
  label,
}: ImagePickerProps) {
  const theme = useMantineTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropModalOpened, setCropModalOpened] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const displayUrl = previewUrl || value;

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = accept.split(',').map((t) => t.trim());
      if (!validTypes.includes(file.type)) {
        setFileError('Tipo de arquivo não suportado');
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
        setFileError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      setFileError(null);

      // Create data URL for cropping
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
        setCropModalOpened(true);
      };
      reader.readAsDataURL(file);

      // Reset input to allow selecting the same file again
      event.target.value = '';
    },
    [accept, maxFileSize]
  );

  const handleCropConfirm = useCallback(
    (croppedFile: File) => {
      // Create preview URL from cropped file
      const url = URL.createObjectURL(croppedFile);

      // Revoke previous preview URL to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
      setCropModalOpened(false);
      setSelectedImageSrc(null);
      onChange(croppedFile);
    },
    [onChange, previewUrl]
  );

  const handleCropClose = useCallback(() => {
    setCropModalOpened(false);
    setSelectedImageSrc(null);
  }, []);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(null);
      onChange(null);
    },
    [onChange, previewUrl]
  );

  const displayError = error || fileError;

  return (
    <Stack gap="xs">
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <UnstyledButton
        onClick={handleClick}
        disabled={disabled}
        style={{
          width: '100%',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <Box
          style={{
            position: 'relative',
            border: `2px dashed ${
              displayError
                ? 'var(--mantine-color-red-6)'
                : displayUrl
                  ? 'transparent'
                  : 'var(--mantine-color-dark-4)'
            }`,
            borderRadius: theme.radius.md,
            backgroundColor: displayUrl
              ? 'transparent'
              : 'var(--mantine-color-dark-6)',
            overflow: 'hidden',
            transition: 'border-color 150ms ease',
          }}
        >
          {displayUrl ? (
            <Box pos="relative">
              <Image
                src={displayUrl}
                alt="Preview"
                h={200}
                fit="contain"
                style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}
              />
              <ActionIcon
                variant="filled"
                color="red"
                size="sm"
                radius="xl"
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </Box>
          ) : (
            <Stack align="center" justify="center" h={200} gap="xs">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--mantine-color-dark-5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPhoto size={24} style={{ opacity: 0.5 }} />
              </Box>
              <Text size="sm" c="dimmed" ta="center">
                {placeholder}
              </Text>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--mantine-color-blue-5)',
                }}
              >
                <IconUpload size={14} />
                <Text size="xs">Selecionar arquivo</Text>
              </Box>
            </Stack>
          )}
        </Box>
      </UnstyledButton>

      {hint && !displayError && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}

      {displayError && (
        <Text size="xs" c="red">
          {displayError}
        </Text>
      )}

      <PhotoCropModal
        opened={cropModalOpened}
        imageSrc={selectedImageSrc}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
        cropShape={cropShape}
        outputSize={outputSize}
        outputWidth={outputWidth}
        outputHeight={outputHeight}
        aspectRatio={aspectRatio ?? (outputWidth && outputHeight ? outputWidth / outputHeight : undefined)}
        title="Ajustar imagem"
      />
    </Stack>
  );
}
