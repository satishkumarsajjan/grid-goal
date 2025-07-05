// 'use client';

// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import axios, { AxiosError } from 'axios';
// import { SessionVibe } from '@prisma/client';
// import { toast } from 'sonner';

// import { Button } from '@/components/ui/button';
// import {
//   SheetHeader,
//   SheetTitle,
//   SheetDescription,
//   SheetFooter,
// } from '@/components/ui/sheet';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Textarea } from '@/components/ui/textarea';
// import { cn } from '@/lib/utils';
// import { Input } from '../ui/input';
// import { useState } from 'react';

// // --- Type Definitions, Zod Schema, and API Function ---

// interface SessionSummaryPanelProps {
//   durationSeconds: number;
//   taskId: string;
//   goalId: string;
//   onSessionSaved: () => void; // This function will be called on success or cancel.
// }

// const summarySchema = z.object({
//   noteAccomplished: z.string().max(10000, 'Note is too long.').optional(),
//   noteNextStep: z.string().max(10000, 'Note is too long.').optional(),
//   vibe: z.nativeEnum(SessionVibe).optional(),
//   artifactUrl: z
//     .string()
//     .url('Please enter a valid URL.')
//     .optional()
//     .or(z.literal('')),
// });

// type SummaryFormValues = z.infer<typeof summarySchema>;

// const createFocusSession = async (payload: any) => {
//   const { data } = await axios.post('/api/focus-sessions', payload);
//   return data;
// };

// const VIBE_OPTIONS = [
//   { value: SessionVibe.FLOW, label: 'Flow', emoji: '😌' },
//   { value: SessionVibe.NEUTRAL, label: 'Neutral', emoji: '😐' },
//   { value: SessionVibe.STRUGGLE, label: 'Struggle', emoji: '😩' },
// ];

// // --- Main Component ---
// export function SessionSummaryPanel({
//   durationSeconds,
//   taskId,
//   goalId,
//   onSessionSaved,
// }: SessionSummaryPanelProps) {
//   const queryClient = useQueryClient();
//   const [tags, setTags] = useState<string[]>([]);

//   const form = useForm<SummaryFormValues>({
//     resolver: zodResolver(summarySchema),
//     defaultValues: {
//       noteAccomplished: '',
//       noteNextStep: '',
//       artifactUrl: '',
//     },
//   });

//   const mutation = useMutation({
//     mutationFn: createFocusSession,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
//       queryClient.invalidateQueries({ queryKey: ['gridData'] }); // Or whatever key your dashboard grid uses
//       queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
//       toast.success('Session saved successfully!');
//       onSessionSaved(); // Tell the parent component we are done
//     },
//     onError: (error: AxiosError) => {
//       console.error('Failed to save session:', error);
//       toast.error('Failed to save session. Please try again.');
//     },
//   });

//   function onSubmit(values: SummaryFormValues) {
//     const payload = {
//       ...values,
//       startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
//       endTime: new Date().toISOString(),
//       durationSeconds,
//       taskId,
//       goalId,
//       tags,
//     };
//     mutation.mutate(payload);
//   }

//   return (
//     <div className='flex flex-col h-full'>
//       <SheetHeader className='px-6 pt-6'>
//         <SheetTitle>Session Summary</SheetTitle>
//         <SheetDescription>
//           Great work! Log what you accomplished to keep the momentum going.
//         </SheetDescription>
//       </SheetHeader>
//       <Form {...form}>
//         <form
//           onSubmit={form.handleSubmit(onSubmit)}
//           className='flex flex-1 flex-col justify-between'
//         >
//           <div className='flex-1 space-y-6 px-6 mt-4 overflow-y-auto'>
//             <FormField
//               control={form.control}
//               name='vibe'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>How did it feel?</FormLabel>
//                   <FormControl>
//                     <div className='flex justify-around pt-2'>
//                       {VIBE_OPTIONS.map((vibe) => (
//                         <button
//                           type='button'
//                           key={vibe.value}
//                           onClick={() => field.onChange(vibe.value)}
//                           className={cn(
//                             'flex flex-col items-center gap-2 p-2 rounded-lg transition-all w-24',
//                             field.value === vibe.value
//                               ? 'bg-primary/10 text-primary ring-2 ring-primary'
//                               : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
//                           )}
//                         >
//                           <span className='text-3xl'>{vibe.emoji}</span>
//                           <span className='text-xs font-medium'>
//                             {vibe.label}
//                           </span>
//                         </button>
//                       ))}
//                     </div>
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='noteAccomplished'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>What did you accomplish?</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder='e.g., Finished the first draft of the API...'
//                       className='min-h-[100px]'
//                       {...field}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='noteNextStep'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>What's the very next step?</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder='e.g., Write unit tests for the GET endpoint...'
//                       className='min-h-[50px]'
//                       {...field}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='artifactUrl'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Link to Work (Optional)</FormLabel>
//                   <FormControl>
//                     <Input placeholder='https://figma.com/...' {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormItem>
//               <FormLabel>Tags (Optional)</FormLabel>
//               <FormControl>
//                 <Input
//                   placeholder='Type a tag and press Enter...'
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && e.currentTarget.value.trim()) {
//                       e.preventDefault();
//                       const newTag = e.currentTarget.value.trim();
//                       if (!tags.includes(newTag)) {
//                         setTags((prev) => [...prev, newTag]);
//                       }
//                       e.currentTarget.value = '';
//                     }
//                   }}
//                 />
//               </FormControl>
//               <div className='flex flex-wrap gap-2 mt-2'>
//                 {tags.map((tag) => (
//                   <div
//                     key={tag}
//                     className='bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs'
//                   >
//                     {tag}
//                   </div>
//                 ))}
//               </div>
//             </FormItem>
//           </div>
//           <SheetFooter className='p-6 border-t mt-auto'>
//             <Button
//               type='button'
//               variant='outline'
//               onClick={onSessionSaved}
//               disabled={mutation.isPending}
//             >
//               Cancel
//             </Button>
//             <Button type='submit' disabled={mutation.isPending}>
//               {mutation.isPending ? 'Saving...' : 'Save & Finish'}
//             </Button>
//           </SheetFooter>
//         </form>
//       </Form>
//     </div>
//   );
// }
