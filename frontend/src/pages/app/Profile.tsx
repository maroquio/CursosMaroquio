import { useState, useRef } from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Avatar,
  Button,
  TextInput,
  Divider,
  Modal,
  PasswordInput,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconMail,
  IconLock,
  IconDeviceFloppy,
  IconCamera,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';
import { PageHeader, ThemedPaper, PrimaryButton, PhotoCropModal } from '../../components/common';
import { useThemedStyles, useAsyncAction } from '../../hooks';
import { formatPhone } from '../../utils/formatters';

export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, uploadPhoto, changePassword, deleteAccount } = useAuthStore();
  const { dangerZoneStyle } = useThemedStyles();

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // Async actions with useAsyncAction hook
  const { execute: saveProfile, isLoading: isUpdatingProfile } = useAsyncAction(
    updateProfile,
    { successMessage: 'Perfil atualizado com sucesso!' }
  );

  const { execute: doUploadPhoto, isLoading: isUploadingPhoto } = useAsyncAction(
    uploadPhoto,
    { successMessage: 'Foto atualizada com sucesso!' }
  );

  const { execute: doChangePassword, isLoading: isChangingPassword } = useAsyncAction(
    changePassword,
    {
      successMessage: 'Senha alterada com sucesso!',
      onSuccess: () => passwordForm.reset(),
    }
  );

  const { execute: doDeleteAccount, isLoading: isDeletingAccount } = useAsyncAction(
    deleteAccount,
    {
      successMessage: 'Sua conta foi excluída com sucesso.',
      onSuccess: () => navigate('/login'),
    }
  );

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const profileForm = useForm({
    initialValues: {
      fullName: user?.fullName || '',
      phone: formatPhone(user?.phone || ''),
    },
    validate: {
      fullName: (value) =>
        value.trim().length < 3 ? 'Nome deve ter pelo menos 3 caracteres' : null,
    },
  });

  // Password form
  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value.trim().length === 0 ? 'Senha atual é obrigatória' : null,
      newPassword: (value) =>
        value.trim().length < 8 ? 'Nova senha deve ter pelo menos 8 caracteres' : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Senhas não conferem' : null,
    },
  });

  const userInitial =
    user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.fullName || 'User';

  // Handle profile photo click
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Handle photo selection - opens crop modal
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notifications.show({
        title: 'Erro',
        message: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      notifications.show({
        title: 'Erro',
        message: 'Arquivo muito grande. Tamanho máximo: 2MB.',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    // Create object URL and open crop modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setCropModalOpen(true);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cropped photo confirm
  const handleCroppedPhotoConfirm = async (croppedFile: File) => {
    await doUploadPhoto(croppedFile);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setCropModalOpen(false);
  };

  // Handle crop modal close
  const handleCropModalClose = () => {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setCropModalOpen(false);
  };

  // Handle profile update
  const handleSaveProfile = (values: typeof profileForm.values) => {
    saveProfile(values);
  };

  // Handle password change
  const handleChangePassword = (values: typeof passwordForm.values) => {
    doChangePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Digite sua senha para confirmar a exclusão',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    await doDeleteAccount(deletePassword);
    setDeleteModalOpen(false);
    setDeletePassword('');
  };

  // Get avatar URL or use initials
  const avatarUrl = user?.photoUrl ? `${import.meta.env.VITE_API_URL || ''}${user.photoUrl}` : null;

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader title={t('nav.profile')} subtitle="Gerencie suas informações pessoais" />

        {/* Profile Photo Section */}
        <ThemedPaper p="lg">
          <Stack gap="lg">
            <Group>
              <Box pos="relative">
                <Avatar
                  size="xl"
                  radius="xl"
                  color="indigo"
                  variant="gradient"
                  src={avatarUrl}
                >
                  {!avatarUrl && userInitial}
                </Avatar>
                {isUploadingPhoto && (
                  <Box
                    pos="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                    }}
                  >
                    <Loader size="sm" color="white" />
                  </Box>
                )}
              </Box>
              <div>
                <Text fw={600} size="lg" style={{ fontFamily: '"Outfit", sans-serif' }}>
                  {userName}
                </Text>
                <Text c="dimmed" size="sm">
                  {user?.email}
                </Text>
              </div>
            </Group>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />

            <Button
              variant="light"
              size="sm"
              leftSection={<IconCamera size={16} />}
              style={{ alignSelf: 'flex-start' }}
              onClick={handlePhotoClick}
              loading={isUploadingPhoto}
            >
              Alterar foto
            </Button>
          </Stack>
        </ThemedPaper>

        {/* Personal Information Section */}
        <ThemedPaper p="lg">
          <form onSubmit={profileForm.onSubmit(handleSaveProfile)}>
            <Stack gap="md">
              <Title order={4} style={{ fontFamily: '"Outfit", sans-serif' }}>
                Informações Pessoais
              </Title>

              <TextInput
                label="Nome completo"
                placeholder="Seu nome completo"
                leftSection={<IconUser size={16} />}
                {...profileForm.getInputProps('fullName')}
              />

              <TextInput
                label="Email"
                placeholder="seu@email.com"
                leftSection={<IconMail size={16} />}
                value={user?.email || ''}
                disabled
              />

              <TextInput
                label="Telefone"
                placeholder="(11) 99999-9999"
                value={profileForm.values.phone}
                onChange={(e) => profileForm.setFieldValue('phone', formatPhone(e.target.value))}
                error={profileForm.errors.phone}
              />

              <PrimaryButton
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                style={{ alignSelf: 'flex-start' }}
                loading={isUpdatingProfile}
              >
                Salvar alterações
              </PrimaryButton>
            </Stack>
          </form>
        </ThemedPaper>

        {/* Security Section */}
        <ThemedPaper p="lg">
          <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
            <Stack gap="md">
              <Title order={4} style={{ fontFamily: '"Outfit", sans-serif' }}>
                Segurança
              </Title>

              <PasswordInput
                label="Senha atual"
                placeholder="Digite sua senha atual"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('currentPassword')}
              />

              <PasswordInput
                label="Nova senha"
                placeholder="Digite a nova senha"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('newPassword')}
              />

              <PasswordInput
                label="Confirmar nova senha"
                placeholder="Confirme a nova senha"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('confirmPassword')}
              />

              <Button
                type="submit"
                variant="light"
                leftSection={<IconLock size={16} />}
                style={{ alignSelf: 'flex-start' }}
                loading={isChangingPassword}
              >
                Alterar senha
              </Button>
            </Stack>
          </form>
        </ThemedPaper>

        <Divider />

        {/* Danger Zone */}
        <ThemedPaper p="lg" style={dangerZoneStyle}>
          <Stack gap="md">
            <Title order={4} c="rose" style={{ fontFamily: '"Outfit", sans-serif' }}>
              Zona de Perigo
            </Title>
            <Text size="sm" c="dimmed">
              Ações irreversíveis relacionadas à sua conta.
            </Text>
            <Button
              variant="outline"
              color="rose"
              leftSection={<IconTrash size={16} />}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setDeleteModalOpen(true)}
            >
              Excluir minha conta
            </Button>
          </Stack>
        </ThemedPaper>
      </Stack>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword('');
        }}
        title={
          <Text fw={600} c="rose">
            Excluir conta
          </Text>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente
            removidos. Para confirmar, digite sua senha abaixo.
          </Text>

          <PasswordInput
            label="Confirme sua senha"
            placeholder="Digite sua senha"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.currentTarget.value)}
            leftSection={<IconLock size={16} />}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletePassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              loading={isDeletingAccount}
              leftSection={<IconTrash size={16} />}
            >
              Excluir conta
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Photo Crop Modal */}
      <PhotoCropModal
        opened={cropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={handleCropModalClose}
        onConfirm={handleCroppedPhotoConfirm}
        isProcessing={isUploadingPhoto}
      />
    </Box>
  );
}
