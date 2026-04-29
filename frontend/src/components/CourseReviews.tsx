import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesAPI } from '../lib/api';
import { CourseReview } from '../types';
import toast from 'react-hot-toast';

interface Props { courseId: string; isEnrolled: boolean; }

export default function CourseReviews({ courseId, isEnrolled }: Props) {
  const qc = useQueryClient();
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => coursesAPI.reviews(courseId).then(r => r.data),
  });

  const reviews: CourseReview[] = data?.reviews ?? [];
  const avg: number             = data?.averageRating ?? 0;
  const total: number           = data?.totalReviews ?? 0;

  const addMutation = useMutation({
    mutationFn: () => coursesAPI.addReview(courseId, { rating, comment }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setComment(''); setShowForm(false);
      qc.invalidateQueries({ queryKey: ['reviews', courseId] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reviews</h3>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-base ${s <= Math.round(avg) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
              <span className="text-slate-600 text-sm font-medium">{avg.toFixed(1)} <span className="text-slate-400">({total})</span></span>
            </div>
          )}
        </div>
        {isEnrolled && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-secondary text-sm">Write a review</button>
        )}
      </div>

      {showForm && (
        <div className="card mb-5 bg-indigo-50 border-indigo-200">
          <div className="flex gap-1 mb-4">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)}
                className={`text-2xl transition-all duration-150 hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience with this course…"
            className="input resize-none h-24 mb-4" />
          <div className="flex gap-2">
            <button onClick={() => addMutation.mutate()} disabled={!comment.trim() || addMutation.isPending} className="btn-primary">
              {addMutation.isPending ? 'Submitting…' : 'Submit review'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r._id} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                {r.student.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{r.student.name}</div>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-xs ${s <= r.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
            <p className="text-slate-600 text-sm">{r.comment}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-6">No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
