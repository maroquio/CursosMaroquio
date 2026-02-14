import { Menu, ActionIcon, Tooltip } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <Menu shadow="md" width={160}>
      <Menu.Target>
        <Tooltip label={t('common.language')}>
          <ActionIcon variant="subtle" size="lg" aria-label={t('common.language')}>
            <IconLanguage size={20} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t('common.language')}</Menu.Label>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.code}
            leftSection={<span>{lang.flag}</span>}
            onClick={() => handleLanguageChange(lang.code)}
            style={{
              fontWeight: currentLanguage.code === lang.code ? 600 : 400,
            }}
          >
            {lang.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
