import { useEffect, useState } from "react";

type TLapse = { days: number; hours: number; mins: number; secs: number };

export default function Countdown({ date }: { date: string }) {
  const [timeLeft, setTimeLeft] = useState<TLapse>({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const target = new Date(date).getTime();
    const id = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [date]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-6xl font-display font-semibold tracking-wide">
        {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.mins}m : {timeLeft.secs}s
      </div>
      <p className="mt-2 text-sm opacity-80">Cuenta regresiva para el gran día</p>
    </div>
  );
}
