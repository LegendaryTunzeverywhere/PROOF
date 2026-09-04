/**
 * Final release hardening.
 * Disabled controls are not treated as loading controls.
 */

const style = document.createElement('style');
style.id = 'proof-release-hardening';
style.textContent = `
  /* The legacy polish layer attaches a spinner to disabled buttons. Override
     that behavior globally: disabled means unavailable, not loading. */
  button:disabled::after {
    content: none !important;
    animation: none !important;
  }

  /* Only an explicit loading state gets a spinner. */
  button.is-loading {
    position: relative;
    pointer-events: none;
    cursor: wait;
  }

  button.is-loading::after {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    width: 14px;
    height: 14px;
    margin-top: -7px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: proof-release-spin .6s linear infinite;
    opacity: .65;
  }

  @keyframes proof-release-spin {
    to { transform: rotate(360deg); }
  }
`;

document.head.appendChild(style);
