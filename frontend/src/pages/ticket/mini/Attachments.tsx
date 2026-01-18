import React from 'react';
import { Paperclip } from 'lucide-react'; // Adjust import based on your icon library

type Attachment = {
  file_url: string;
};

type Summary = {
  total_attachments: number;
};

type Props = {
  attachments: Attachment[];
  summary: Summary;
};

const AttachmentList: React.FC<Props> = ({ attachments, summary }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Paperclip className="w-5 h-5 mr-2" />
          Attachments ({summary.total_attachments})
        </h2>
      </div>

      {attachments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No attachments</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center space-x-3">
                <Paperclip className="w-5 h-5 text-gray-400" />
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 truncate"
                >
                  {`Attachment ${index + 1}`}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentList;
