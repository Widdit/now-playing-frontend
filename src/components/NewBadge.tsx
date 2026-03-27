import React from "react";

export const NewBadge = () => {
  return (
    <div className="relative w-fit">
      <div className="h-full w-fit py-1 px-2 rounded-lg relative text-xs font-bold uppercase bg-lime-800/30 text-lime-500 font-poppins">
        New
      </div>
      <svg
        className="w-10 h-full absolute -top-2 -right-5"
        viewBox="0 0 64 64"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#f9be19">
          <path d="m24 4 5.303 9.697 9.697 5.303-9.697 5.303-5.303 9.697-5.303-9.697-9.697-5.303 9.697-5.303z" />
          <path d="m45 29 3.536 6.464 6.464 3.536-6.464 3.536-3.536 6.464-3.536-6.464-6.464-3.536 6.464-3.536z" />
          <path d="m24 50 1.768 3.232 3.232 1.768-3.232 1.768-1.768 3.232-1.768-3.232-3.232-1.768 3.232-1.768z" />
        </g>
      </svg>
    </div>
  );
};
