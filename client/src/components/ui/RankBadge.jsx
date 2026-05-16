export default function RankBadge({ rank }) {
    if (rank === 1) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-amber-400 text-white text-xs font-black">#1</span>;
    if (rank === 2) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-slate-400 text-white text-xs font-black">#2</span>;
    if (rank === 3) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-black">#3</span>;
    return <span className="text-slate-500 font-mono text-sm">#{rank}</span>;
}
