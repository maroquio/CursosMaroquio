import { useState, useCallback } from 'react';
import { Modal, Stack, Group, Button, Slider, Text, Box } from '@mantine/core';
import { IconZoomIn, IconZoomOut, IconCheck, IconX } from '@tabler/icons-react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { useImageCrop, type CropArea } from '../../../hooks';

export interface PhotoCropModalProps {
  opened: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
  isProcessing?: boolean;
  cropShape?: 'round' | 'rect';
  outputSize?: number;
  aspectRatio?: number;
  title?: string;
}

export function PhotoCropModal({
  opened,
  imageSrc,
  onClose,
  onConfirm,
  isProcessing = false,
  cropShape = 'round',
  outputSize,
  aspectRatio = 1,
  title = 'Recortar foto de perfil',
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const { cropImage, maxSize } = useImageCrop();
  const finalOutputSize = outputSize ?? maxSize;

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessingCrop(true);
    try {
      const croppedFile = await cropImage(imageSrc, croppedAreaPixels, 'cropped.jpg', 0.85, finalOutputSize);
      onConfirm(croppedFile);
    } catch {
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  const isLoading = isProcessing || isProcessingCrop;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered
      size="md"
      closeOnClickOutside={!isLoading}
      closeOnEscape={!isLoading}
    >
      <Stack gap="md">
        <Box
          pos="relative"
          h={300}
          style={{
            backgroundColor: 'var(--mantine-color-dark-7)',
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape={cropShape}
              showGrid={cropShape === 'rect'}
            />
          )}
        </Box>

        <Group gap="xs" align="center">
          <IconZoomOut size={18} style={{ opacity: 0.7 }} />
          <Slider
            value={zoom}
            onChange={setZoom}
            min={1}
            max={3}
            step={0.1}
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <IconZoomIn size={18} style={{ opacity: 0.7 }} />
        </Group>

        <Text size="xs" c="dimmed" ta="center">
          A imagem final terá {finalOutputSize}x{finalOutputSize} pixels
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={handleClose}
            leftSection={<IconX size={16} />}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            leftSection={<IconCheck size={16} />}
            loading={isLoading}
          >
            Confirmar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
