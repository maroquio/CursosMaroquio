import { memo, type ReactNode } from 'react';
import { ActionIcon, Menu } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  color?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  dividerAfter?: string[];
}

export const ActionMenu = memo(function ActionMenu({
  items,
  dividerAfter = [],
}: ActionMenuProps) {
  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {items.map((item) => (
          <div key={item.key}>
            <Menu.Item
              leftSection={item.icon}
              color={item.color}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.label}
            </Menu.Item>
            {dividerAfter.includes(item.key) && <Menu.Divider />}
          </div>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
});

export default ActionMenu;
