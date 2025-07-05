'use client';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { X } from 'lucide-react';
import * as React from 'react';

interface TagInputProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  // Optional: Pass existing tags from the user for autocompletion
  existingTags?: string[];
}

export function TagInput({ tags, setTags, existingTags = [] }: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const filteredSuggestions = existingTags.filter(
    (tag) =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className='w-full'>
      <div className='flex flex-wrap gap-2 rounded-md border border-input bg-background p-2'>
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant='secondary'
            className='flex items-center gap-1'
          >
            {tag}
            <button
              type='button'
              onClick={() => removeTag(tag)}
              className='rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
              aria-label={`Remove ${tag}`}
            >
              <X className='h-3 w-3' />
            </button>
          </Badge>
        ))}
        <Command className='flex-1 bg-transparent'>
          <div className='relative'>
            <CommandInput
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              placeholder={
                tags.length > 0 ? '' : 'Type a tag and press Enter...'
              }
              className='h-6 border-none p-0 focus:ring-0'
            />
            {showSuggestions &&
              inputValue &&
              filteredSuggestions.length > 0 && (
                <div className='absolute w-full z-10 top-full mt-2 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
                  <CommandGroup>
                    {filteredSuggestions.map((tag) => (
                      <CommandItem
                        key={tag}
                        onMouseDown={(e) => e.preventDefault()} // Prevent onBlur from firing
                        onSelect={() => {
                          setTags([...tags, tag]);
                          setInputValue('');
                        }}
                      >
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )}
          </div>
        </Command>
      </div>
    </div>
  );
}
