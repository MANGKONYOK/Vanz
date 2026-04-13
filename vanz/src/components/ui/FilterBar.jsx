import Card from './Card';

export default function FilterBar({ children }) {
    return <Card className="p-4 mb-5 bg-white"><div className="flex flex-wrap gap-3 items-end">{children}</div></Card>;
}
