'use client';

import { Computer, Moon, Sun } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useTheme } from 'next-themes';

const ThemeSwitch = () => {
  const { setTheme } = useTheme();
  return (
    <ToggleGroup
      type='single'
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
    >
      <ToggleGroupItem value='dark' onSelect={() => setTheme('dark')}>
        <Moon />
      </ToggleGroupItem>
      <ToggleGroupItem value='light' onSelect={() => setTheme('light')}>
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value='system' onSelect={() => setTheme('system')}>
        <Computer />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ThemeSwitch;
