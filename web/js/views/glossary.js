/**
 * Personal Glossary View
 * Progressive vocabulary building - learner's own terms and definitions
 */

import { api } from '../api.js';
import { esc, ico, toast } from '../ui.js';

let currentLevel = 'all'; // all, beginner, intermediate, expert

/**
 * Main glossary view
 */
export async function glossary(screen) {
  const { terms, count } = await api('GET', `/api/glossary?limit=100`);
  
  screen.innerHTML = `
    <div class="container glossary-view">
      <header class="glossary-header">
        <div class="row-between">
          <div>
            <h1>📚 My Glossary</h1>
            <p class="subtitle">Your personal vocabulary - ${count} terms</p>
          </div>
          <button class="btn-primary" id="addTermBtn">
            + Add Term
          </button>
        </div>
      </header>
      
      <div class="level-filters">
        <button class="filter-btn ${currentLevel === 'all' ? 'active' : ''}" data-level="all">
          All (${count})
        </button>
        <button class="filter-btn ${currentLevel === 'beginner' ? 'active' : ''}" data-level="beginner">
          🌱 Beginner
        </button>
        <button class="filter-btn ${currentLevel === 'intermediate' ? 'active' : ''}" data-level="intermediate">
          🌿 Intermediate
        </button>
        <button class="filter-btn ${currentLevel === 'expert' ? 'active' : ''}" data-level="expert">
          🌳 Expert
        </button>
      </div>
      
      <div id="glossaryTerms">
        ${terms.length === 0 ? renderEmptyState() : renderTermsList(terms)}
      </div>
    </div>
  `;
  
  // Event listeners
  screen.querySelector('#addTermBtn')?.addEventListener('click', () => showAddTermModal());
  
  screen.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      currentLevel = btn.dataset.level;
      await filterGlossary(screen);
    });
  });
  
  screen.querySelectorAll('[data-delete-term]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const termId = btn.dataset.deleteTerm;
      await deleteTerm(termId, screen);
    });
  });
}

/**
 * Filter glossary by level
 */
async function filterGlossary(screen) {
  const url = currentLevel === 'all' 
    ? '/api/glossary?limit=100'
    : `/api/glossary?level=${currentLevel}&limit=100`;
  
  const { terms, count } = await api('GET', url);
  
  const termsContainer = screen.querySelector('#glossaryTerms');
  if (termsContainer) {
    termsContainer.innerHTML = terms.length === 0 
      ? `<div class="empty-state">
          <p>No ${currentLevel} terms yet</p>
          <button class="btn-soft" onclick="document.querySelector('[data-level=all]').click()">
            Show all terms
          </button>
        </div>`
      : renderTermsList(terms);
    
    // Re-attach delete listeners
    screen.querySelectorAll('[data-delete-term]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const termId = btn.dataset.deleteTerm;
        await deleteTerm(termId, screen);
      });
    });
  }
  
  // Update filter buttons
  screen.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === currentLevel);
  });
}

