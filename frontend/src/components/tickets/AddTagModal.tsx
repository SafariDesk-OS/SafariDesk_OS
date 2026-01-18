import React, { useState } from 'react';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { successNotification, errorNotification } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

interface AddTagModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onTagAdded: () => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({ ticketId, isOpen, onClose, onTagAdded }) => {
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = async () => {
    if (!tags.trim()) {
      errorNotification('Tags cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      await http.put(`${APIS.ADD_TAGS}/${ticketId}`, { tags: tags.split(',').map(tag => tag.trim()) });
      successNotification('Tags added successfully.');
      onTagAdded();
      onClose();
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Failed to add tags.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Tags"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add tags to this ticket, separated by commas.</p>
      <div className="space-y-4">
        <Input
          id="tags"
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., bug, feature, urgent"
          className="w-full"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddTag} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Tags'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTagModal;
