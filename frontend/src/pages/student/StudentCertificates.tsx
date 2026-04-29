import { useQuery } from '@tanstack/react-query';
import { certificateAPI } from '../../lib/api';
import { Certificate } from '../../types';
import toast from 'react-hot-toast';

export default function StudentCertificates() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateAPI.mine().then(r => r.data.certificates as Certificate[]),
  });

  const certs = data ?? [];

  const handleDownload = async (cert: Certificate) => {
    try {
      const res = await certificateAPI.download(cert._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `certificate-${cert.certificateId}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">My Certificates</h1>
        <p className="text-slate-500">Issued automatically when you complete a course 100%</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…
        </div>
      ) : certs.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-slate-600 font-medium mb-1">No certificates yet.</p>
          <p className="text-sm text-slate-400">Complete a course to earn your first certificate!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {certs.map(cert => (
            <div key={cert._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6 relative overflow-hidden">
              {/* Decorative top stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center text-3xl mb-4">
                🎓
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2 leading-snug">{cert.course.title}</h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">Certificate ID:</span>
                <code className="text-xs text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{cert.certificateId}</code>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <button onClick={() => handleDownload(cert)} className="btn-primary w-full justify-center">
                ⬇ Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
