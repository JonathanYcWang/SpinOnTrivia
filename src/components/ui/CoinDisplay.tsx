import Image from "next/image";

export function CoinDisplay({ value }: { value: number }) {
  return (
    <span
      aria-label={`${value} coins`}
      className="inline-flex items-center gap-1 align-middle leading-none tabular-nums"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="h-[1.33em] w-[1.33em] shrink-0 object-contain"
        height={24}
        src="/coin.svg"
        width={24}
      />
      <span className="text-[1.33em] leading-none">{value}</span>
    </span>
  );
}
