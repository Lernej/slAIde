interface BoxProps {
    children: React.ReactNode;
    className?: string;
}

export default function Box({children, className} : BoxProps) {
    const name = "Hello";
    return <div className={`flex ${className}`}>{children}</div>
}