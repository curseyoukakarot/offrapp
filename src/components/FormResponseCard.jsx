import React from 'react';

const formatAnswer = (text) => {
  if (!text) return null;
  if (text.startsWith('http')) {
    return (
      <a
        href={text}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline flex items-center gap-2"
      >
        📎 View Uploaded File
      </a>
    );
  }
  return text.split('\n').map((line, i) => (
    <p key={i} className="whitespace-pre-line mb-2">{line}</p>
  ));
};

const FormResponseCard = ({ response, user }) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-6 border border-gray-200 hover:bg-gray-50">
      <div className="text-sm text-gray-500 mb-4">
        Submitted by <strong>{user?.full_name || 'Unknown User'}</strong> ({user?.email || 'No email'})
      </div>

      {Object.entries(response.answers).map(([question, answer]) => (
        <div key={question} className="mb-4">
          <p className="font-semibold text-gray-700">{question}</p>
          <div className="pl-2">{formatAnswer(answer)}</div>
        </div>
      ))}
    </div>
  );
};

export default FormResponseCard;