/**
 * Empty state
 */
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📖</div>
      <h2>Your glossary is empty</h2>
      <p>
        As you learn, add important terms here. Build your own 
        progressive vocabulary that grows with your understanding.
      </p>
      <button class="btn-primary mt16" onclick="document.querySelector('#addTermBtn').click()">
        Add your first term
      </button>
    </div>
  `;
}

/**
 * Render list of terms
 */
function renderTermsList(terms) {
  // Group by level
  const grouped = {
    beginner: terms.filter(t => t.level === 'beginner'),
    intermediate: terms.filter(t => t.level === 'intermediate'),
    expert: terms.filter(t => t.level === 'expert')
  };
  
  if (currentLevel !== 'all') {
    return `
      <div class="terms-list">
        ${terms.map(term => renderTermCard(term)).join('')}
      </div>
    `;
  }
  
  // Show grouped by level
  return `
    ${grouped.beginner.length > 0 ? `
      <div class="terms-section">
        <h3 class="section-title">🌱 Beginner</h3>
        <div class="terms-list">
          ${grouped.beginner.map(term => renderTermCard(term)).join('')}
        </div>
      </div>
    ` : ''}
    
    ${grouped.intermediate.length > 0 ? `
      <div class="terms-section">
        <h3 class="section-title">🌿 Intermediate</h3>
        <div class="terms-list">
          ${grouped.intermediate.map(term => renderTermCard(term)).join('')}
        </div>
      </div>
    ` : ''}
    
    ${grouped.expert.length > 0 ? `
      <div class="terms-section">
        <h3 class="section-title">🌳 Expert</h3>
        <div class="terms-list">
          ${grouped.expert.map(term => renderTermCard(term)).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * Individual term card
 */
function renderTermCard(term) {
  const levelEmojis = {
    beginner: '🌱',
    intermediate: '🌿',
    expert: '🌳'
  };
  
  const levelColors = {
    beginner: 'var(--good)',
    intermediate: 'var(--primary)',
    expert: 'var(--nim-deep)'
  };
  
  return `
    <div class="term-card">
      <div class="term-header">
        <div class="term-level" style="color: ${levelColors[term.level]}">
          ${levelEmojis[term.level]} ${term.level}
        </div>
        <button class="btn-icon-sm" data-delete-term="${term.id}" title="Delete term">
          ${ico.x}
        </button>
      </div>
      
      <h3 class="term-title">${esc(term.term)}</h3>
      <p class="term-definition">${esc(term.definition)}</p>
      
      ${term.source ? `
        <div class="term-meta">
          <span class="term-source">From: ${esc(term.source)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Show modal to add new term
 */
function showAddTermModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card glossary-modal">
      <div class="modal-header">
        <h2 class="modal-title">Add Term to Glossary</h2>
        <button class="modal-close" id="modalClose">
          ${ico.x.replace('<svg', '<svg width="20" height="20"')}
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="termInput">Term</label>
          <input 
            type="text" 
            class="input" 
            id="termInput" 
            placeholder="e.g., Closure, API, Responsive Design..."
            maxlength="100"
            autofocus
          />
        </div>
        
        <div class="form-group">
          <label for="definitionInput">Your Definition</label>
          <textarea 
            class="input" 
            id="definitionInput" 
            rows="4"
            placeholder="Explain it in your own words - that's how you know you understand it..."
            maxlength="1000"
          ></textarea>
          <div class="hint">Write it in your own words - teaching yourself</div>
        </div>
        
        <div class="form-group">
          <label>Level</label>
          <div class="level-selector">
            <button class="level-option active" data-level="beginner">
              <span class="level-icon">🌱</span>
              <span class="level-name">Beginner</span>
              <span class="level-desc">Just learning this</span>
            </button>
            <button class="level-option" data-level="intermediate">
              <span class="level-icon">🌿</span>
              <span class="level-name">Intermediate</span>
              <span class="level-desc">Can use it</span>
            </button>
            <button class="level-option" data-level="expert">
              <span class="level-icon">🌳</span>
              <span class="level-name">Expert</span>
              <span class="level-desc">Can teach it</span>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="sourceInput">Source (optional)</label>
          <input 
            type="text" 
            class="input" 
            id="sourceInput" 
            placeholder="e.g., Web Dev lesson, MDN docs, Socratic session..."
            maxlength="100"
          />
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-ghost" id="modalCancel">Cancel</button>
        <button class="btn-primary" id="modalSubmit">Add to Glossary</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  let selectedLevel = 'beginner';
  
  const termInput = overlay.querySelector('#termInput');
  const definitionInput = overlay.querySelector('#definitionInput');
  const sourceInput = overlay.querySelector('#sourceInput');
  const submitBtn = overlay.querySelector('#modalSubmit');
  const cancelBtn = overlay.querySelector('#modalCancel');
  const closeBtn = overlay.querySelector('#modalClose');
  
  // Level selection
  overlay.querySelectorAll('.level-option').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.level-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLevel = btn.dataset.level;
    });
  });
  
  const close = () => {
    overlay.remove();
  };
  
  const submit = async () => {
    const term = termInput.value.trim();
    const definition = definitionInput.value.trim();
    const source = sourceInput.value.trim();
    
    if (!term || term.length < 2) {
      termInput.classList.add('input-error');
      toast('Term must be at least 2 characters', 'bad');
      setTimeout(() => termInput.classList.remove('input-error'), 300);
      return;
    }
    
    if (!definition || definition.length < 10) {
      definitionInput.classList.add('input-error');
      toast('Definition must be at least 10 characters', 'bad');
      setTimeout(() => definitionInput.classList.remove('input-error'), 300);
      return;
    }
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding...';
      
      await api('POST', '/api/glossary', {
        term,
        definition,
        level: selectedLevel,
        source: source || 'Manual entry'
      });
      
      toast('Term added to glossary! 📚', 'ok');
      close();
      
      // Refresh the view
      const screen = document.querySelector('.screen');
      if (screen) {
        await glossary(screen);
      }
      
    } catch (err) {
      console.error('Failed to add term:', err);
      toast(err.message || 'Failed to add term', 'bad');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add to Glossary';
    }
  };
  
  // Event listeners
  submitBtn.addEventListener('click', submit);
  cancelBtn.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  
  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  
  definitionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/**
 * Delete a term
 */
async function deleteTerm(termId, screen) {
  if (!confirm('Remove this term from your glossary?')) return;
  
  try {
    await api('DELETE', `/api/glossary/${termId}`);
    toast('Term removed', 'ok');
    
    // Refresh the view
    await glossary(screen);
    
  } catch (err) {
    console.error('Failed to delete term:', err);
    toast(err.message || 'Failed to delete term', 'bad');
  }
}

/**
 * Export add term function for use in other views
 */
export function quickAddTerm(term, definition, level, source) {
  return api('POST', '/api/glossary', {
    term,
    definition,
    level,
    source
  });
}
