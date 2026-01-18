import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Mail, Phone, Edit, Trash, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { successNotification, errorNotification } from '../../components/ui/Toast';

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  organization?: string;
}

interface TicketSummary {
  id: number;
  ticket_id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

const emptyForm = { name: '', email: '', phone: '', notes: '', tags: '' };

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

const ContactPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [closedTicketCount, setClosedTicketCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });

  const fetchContacts = async (query?: string) => {
    setLoading(true);
    try {
      const response = await http.get(APIS.CONTACTS, {
        params: { search: query || undefined },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.data || [];
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      errorNotification('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactDetail = async (contact: Contact) => {
    setDetailLoading(true);
    try {
      const res = await http.get(`${APIS.CONTACTS}${contact.id}/`);
      const detail = res.data;
      setSelectedContact(detail);

      // Load recent tickets by matching email
      if (detail?.email) {
        const ticketsRes = await http.get(APIS.LIST_TICKETS, {
          params: { search: detail.email, page_size: 5 },
        });
        const ticketData = Array.isArray(ticketsRes.data)
          ? ticketsRes.data
          : ticketsRes.data?.results || [];
        setTickets(ticketData);
        
        // Calculate open and closed ticket counts
        const openCount = ticketData.filter(t => t.status !== 'closed').length;
        const closedCount = ticketData.filter(t => t.status === 'closed').length;
        setOpenTicketCount(openCount);
        setClosedTicketCount(closedCount);
      } else {
        setTickets([]);
        setOpenTicketCount(0);
        setClosedTicketCount(0);
      }
    } catch (error) {
      console.error('Error loading contact detail:', error);
      errorNotification('Failed to load contact details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    return contacts.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term)
      );
    });
  }, [contacts, searchTerm]);

  const openCreate = () => {
    setFormMode('create');
    setFormData(emptyForm);
    setShowFormModal(true);
  };

  const openEdit = (contact: Contact) => {
    setFormMode('edit');
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      tags: (contact.tags || []).join(', '),
    });
    setShowFormModal(true);
    setSelectedContact(contact);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      errorNotification('Name is required');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      errorNotification('Provide at least email or phone');
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      notes: formData.notes,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };
    try {
      if (formMode === 'create') {
        await http.post(APIS.CONTACTS, payload);
        successNotification('Contact created');
      } else if (selectedContact) {
        await http.put(`${APIS.CONTACTS}${selectedContact.id}/`, payload);
        successNotification('Contact updated');
      }
      setShowFormModal(false);
      setSelectedContact(null);
      setFormData(emptyForm);
      fetchContacts();
    } catch (error: any) {
      console.error('Save contact error:', error);
      const detail =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        'Failed to save contact';
      errorNotification(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    setDeletingId(contactId);
    try {
      await http.delete(`${APIS.CONTACTS}${contactId}/`);
      successNotification('Contact deleted');
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
        setTickets([]);
      }
      fetchContacts();
    } catch (error) {
      console.error('Delete contact error:', error);
      errorNotification('Failed to delete contact');
    } finally {
      setDeletingId(null);
      setConfirmDelete({ show: false, id: null });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer contacts for your workspace</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          New Contact
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm">
        <Input
          icon={Search}
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={() => fetchContacts(searchTerm)}>
          Apply
        </Button>
        <Button variant="ghost" onClick={() => { setSearchTerm(''); fetchContacts(); }}>
          Reset
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800 shadow-sm">
        {loading ? (
          <div className="p-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading contacts...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">No contacts found.</div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                  {initials(contact.name || '')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{contact.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {contact.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={14} /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={14} /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={() => fetchContactDetail(contact)}
                >
                  View details
                </button>
                <div className="relative flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEdit(contact)} />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash}
                    onClick={() => setConfirmDelete({ show: true, id: contact.id })}
                    disabled={deletingId === contact.id}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Details Drawer (Modal) */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => { setSelectedContact(null); setTickets([]); }}
        title="Contact Details"
        size="lg"
      >
        {detailLoading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Loader2 className="animate-spin" size={18} />
            Loading...
          </div>
        )}
        {!detailLoading && selectedContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                {initials(selectedContact.name || '')}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedContact.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-2 flex-wrap">
                  {selectedContact.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={14} /> {selectedContact.email}
                    </span>
                  )}
                  {selectedContact.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={14} /> {selectedContact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedContact.organization && (
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Organization</div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {selectedContact.organization}
                </p>
              </div>
            )}

            {/* Ticket Statistics */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{openTicketCount}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Open Tickets</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{closedTicketCount}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Closed Tickets</p>
              </div>
            </div>

            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1 pt-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedContact.notes && (
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                  {selectedContact.notes}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent tickets</h3>
                <Badge variant="default">{tickets.length}</Badge>
              </div>
              {tickets.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No tickets linked to this contact yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li
                      key={t.id}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50/40 dark:hover:bg-gray-800/80 transition"
                    >
                      <a href={`/ticket/${t.ticket_id}`} className="block">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {t.title}
                          </div>
                          <Badge variant="default">{t.ticket_id}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 mt-1">
                          <span>Status: {t.status}</span>
                          <span>Priority: {t.priority}</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => openEdit(selectedContact)}>
                Edit Contact
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete({ show: true, id: selectedContact.id })}
                disabled={deletingId === selectedContact.id}
                icon={Trash}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Contact Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setFormData(emptyForm); }}
        title={formMode === 'create' ? 'New Contact' : 'Edit Contact'}
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowFormModal(false); setFormData(emptyForm); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? Loader2 : undefined}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        show={confirmDelete.show}
        message="Are you sure you want to delete this customer?"
        variant="danger"
        state={deletingId !== null}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        cancel={() => setConfirmDelete({ show: false, id: null })}
      />
    </div>
  );
};

export default ContactPage;
