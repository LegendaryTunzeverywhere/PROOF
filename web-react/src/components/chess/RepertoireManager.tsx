/**
 * RepertoireManager Component
 * 
 * Manage and practice chess opening repertoire.
 * Create, edit, delete, and track opening performance.
 */

import React, { useState, useEffect } from 'react';
import { ChessBoard } from './ChessBoard';
import { repertoireApi } from '../../services/chess';
import type {
  ChessOpeningRepertoire,
  RepertoireManagerProps,
  ChessColor,
} from '../../types/chess';

export const RepertoireManager: React.FC<RepertoireManagerProps> = () => {
  const [repertoire, setRepertoire] = useState<ChessOpeningRepertoire[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<ChessOpeningRepertoire | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load repertoire on mount
  useEffect(() => {
    loadRepertoire();
  }, []);

  const loadRepertoire = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await repertoireApi.getAll();
      setRepertoire(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repertoire');
      console.error('Repertoire load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (opening: Partial<ChessOpeningRepertoire>) => {
    try {
      const created = await repertoireApi.create(opening);
      setRepertoire([...repertoire, created]);
      setIsCreating(false);
      setSelectedOpening(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create opening');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ChessOpeningRepertoire>) => {
    try {
      const updated = await repertoireApi.update(id, updates);
      setRepertoire(repertoire.map((o) => (o.id === id ? updated : o)));
      setSelectedOpening(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update opening');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opening?')) return;

    try {
      await repertoireApi.delete(id);
      setRepertoire(repertoire.filter((o) => o.id !== id));
      setSelectedOpening(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete opening');
    }
  };

  if (loading) {
    return (
      <div className="repertoire-manager loading">
        <div className="loading-spinner">Loading repertoire...</div>
      </div>
    );
  }

  return (
    <div className="repertoire-manager">
      {/* Header */}
      <div className="repertoire-header">
        <h2>Opening Repertoire</h2>
        <button
          className="btn btn-add-opening"
          onClick={() => setIsCreating(true)}
        >
          ➕ Add Opening
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="btn-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <div className="repertoire-content">
        {/* Sidebar */}
        <div className="repertoire-sidebar">
          {repertoire.length === 0 ? (
            <div className="empty-repertoire">
              <p>No openings yet.</p>
              <p>Click "Add Opening" to get started!</p>
            </div>
          ) : (
            <div className="openings-list">
              {repertoire.map((opening) => (
                <OpeningListItem
                  key={opening.id}
                  opening={opening}
                  isSelected={selectedOpening?.id === opening.id}
                  onClick={() => {
                    setSelectedOpening(opening);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="repertoire-main">
          {isCreating ? (
            <OpeningForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          ) : isEditing && selectedOpening ? (
            <OpeningForm
              opening={selectedOpening}
              onSubmit={(updates) => handleUpdate(selectedOpening.id, updates)}
              onCancel={() => setIsEditing(false)}
            />
          ) : selectedOpening ? (
            <OpeningDetail
              opening={selectedOpening}
              onEdit={() => setIsEditing(true)}
              onDelete={() => handleDelete(selectedOpening.id)}
            />
          ) : (
            <div className="empty-state">
              <p>Select an opening or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

interface OpeningListItemProps {
  opening: ChessOpeningRepertoire;
  isSelected: boolean;
  onClick: () => void;
}

const OpeningListItem: React.FC<OpeningListItemProps> = ({
  opening,
  isSelected,
  onClick,
}) => (
  <div
    className={`opening-item ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="opening-item-header">
      <div className="opening-name">{opening.name}</div>
      <div className="opening-color">
        {opening.color === 'white' ? '⚪' : '⚫'}
      </div>
    </div>
    <div className="opening-meta">
      {opening.eco && <span className="opening-eco">{opening.eco}</span>}
      <span className="opening-games">{opening.timesPlayed} games</span>
    </div>
    {opening.accuracy > 0 && (
      <div className="opening-accuracy">
        <div className="accuracy-bar">
          <div
            className="accuracy-fill"
            style={{ width: `${opening.accuracy}%` }}
          />
        </div>
        <span className="accuracy-text">{opening.accuracy}%</span>
      </div>
    )}
  </div>
);

interface OpeningDetailProps {
  opening: ChessOpeningRepertoire;
  onEdit: () => void;
  onDelete: () => void;
}

const OpeningDetail: React.FC<OpeningDetailProps> = ({
  opening,
  onEdit,
  onDelete,
}) => {
  const winRate =
    opening.timesPlayed > 0
      ? Math.round((opening.gamesWon / opening.timesPlayed) * 100)
      : 0;

  return (
    <div className="opening-detail">
      <div className="detail-header">
        <h3>{opening.name}</h3>
        <div className="detail-actions">
          <button className="btn btn-edit" onClick={onEdit}>
            ✏️ Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Opening info */}
      <div className="opening-info">
        {opening.eco && (
          <div className="info-item">
            <span className="info-label">ECO Code:</span>
            <span className="info-value">{opening.eco}</span>
          </div>
        )}
        <div className="info-item">
          <span className="info-label">Color:</span>
          <span className="info-value">
            {opening.color === 'white' ? '⚪ White' : '⚫ Black'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Last Practiced:</span>
          <span className="info-value">
            {new Date(opening.lastPracticed).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Chessboard */}
      <div className="opening-board">
        <ChessBoard
          initialFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          disabled
          orientation={opening.color}
        />
      </div>

      {/* Statistics */}
      <div className="opening-stats">
        <h4>Performance</h4>
        <div className="stats-grid-small">
          <div className="stat-item">
            <span className="stat-label">Games Played</span>
            <span className="stat-value">{opening.timesPlayed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{winRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{opening.accuracy}%</span>
          </div>
        </div>
        <div className="record">
          <span className="record-wins">{opening.gamesWon}W</span>
          <span className="record-separator">-</span>
          <span className="record-losses">{opening.gamesLost}L</span>
          <span className="record-separator">-</span>
          <span className="record-draws">{opening.gamesDrawn}D</span>
        </div>
      </div>

      {/* Notes */}
      <div className="opening-notes">
        <h4>Notes</h4>
        {opening.notes ? (
          <p className="notes-text">{opening.notes}</p>
        ) : (
          <p className="notes-empty">No notes yet. Click Edit to add notes.</p>
        )}
      </div>
    </div>
  );
};

interface OpeningFormProps {
  opening?: ChessOpeningRepertoire;
  onSubmit: (opening: Partial<ChessOpeningRepertoire>) => void;
  onCancel: () => void;
}

const OpeningForm: React.FC<OpeningFormProps> = ({
  opening,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(opening?.name || '');
  const [color, setColor] = useState<ChessColor>(opening?.color || 'white');
  const [eco, setEco] = useState(opening?.eco || '');
  const [notes, setNotes] = useState(opening?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      color,
      eco: eco || null,
      notes,
      moves: [], // TODO: Add move input
    });
  };

  return (
    <form className="opening-form" onSubmit={handleSubmit}>
      <h3>{opening ? 'Edit Opening' : 'New Opening'}</h3>

      <div className="form-group">
        <label htmlFor="name">Opening Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sicilian Defense"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="color">Play as *</label>
        <select
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value as ChessColor)}
        >
          <option value="white">⚪ White</option>
          <option value="black">⚫ Black</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="eco">ECO Code</label>
        <input
          id="eco"
          type="text"
          value={eco}
          onChange={(e) => setEco(e.target.value.toUpperCase())}
          placeholder="e.g., B90"
          maxLength={3}
        />
        <small>Optional: Encyclopedia of Chess Openings code</small>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes, key ideas, variations..."
          rows={6}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {opening ? 'Update' : 'Create'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RepertoireManager;
