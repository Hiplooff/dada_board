import React from 'react';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={"flex min-h-[80px] w-full rounded-md border border-white/50 bg-black px-3 py-2 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 " + className}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea }; 