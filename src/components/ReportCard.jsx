import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/authContext';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function ReportCard({ report }) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(report.likes || 0);
  const [dislikes, setDislikes] = useState(report.dislikes || 0);
  const [userVote, setUserVote] = useState(null);
  const [isVerified, setIsVerified] = useState(report.verified || false);

  useEffect(() => {
    // Check user's existing vote
    if (currentUser) {
      getDoc(doc(db, 'reports', report.id, 'votes', currentUser.uid))
        .then(snap => {
          if (snap.exists()) {
            setUserVote(snap.data().vote);
          }
        });
    }
  }, [currentUser, report.id]);

  const handleVote = async (vote) => {
    if (!currentUser) {
      toast.error('Please sign in to vote');
      return;
    }

    const voteRef = doc(db, 'reports', report.id, 'votes', currentUser.uid);
    
    try {
      // Update user's vote
      if (userVote === vote) {
        // Remove vote
        await updateDoc(voteRef, { vote: null });
        if (vote === 'up') setLikes(likes - 1);
        else setDislikes(dislikes - 1);
        setUserVote(null);
      } else if (userVote === null) {
        // New vote
        await setDoc(voteRef, { vote });
        if (vote === 'up') setLikes(likes + 1);
        else setDislikes(dislikes + 1);
        setUserVote(vote);
      } else {
        // Change vote
        await updateDoc(voteRef, { vote });
        if (vote === 'up') {
          setLikes(likes + 1);
          setDislikes(dislikes - 1);
        } else {
          setLikes(likes - 1);
          setDislikes(dislikes + 1);
        }
        setUserVote(vote);
      }

      // Update report document
      const newLikes = vote === 'up' ? (userVote === 'down' ? likes + 2 : likes + 1) : likes;
      const newDislikes = vote === 'down' ? (userVote === 'up' ? dislikes + 2 : dislikes + 1) : dislikes;
      
      await updateDoc(doc(db, 'reports', report.id), {
        likes: newLikes,
        dislikes: newDislikes
      });

      // Check if should be verified (≥5 likes and <3 dislikes)
      const finalLikes = vote === 'up' ? likes + 1 : (vote === 'down' ? likes : likes - 1);
      const finalDislikes = vote === 'down' ? dislikes + 1 : (vote === 'up' ? dislikes : dislikes - 1);

      if (finalLikes >= 5 && finalDislikes < 3) {
        await updateDoc(doc(db, 'reports', report.id), {
          verified: true
        });
        setIsVerified(true);
        toast.success('Report verified by community!');
      }

      toast.success('Vote recorded');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {report.type}
            </span>
            {isVerified && (
              <span className="inline-flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold mb-2">{report.type}</h3>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{report.description}</p>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleVote('up')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              userVote === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-green-100'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{likes}</span>
          </button>
          <button
            onClick={() => handleVote('down')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              userVote === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-red-100'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{dislikes}</span>
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default ReportCard;

