// const GridGoalLogo = () => {
//   return (
//     <a href='/' className='flex items-center gap-2' aria-label='GridGoal Home'>
//       <div className='grid grid-cols-3 gap-0.5'>
//         <div className='w-2 h-2 bg-foreground rounded-sm'></div>
//         <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
//         <div className='w-2 h-2 bg-foreground rounded-sm'></div>
//         <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
//         <div className='w-2 h-2 bg-foreground rounded-sm'></div>
//         <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
//         <div className='w-2 h-2 bg-foreground rounded-sm'></div>
//         <div className='w-2 h-2 bg-green-600 rounded-sm'></div>
//         <div className='w-2 h-2 bg-foreground rounded-sm'></div>
//       </div>
//       <span className='font-bold text-lg'>GridGoal</span>
//     </a>
//   );
// };

// export default GridGoalLogo;

const GridGoalLogo = () => {
  // --- Calculation for SVG dimensions ---
  // Each square is 8x8px (w-2, h-2)
  // The gap is 2px (gap-0.5)
  // Total size: (3 squares * 8px) + (2 gaps * 2px) = 24 + 4 = 28px
  const size = 28;
  const squareSize = 8;
  const gap = 2;
  const cornerRadius = 2; // For rounded-sm

  return (
    <a href='/' className='flex items-center gap-2' aria-label='GridGoal Home'>
      {/* The div grid is replaced by this SVG element */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true' // Hide from screen readers as the text provides the label
      >
        {/* Row 1 */}
        <rect
          x={0}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={squareSize + gap}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={(squareSize + gap) * 2}
          y={0}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />

        {/* Row 2 */}
        <rect
          x={0}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={squareSize + gap}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={(squareSize + gap) * 2}
          y={squareSize + gap}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />

        {/* Row 3 */}
        <rect
          x={0}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
        <rect
          x={squareSize + gap}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='#16a34a'
        />
        <rect
          x={(squareSize + gap) * 2}
          y={(squareSize + gap) * 2}
          width={squareSize}
          height={squareSize}
          rx={cornerRadius}
          fill='currentColor'
        />
      </svg>

      <span className='font-bold text-lg'>GridGoal</span>
    </a>
  );
};

export default GridGoalLogo;
