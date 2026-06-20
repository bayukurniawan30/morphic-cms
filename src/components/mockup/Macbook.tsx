import React from 'react'

export default function Macbook({ children }: { children?: React.ReactNode }) {
  return (
    <div className='w-[608px] [perspective:2000px]'>
      <div className='relative w-full h-[420px] [transform:rotateX(73deg)] [transform-style:preserve-3d] origin-bottom'>
        <div className='absolute overflow-hidden aspect-video left-0 h-[342px] -top-[343px] bg-black border-[2px] border-[#404041] rounded-md [transform:rotateX(-70deg)] origin-bottom'>
          <div className='absolute bottom-0 w-full left-0 bg-zinc-900 h-3 flex items-center justify-center text-zinc-200 text-[6px] font-thin'>
            MacBook Air
          </div>
          <div className='absolute inset-1 mb-4 mx-1 mt-1 rounded-[3px] overflow-hidden'>
            <div className='relative w-full h-full rounded-[3px] overflow-hidden flex items-center justify-center bg-slate-900/10'>
              {children ? (
                children
              ) : (
                <>
                  <svg
                    className='text-slate-100 h-[66px]'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                  >
                    <path
                      fill='currentColor'
                      d='M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25'
                    />
                  </svg>
                  <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-48 bg-slate-500 blur-[80px]'></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className='w-[608px] h-[420px] bg-[#6F7072] rounded-[16px] border-b border-zinc-800 flex flex-col pb-3 items-start overflow-hidden'>
          <div className='absolute inset-0 mt-3 bg-[#646464] w-full h-full -z-10 rounded-[28px]' />
          <div className='absolute bottom-[8px] left-[241px] h-[8px] bg-zinc-700/50 w-[126px] rounded-t-full -mb-4 [transform:rotateX(210deg)]'></div>
          <div className='h-[6.94%] w-full relative'>
            <div className='absolute top-0 left-1/2 -translate-x-1/2 h-2 w-[75%] flex items-center'>
              <div className='w-[10%] bg-gradient-to-b from-black via-neutral-700 to-black h-full rounded-bl-sm' />
              <div className='flex-grow bg-gradient-to-b from-black via-black to-zinc-700 h-full' />
              <div className='w-[10%] bg-gradient-to-b from-black via-neutral-700 to-black h-full rounded-br-sm' />
            </div>
          </div>
          <div className='h-[50.42%] w-full relative flex'>
            <div
              className='my-[6px] w-[4.07%] mx-[2px]'
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,\
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4">\
              <circle cx="2" cy="2" r="0.8" fill="rgba(0, 0, 0, 0.2)"/>\
              </svg>")',
                backgroundRepeat: 'repeat',
                backgroundSize: '3px 3px',
              }}
            ></div>
            <div className='w-[91.86%] rounded-md border-neutral-600/60 border-opacity-70 border relative overflow-hidden flex flex-col p-[5px]'>
              <div className='absolute left-0 top-0 w-[2px] h-full bg-gradient-to-r from-neutral-600/20 via-neutral-800/10 to-transparent' />
              <div className='absolute right-0 top-0 w-[2px] h-full bg-gradient-to-l from-neutral-600/20 via-neutral-800/10 to-transparent' />
              <div className='absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-t from-neutral-600/20 via-neutral-800/10 to-transparent' />
              {/* Function keys row */}
              <div className='h-[10.03%] mb-[.6%] flex items-center gap-x-[3px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  esc
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F1
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F2
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F3
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F4
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F5
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F6
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F7
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F8
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F9
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F10
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F11
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex items-center justify-center text-[8px] text-neutral-400'>
                  F12
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] aspect-square h-full rounded-[4px]' />
              </div>
              {/* Number row */}
              <div className='h-[16.62%] mb-[.6%] flex items-center space-x-[2px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>~</div>
                  <div>`</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>!</div>
                  <div>1</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>@</div>
                  <div>2</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>#</div>
                  <div>3</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>$</div>
                  <div>4</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>%</div>
                  <div>5</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>^</div>
                  <div>6</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>&amp;</div>
                  <div>7</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>*</div>
                  <div>8</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>(</div>
                  <div>9</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>)</div>
                  <div>0</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>_</div>
                  <div>-</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>+</div>
                  <div>=</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-[1.3] flex items-end justify-end p-1 text-[8px] text-neutral-400'>
                  delete
                </div>
              </div>
              {/* QWERTY row */}
              <div className='h-[16.62%] mb-[.6%] flex items-center space-x-[2px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-[1.31] flex items-end justify-start p-1 text-[8px] text-neutral-400'>
                  tab
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>Q</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>W</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>E</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>R</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>T</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>Y</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>U</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>I</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>O</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>P</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>{'{'}</div>
                  <div>[</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>{'}'}</div>
                  <div>]</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>|</div>
                  <div>\</div>
                </div>
              </div>
              {/* ASDF row */}
              <div className='h-[16.62%] mb-[.6%] flex items-center space-x-[2px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-[1.5] flex items-end justify-start p-1 text-[8px] text-neutral-400'>
                  caps lock
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>A</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>S</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>D</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>F</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>G</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>H</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>J</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>K</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>L</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>:</div>
                  <div>;</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>"</div>
                  <div>'</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-[1.55] flex items-end justify-end p-1 text-[8px] text-neutral-400'>
                  return
                </div>
              </div>
              {/* ZXCV row */}
              <div className='h-[16.62%] mb-[.5%] flex items-center space-x-[2px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[3px] flex-[2] flex items-end justify-start p-1 text-[8px] text-neutral-400'>
                  shift
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>Z</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>X</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>C</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>V</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>B</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>N</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div />
                  <div>M</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>&lt;</div>
                  <div>,</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>&gt;</div>
                  <div>.</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[4px] flex-1 flex flex-col items-center justify-center text-[8px] text-neutral-400'>
                  <div>?</div>
                  <div>/</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full rounded-[3px] flex-[2] flex items-end justify-end p-1 text-[8px] text-neutral-400'>
                  shift
                </div>
              </div>
              {/* Bottom row */}
              <div className='h-[16.62%] flex items-end space-x-[2px] w-full'>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[1.2] rounded-[3px] flex flex-col items-center justify-center text-[8px] text-neutral-400 relative'>
                  <div className='absolute top-1 right-[6px]'>fn</div>
                  <div className='absolute bottom-1 left-1'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width={8}
                      height={8}
                      viewBox='0 0 24 24'
                    >
                      <path
                        fill='currentColor'
                        fillRule='evenodd'
                        d='M12 21.237a9.237 9.237 0 1 0 0-18.474a9.237 9.237 0 0 0 0 18.474m2.99-16.971c.36.387.685.838.97 1.335c.523.905.931 1.99 1.195 3.19q.623.156 1.166.348c.668.237 1.255.517 1.72.84a8.31 8.31 0 0 0-5.051-5.713m5.171 9.196c-.483.359-1.113.668-1.84.925q-.498.176-1.066.322c-.254 1.4-.7 2.66-1.294 3.69a7.4 7.4 0 0 1-.971 1.335a8.3 8.3 0 0 0 5.171-6.272m-11.15 6.272a7.4 7.4 0 0 1-.972-1.335c-.593-1.03-1.04-2.29-1.294-3.69a13 13 0 0 1-1.066-.322c-.727-.257-1.357-.566-1.84-.925a8.3 8.3 0 0 0 5.171 6.272M3.958 9.978c.465-.322 1.052-.602 1.72-.839q.543-.191 1.166-.348c.264-1.2.672-2.285 1.194-3.19a7.4 7.4 0 0 1 .971-1.335A8.31 8.31 0 0 0 3.96 9.978m11.18-3.905c.409.71.746 1.554.989 2.496a22.5 22.5 0 0 0-3.655-.354v-4.41c.978.19 1.918.97 2.666 2.268m1.204 3.504a21 21 0 0 0-3.87-.415v5.202c1.447-.028 2.792-.183 3.945-.43q.127-.932.128-1.934c0-.845-.071-1.658-.203-2.423m-4.818-5.773v4.41a22.5 22.5 0 0 0-3.654.355c.242-.942.58-1.787.988-2.496c.748-1.297 1.688-2.078 2.666-2.269m0 5.358a21 21 0 0 0-3.87.415A14.3 14.3 0 0 0 7.453 12c0 .667.044 1.314.128 1.933c1.153.248 2.498.403 3.945.43zm-5.531.87q.315-.11.663-.21a15.5 15.5 0 0 0-.062 3.865q-.315-.093-.601-.193c-.76-.269-1.34-.577-1.722-.896c-.385-.321-.515-.605-.515-.835s.13-.514.515-.835c.382-.319.962-.627 1.722-.895m2.865 7.895c-.479-.832-.86-1.85-1.105-2.992c1.138.219 2.418.351 3.771.376v4.885c-.978-.191-1.918-.972-2.666-2.27m3.614 2.269V15.31a22.4 22.4 0 0 0 3.771-.376c-.244 1.143-.626 2.16-1.105 2.992c-.748 1.297-1.688 2.078-2.666 2.269M17.494 12q0 .864-.09 1.687q.315-.092.601-.193c.76-.269 1.34-.577 1.722-.896c.385-.321.515-.605.515-.835s-.13-.514-.515-.835c-.382-.319-.962-.627-1.722-.895q-.315-.111-.663-.211c.1.7.153 1.429.153 2.178'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[1] rounded-[3px] relative flex items-end justify-center p-1 text-[8px] text-neutral-400'>
                  <div className='absolute top-1 right-1'>⌃</div>
                  <div>control</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[1] rounded-[3px] relative flex items-end justify-center p-1 text-[8px] text-neutral-400'>
                  <div className='absolute top-[1px] right-1'>⌥</div>
                  <div>option</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[.8] rounded-[3px] relative flex items-end justify-center p-1 text-[8px] text-neutral-400'>
                  <div className='absolute top-[1px] right-1'>⌘</div>
                  <div>command</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[7] rounded-[3px]'></div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[1] rounded-[3px] relative flex items-end p-1 text-[8px] text-neutral-400'>
                  <div className='absolute top-[1px] left-1'>⌘</div>
                  <div>command</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[.8] rounded-[3px] relative flex items-end justify-center p-1 text-[8px] text-neutral-400'>
                  <div className='absolute top-[1px] left-1'>⌥</div>
                  <div>option</div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-1/2 flex-[1.4] rounded-[3px] flex items-center justify-center text-[8px] text-neutral-400'>
                  <svg
                    className='rotate-180'
                    width={8}
                    height={5}
                    viewBox='0 0 8 8'
                  >
                    <polygon points='8,4 4,0 4,8' fill='currentColor' />
                  </svg>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-full flex-[1.4] rounded-[3px] flex flex-col gap-[1px]'>
                  <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] flex-1 rounded-t-[3px] flex items-center justify-center text-[8px] text-neutral-400'>
                    <svg width={8} height={5} viewBox='0 0 8 8'>
                      <polygon points='4,0 0,4 8,4' fill='currentColor' />
                    </svg>
                  </div>
                  <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] flex-1 rounded-b-[3px] flex items-center justify-center text-[8px] text-neutral-400'>
                    <svg width={8} height={5} viewBox='0 0 8 8'>
                      <polygon points='4,8 0,4 8,4' fill='currentColor' />
                    </svg>
                  </div>
                </div>
                <div className='bg-gradient-to-t from-black via-black to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.3)] h-1/2 flex-[1.4] rounded-[3px] flex items-center justify-center text-[8px] text-neutral-400'>
                  <svg
                    className='rotate-180'
                    width={8}
                    height={5}
                    viewBox='0 0 8 8'
                  >
                    <polygon points='0,4 4,0 4,8' fill='currentColor' />
                  </svg>
                </div>
              </div>
            </div>
            <div
              className='my-[6px] w-[4.07%] mx-[2px]'
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,\
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4">\
              <circle cx="2" cy="2" r="0.8" fill="rgba(0, 0, 0, 0.2)"/>\
              </svg>")',
                backgroundRepeat: 'repeat',
                backgroundSize: '3px 3px',
              }}
            ></div>
          </div>
          <div className='h-[42.64%] w-full relative flex flex-col items-center'>
            <div className='w-[40.41%] h-[91.56%] rounded-md border-neutral-600/60 border-opacity-70 border border-b-2 border- my-auto'></div>
          </div>
        </div>
      </div>
    </div>
  )
}
