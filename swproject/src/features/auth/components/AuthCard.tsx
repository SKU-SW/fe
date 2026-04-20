interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-8 pb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">{subtitle}</p>
      </div>
      <div className="px-8 pb-8">{children}</div>
    </div>
  );
}