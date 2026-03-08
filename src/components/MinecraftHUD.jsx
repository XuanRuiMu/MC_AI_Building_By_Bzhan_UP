import React from 'react';
import useStore from '../store/useStore';

export default function MinecraftHUD() {
    const isLocked = useStore(state => state.isLocked);
    const isFlying = useStore(state => state.isFlying);
    const controlMode = useStore(state => state.controlMode);
    const flySpeed = useStore(state => state.flySpeed);

    if (controlMode !== 'minecraft') return null;

    // Calculate speed percentage for the bar using log scale
    // level = log10(speed) * 10, range -10 to +10
    // percent = (level + 10) / 20 * 100
    const speedLevel = Math.log10(flySpeed) * 10;
    const speedPercent = ((speedLevel + 10) / 20) * 100;

    return (
        <div className="absolute inset-0 pointer-events-none z-[1000] flex flex-col items-center justify-center">
            {/* CROSSHAIR - Only visible when mouse is locked */}
            {isLocked && (
                <div className="relative w-6 h-6 opacity-80">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2 shadow-[0_0_3px_rgba(0,0,0,0.5)]" />
                    <div className="absolute left-1/2 top-0 w-[2px] h-full bg-white -translate-x-1/2 shadow-[0_0_3px_rgba(0,0,0,0.5)]" />
                </div>
            )}

            {/* SPEED INDICATOR - Right side, only when locked and flying */}
            {isLocked && isFlying && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    {/* Speed Bar */}
                    <div className="w-3 h-40 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 overflow-hidden flex flex-col-reverse">
                        <div
                            className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-150 rounded-full"
                            style={{ height: `${speedPercent}%` }}
                        />
                    </div>

                    {/* Speed Value */}
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                        <div className="text-cyan-400 font-mono font-bold text-lg text-center">
                            x{flySpeed.toFixed(1)}
                        </div>
                        <div className="text-[8px] text-neutral-400 text-center tracking-tight">
                            SPEED
                        </div>
                    </div>

                    {/* Scroll hint */}
                    <div className="text-[10px] text-neutral-500 text-center">
                        <span className="text-neutral-400">↕</span> SCROLL
                    </div>
                </div>
            )}

            {/* INSTRUCTIONS - Only visible when mouse is NOT locked */}
            {!isLocked && (
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-2xl font-black tracking-widest text-amber-400 mb-2">GAME MODE</h2>
                    <p className="text-white/80 font-bold mb-6">Click anywhere to start playing</p>

                    <div className="bg-white/5 p-5 rounded-xl space-y-3 text-sm">
                        <div className="flex justify-between gap-8 text-neutral-400">
                            <span>Move</span>
                            <span className="text-blue-400 font-mono font-bold">W A S D</span>
                        </div>
                        <div className="flex justify-between gap-8 text-neutral-400">
                            <span>Jump / Fly Up</span>
                            <span className="text-blue-400 font-mono font-bold">SPACE</span>
                        </div>
                        <div className="flex justify-between gap-8 text-neutral-400">
                            <span>Fly Down</span>
                            <span className="text-blue-400 font-mono font-bold">SHIFT</span>
                        </div>
                        <div className="flex justify-between gap-8 text-neutral-400">
                            <span>Toggle Flight</span>
                            <span className="text-amber-500 font-mono font-bold">Double SPACE</span>
                        </div>
                        <div className="flex justify-between gap-8 text-neutral-400">
                            <span>Adjust Fly Speed</span>
                            <span className="text-cyan-400 font-mono font-bold">SCROLL</span>
                        </div>
                        <div className="flex justify-between gap-8 text-neutral-400 pt-2 border-t border-white/5">
                            <span>Exit Mode</span>
                            <span className="text-red-400 font-mono font-bold">ESC</span>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM STATUS BAR - Fixed position, won't affect layout */}
            <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-3 transition-all duration-300 ${isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                style={{ background: 'rgba(0,0,0,0.4)' }}>
                <span className="text-lg">{isFlying ? '☁️' : '🚶'}</span>
                <span className={`text-xs font-black tracking-tighter ${isFlying ? 'text-blue-300' : 'text-neutral-300'}`}>
                    {isFlying ? 'FLYING MODE' : 'WALKING MODE'}
                </span>
                {isFlying && (
                    <span className="text-xs text-cyan-400 font-mono ml-2">
                        x{flySpeed.toFixed(1)}
                    </span>
                )}
            </div>
        </div>
    );
}
