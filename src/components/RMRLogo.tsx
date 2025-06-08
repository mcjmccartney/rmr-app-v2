import Image from 'next/image';

interface RMRLogoProps {
  size?: number;
  className?: string;
}

export default function RMRLogo({ size = 40, className = "" }: RMRLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-lg overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="https://i.ibb.co/bgkZYH61/RMR.jpg"
        alt="RMR Logo"
        width={size}
        height={size}
        className="object-cover"
        priority
      />
    </div>
  );
}
